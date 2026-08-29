import { executeProject2025VerticalSlice } from './project2025-vertical-slice.mjs';
import { sha256Hex } from './hash.mjs';
import {
  buildProjectionRunEventContracts,
  mapCollisionLensResultContracts
} from './projection-persistence-contracts.mjs';

export const PERSISTENCE_PLAN_VERSION = '1.2.0';
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
  'scenario_artifact',
  'scenario_lens',
  'projection_run',
  'lens_result',
  'cross_lens_collision',
  'collision_lens_result',
  'replay_receipt',
  'projection_run_event',
  'federal_mechanism', 'mechanism_authority', 'implementation_event', 'implementation_edge',
  'state_baseline', 'material_claim', 'claim_source', 'projection_result', 'response_pathway',
  'constraint_determination', 'response_window', 'pathway_score', 'no_go_path', 'watch_event',
  'affected_population_coverage', 'correction_record'
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

function directCustodyUsage(snapshot, label, declaredArtifactIds, manifestIndex) {
  const snapshotRow = record(snapshot, label);
  const snapshotArtifactIds = new Set();
  let componentArtifactLinkCount = 0;

  for (const [componentIndex, component] of array(snapshotRow.components, `${label}.components`).entries()) {
    const componentRow = record(component, `${label}.components[${componentIndex}]`);
    const componentId = string(componentRow.component_id, `${label}.components[${componentIndex}].component_id`);
    const componentArtifactIds = new Set();

    for (const [bindingIndex, binding] of array(
      componentRow.source_bindings ?? [],
      `${label}.components[${componentIndex}].source_bindings`
    ).entries()) {
      const bindingRow = record(binding, `${label}.components[${componentIndex}].source_bindings[${bindingIndex}]`);
      const sourceArtifactId = string(
        bindingRow.source_artifact_id,
        `${label}.components[${componentIndex}].source_bindings[${bindingIndex}].source_artifact_id`
      );
      if (!declaredArtifactIds.has(sourceArtifactId)) {
        fail('component_source_artifact_not_declared_by_scenario', `${componentId}:${sourceArtifactId}`);
      }
      if (!manifestIndex.has(sourceArtifactId)) {
        fail('source_artifact_missing_from_manifest', sourceArtifactId);
      }
      snapshotArtifactIds.add(sourceArtifactId);
      componentArtifactIds.add(sourceArtifactId);
    }
    componentArtifactLinkCount += componentArtifactIds.size;
  }

  return {
    snapshot_artifact_ids: [...snapshotArtifactIds].sort(),
    snapshot_artifact_link_count: snapshotArtifactIds.size,
    component_artifact_link_count: componentArtifactLinkCount
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

  const declaredArtifactIds = new Set(sourceArtifacts.map((entry) => entry.source_artifact_id));
  const baselineCustody = directCustodyUsage(
    fixtureRecord.baseline,
    'fixture.baseline',
    declaredArtifactIds,
    index
  );
  const changedCustody = directCustodyUsage(
    fixtureRecord.changed,
    'fixture.changed',
    declaredArtifactIds,
    index
  );
  const componentBoundArtifactIds = new Set([
    ...baselineCustody.snapshot_artifact_ids,
    ...changedCustody.snapshot_artifact_ids
  ]);
  const unlinkedScenarioSupportArtifactIds = [...declaredArtifactIds]
    .filter((sourceArtifactId) => !componentBoundArtifactIds.has(sourceArtifactId))
    .sort();

  const collisionLensResultLinks = mapCollisionLensResultContracts({
    collisions: bundle.collisions,
    lensResults: bundle.lens_results
  });
  const projectionRunEvents = buildProjectionRunEventContracts({
    bundle,
    runStatus: bundle.unresolved_conditions.length === 0 ? 'completed' : 'unresolved'
  });
  const blockers = ['runtime_database_transport_not_bound'];
  if (bundle.projection_claim_state !== 'canonical_fact') {
    blockers.push('projection_claim_state_not_authorized_for_canonical_persistence');
  }
  if (receipt.database_write_count !== 0 || bundle.database_write_count !== 0) {
    fail('source_execution_already_wrote_database');
  }

  const snapshotArtifactLinkCount = baselineCustody.snapshot_artifact_link_count
    + changedCustody.snapshot_artifact_link_count;
  const componentArtifactLinkCount = baselineCustody.component_artifact_link_count
    + changedCustody.component_artifact_link_count;

  const tablePlans = [
    tablePlan('source_binding', 'not_applicable_direct_custody', 0),
    tablePlan('source_artifact', 'structurally_mappable_unpersisted', sourceArtifacts.length),
    tablePlan('state_snapshot', 'structurally_mappable_unpersisted', 2, ['source_artifact']),
    tablePlan('state_snapshot_source', 'not_applicable_direct_custody', 0, ['state_snapshot']),
    tablePlan('state_snapshot_artifact', 'structurally_mappable_unpersisted', snapshotArtifactLinkCount, ['source_artifact', 'state_snapshot']),
    tablePlan(
      'state_component',
      'structurally_mappable_unpersisted',
      fixtureRecord.baseline.components.length + fixtureRecord.changed.components.length,
      ['state_snapshot']
    ),
    tablePlan('state_component_source', 'not_applicable_direct_custody', 0, ['state_component']),
    tablePlan('state_component_artifact', 'structurally_mappable_unpersisted', componentArtifactLinkCount, ['source_artifact', 'state_component']),
    tablePlan('change_set', 'structurally_mappable_unpersisted', 1, ['state_snapshot']),
    tablePlan('change_operation', 'structurally_mappable_unpersisted', bundle.diff.operations.length, ['change_set']),
    tablePlan('lens_manifest', 'structurally_mappable_unpersisted', manifests.length),
    tablePlan('scenario', 'structurally_mappable_unpersisted', 1, ['change_set', 'state_snapshot']),
    tablePlan('scenario_artifact', 'structurally_mappable_unpersisted', sourceArtifacts.length, ['scenario', 'source_artifact']),
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
    tablePlan('collision_lens_result', 'structurally_mappable_unpersisted', collisionLensResultLinks.length, ['cross_lens_collision', 'lens_result']),
    tablePlan('replay_receipt', 'blocked_dependency', 1, ['projection_run'], [
      'projection_run_not_authorized'
    ]),
    tablePlan('projection_run_event', 'structurally_mappable_unpersisted', projectionRunEvents.length, ['projection_run', 'scenario']),
    ...['federal_mechanism','mechanism_authority','implementation_event','implementation_edge','state_baseline','material_claim','claim_source','projection_result','response_pathway','constraint_determination','response_window','pathway_score','no_go_path','watch_event','affected_population_coverage','correction_record']
      .map((table) => tablePlan(table, 'blocked_state_response_input_not_accepted', 0, [], ['state_response_fixture_missing_primary_sources']))
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
    collision_lens_result_links: collisionLensResultLinks,
    projection_run_events: projectionRunEvents,
    direct_custody: {
      source_artifact_count: sourceArtifacts.length,
      snapshot_artifact_link_count: snapshotArtifactLinkCount,
      component_artifact_link_count: componentArtifactLinkCount,
      baseline_snapshot_artifact_ids: baselineCustody.snapshot_artifact_ids,
      changed_snapshot_artifact_ids: changedCustody.snapshot_artifact_ids,
      unlinked_scenario_support_artifact_ids: unlinkedScenarioSupportArtifactIds,
      upstream_object_bindings_created: 0,
      no_upstream_ownership_inference: true
    },
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
