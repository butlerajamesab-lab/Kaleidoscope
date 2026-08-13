import { executeProject2025VerticalSlice } from './project2025-vertical-slice.mjs';
import { sha256Hex } from './hash.mjs';

export const PERSISTENCE_PLAN_VERSION = '1.0.0';
export const PERSISTENCE_TARGET_SCHEMA = 'kaleidoscope';

const TARGET_TABLES = [
  'source_binding',
  'source_artifact',
  'state_snapshot',
  'state_snapshot_source',
  'state_snapshot_artifact',
  'state_component',
  'state_component_source',
  'state_component_artifact',
  'change_set',
  'change_operation',
  'lens_manifest',
  'scenario',
  'scenario_lens',
  'projection_run',
  'lens_result',
  'cross_lens_collision',
  'collision_lens_result',
  'replay_receipt',
  'projection_run_event'
];

function fail(code, detail = '') {
  throw new Error(`invalid_persistence_plan:${code}${detail ? `:${detail}` : ''}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object_required', label);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) fail('array_required', label);
  return value;
}

function string(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('string_required', label);
  return value;
}

function sourceArtifactIndex(sourceManifest) {
  const manifest = record(sourceManifest, 'source_manifest');
  string(manifest.manifest_id, 'source_manifest.manifest_id');
  const index = new Map();
  for (const entry of array(manifest.entries, 'source_manifest.entries')) {
    const row = record(entry, 'source_manifest.entry');
    const name = string(row.source_file_name, 'source_manifest.entry.source_file_name');
    const hash = string(row.sha256, 'source_manifest.entry.sha256');
    if (!/^[0-9a-f]{64}$/.test(hash)) fail('source_manifest_sha256_required', name);
    if (!Number.isInteger(row.byte_length) || row.byte_length < 0) fail('source_manifest_byte_length_required', name);
    if (index.has(name)) fail('duplicate_source_artifact_name', name);
    index.set(name, row);
  }
  return { manifest, index };
}

function tablePlan(table, mappingState, candidateRecordCount, dependencies = [], unresolvedConditions = []) {
  if (!TARGET_TABLES.includes(table)) fail('unknown_target_table', table);
  return {
    table,
    mapping_state: mappingState,
    candidate_record_count: candidateRecordCount,
    dependencies: [...dependencies].sort(),
    unresolved_conditions: [...unresolvedConditions].sort(),
    write_executed: false
  };
}

export function buildDeterministicPersistencePlan({ fixture, lensManifests, sourceManifest }) {
  const fixtureRecord = record(fixture, 'fixture');
  const manifests = array(lensManifests, 'lens_manifests');
  const { manifest, index } = sourceArtifactIndex(sourceManifest);
  const execution = executeProject2025VerticalSlice(fixtureRecord, manifests);
  const { bundle, read_model: readModel, receipt } = execution;

  const sourceArtifacts = bundle.source_artifact_ids.map((sourceArtifactId) => {
    const source = index.get(sourceArtifactId);
    if (!source) fail('source_artifact_missing_from_manifest', sourceArtifactId);
    return {
      source_artifact_id: sourceArtifactId,
      source_sha256: source.sha256,
      byte_length: source.byte_length,
      source_role: source.source_role,
      source_use_state: source.source_use_state,
      target_table: 'source_artifact',
      mapping_state: 'direct_custody_mappable_unpersisted',
      unresolved_condition: null
    };
  });

  const blockers = [
    'runtime_database_transport_not_bound',
    'source_binding_upstream_ownership_mapping_not_declared',
    'collision_lens_result_foreign_key_mapping_not_declared',
    'projection_run_event_emission_contract_not_declared'
  ];
  if (bundle.projection_claim_state !== 'canonical_fact') {
    blockers.push('projection_claim_state_not_authorized_for_canonical_persistence');
  }
  if (receipt.database_write_count !== 0 || bundle.database_write_count !== 0) {
    fail('source_execution_already_wrote_database');
  }

  const tablePlans = [
    tablePlan('source_binding', 'blocked_contract_gap', sourceArtifacts.length, [], [
      'upstream_platform_object_type_and_object_id_mapping_not_declared'
    ]),
    tablePlan('source_artifact', 'structurally_mappable_unpersisted', sourceArtifacts.length),
    tablePlan('state_snapshot', 'structurally_mappable_unpersisted', 2, ['source_artifact']),
    tablePlan('state_snapshot_source', 'blocked_dependency', 0, ['source_binding', 'state_snapshot'], [
      'source_binding_mapping_unresolved'
    ]),
    tablePlan('state_snapshot_artifact', 'structurally_mappable_unpersisted', 2 * sourceArtifacts.length, ['source_artifact', 'state_snapshot']),
    tablePlan(
      'state_component',
      'structurally_mappable_unpersisted',
      fixtureRecord.baseline.components.length + fixtureRecord.changed.components.length,
      ['state_snapshot']
    ),
    tablePlan('state_component_source', 'blocked_dependency', 0, ['source_binding', 'state_component'], [
      'source_binding_mapping_unresolved'
    ]),
    tablePlan('state_component_artifact', 'structurally_mappable_unpersisted', fixtureRecord.baseline.components.length + fixtureRecord.changed.components.length, ['source_artifact', 'state_component']),
    tablePlan('change_set', 'structurally_mappable_unpersisted', 1, ['state_snapshot']),
    tablePlan('change_operation', 'structurally_mappable_unpersisted', bundle.diff.operations.length, ['change_set']),
    tablePlan('lens_manifest', 'structurally_mappable_unpersisted', manifests.length),
    tablePlan('scenario', 'structurally_mappable_unpersisted', 1, ['change_set', 'state_snapshot']),
    tablePlan('scenario_lens', 'structurally_mappable_unpersisted', manifests.length, ['lens_manifest', 'scenario']),
    tablePlan('projection_run', 'blocked_authorization', 1, ['scenario', 'scenario_lens'], [
      'projection_claim_state_not_authorized_for_canonical_persistence',
      'runtime_database_transport_not_bound'
    ]),
    tablePlan('lens_result', 'blocked_dependency', bundle.lens_results.length, ['lens_manifest', 'projection_run'], [
      'projection_run_not_authorized'
    ]),
    tablePlan('cross_lens_collision', 'blocked_dependency', bundle.collisions.length, ['projection_run'], [
      'projection_run_not_authorized'
    ]),
    tablePlan('collision_lens_result', 'blocked_contract_gap', 0, ['cross_lens_collision', 'lens_result'], [
      'effect_to_lens_result_foreign_key_mapping_not_declared'
    ]),
    tablePlan('replay_receipt', 'blocked_dependency', 1, ['projection_run'], [
      'projection_run_not_authorized'
    ]),
    tablePlan('projection_run_event', 'blocked_contract_gap', 0, ['projection_run', 'scenario'], [
      'projection_event_emission_contract_not_declared'
    ])
  ];

  if (tablePlans.map((entry) => entry.table).join('|') !== TARGET_TABLES.join('|')) {
    fail('target_table_plan_incomplete');
  }

  const planBasis = {
    persistence_plan_version: PERSISTENCE_PLAN_VERSION,
    adapter_state: 'deterministic_dry_run_mapping_only',
    target_schema: PERSISTENCE_TARGET_SCHEMA,
    source_manifest_id: manifest.manifest_id,
    scenario_id: bundle.scenario_id,
    policy_family_id: bundle.policy_family_id,
    engine_id: bundle.engine_id,
    engine_version: bundle.engine_version,
    projection_claim_state: bundle.projection_claim_state,
    input_hash: bundle.input_hash,
    projection_bundle_hash: bundle.projection_bundle_hash,
    read_model_hash: readModel.read_model_hash,
    execution_receipt_hash: receipt.receipt_hash,
    source_artifacts: sourceArtifacts,
    table_plan: tablePlans,
    blocker_count: blockers.length,
    blockers: [...new Set(blockers)].sort(),
    live_write_authorized: false,
    database_write_count: 0,
    upstream_mutation: false,
    credentials_required: false,
    sql_emitted: false
  };

  return {
    ...planBasis,
    persistence_plan_hash: sha256Hex(planBasis)
  };
}
