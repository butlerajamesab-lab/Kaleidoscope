import { readFile } from 'node:fs/promises';
import sourceManifest from '../source_manifests/source_pack_2026_08_03_v3.json' with { type: 'json' };
import project2025ReadModel from '../fixtures/project2025-title-vii-read-model.v1.json' with { type: 'json' };
import project2025Receipt from '../fixtures/project2025-title-vii-receipt.v1.json' with { type: 'json' };
import project2025Fixture from '../fixtures/project2025-title-vii-vertical-slice.v1.mjs';
import legislativeConsequenceFixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.complete.v1.mjs';
import substrateReceipt from '../receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json' with { type: 'json' };
import civicGenomeHandoffReceipt from '../docs/receipts/CIVIC_GENOME_KALEIDOSCOPE_AUTHENTICATED_HANDOFF_HB2487_2026-08-04.json' with { type: 'json' };
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import civilRights from '../lenses/civil_rights.v1.json' with { type: 'json' };
import enforcementPathways from '../lenses/enforcement_pathways.v1.json' with { type: 'json' };
import localGovernmentPreemption from '../lenses/local_government_preemption.v1.json' with { type: 'json' };
import { buildDeterministicPersistencePlan } from './persistence-plan.mjs';
import { canonicalValue } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';

export const KALEIDOSCOPE_APP_PATH = '/app';
export const KALEIDOSCOPE_APP_READ_MODEL_PATH = '/v1/platform/read-model';
export const KALEIDOSCOPE_APP_FRONTEND_VERSION = '1.0.0';

const PERSISTENCE_LENS_MANIFESTS = [
  affectedPopulations,
  civilRights,
  enforcementPathways,
  localGovernmentPreemption
];

const HTML_ASSET = {
  file: '../public/kaleidoscope-app.html',
  contentType: 'text/html; charset=utf-8'
};

const ASSET_ROUTES = new Map([
  ['/app.css', {
    file: '../public/kaleidoscope-app.css',
    contentType: 'text/css; charset=utf-8'
  }],
  ['/app.js', {
    file: '../public/kaleidoscope-app.js',
    contentType: 'text/javascript; charset=utf-8'
  }]
]);

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

function fail(code) {
  throw new Error(`invalid_kaleidoscope_platform_frontend:${code}`);
}

function substrateRowCount() {
  return Object.values(substrateReceipt.row_counts ?? {}).reduce((sum, value) => sum + value, 0);
}

function currentPersistencePlan() {
  return buildDeterministicPersistencePlan({
    fixture: project2025Fixture,
    lensManifests: PERSISTENCE_LENS_MANIFESTS,
    sourceManifest
  });
}

function assertSourceControlledState(persistencePlan) {
  if (!Array.isArray(sourceManifest.entries) || sourceManifest.entries.length !== 41) {
    fail('source_manifest_count_mismatch');
  }
  if (sourceManifest.corpus_policy !== 'all uploaded documents in this source sequence are active Kaleidoscope source artifacts; no selected subset') {
    fail('source_corpus_policy_mismatch');
  }

  const { read_model_hash: observedReadModelHash, ...readModelBasis } = project2025ReadModel;
  if (sha256Hex(readModelBasis) !== observedReadModelHash) {
    fail('project2025_read_model_hash_mismatch');
  }
  if (project2025Receipt.read_model_hash !== observedReadModelHash) {
    fail('project2025_receipt_binding_mismatch');
  }
  if (project2025Receipt.no_mutation !== true || project2025Receipt.database_write_count !== 0) {
    fail('project2025_write_boundary_mismatch');
  }

  if (legislativeConsequenceFixture.structural_delta_bundle?.delta_count !== 12
      || legislativeConsequenceFixture.consequence_graph?.edge_count !== 6) {
    fail('legislative_consequence_shape_mismatch');
  }
  if (legislativeConsequenceFixture.projection_executed !== false
      || legislativeConsequenceFixture.database_persisted !== false) {
    fail('legislative_consequence_execution_boundary_mismatch');
  }
  if (legislativeConsequenceFixture.legislation_platform_bindings?.binding_count !== 6
      || legislativeConsequenceFixture.legislation_platform_bindings?.conflict_count !== 1
      || legislativeConsequenceFixture.legislation_platform_bindings?.conflicts?.[0]?.resolution_state !== 'unresolved_preserved') {
    fail('legislative_consequence_platform_binding_mismatch');
  }
  if (legislativeConsequenceFixture.legislation_platform_bindings?.run_transition?.trigger !== 'user_initiated_rosetta_run') {
    fail('legislative_consequence_rosetta_transition_mismatch');
  }

  if (substrateReceipt.platform !== 'kaleidoscope'
      || substrateReceipt.project_ref !== 'iwmytuwofniybsmidtki'
      || substrateReceipt.state !== 'projection_substrate_applied_empty_unbound') {
    fail('substrate_receipt_identity_mismatch');
  }
  if (substrateReceipt.schema?.name !== 'kaleidoscope'
      || substrateReceipt.schema?.table_count !== 16
      || substrateReceipt.schema?.function_count !== 3
      || substrateReceipt.schema?.trigger_count !== 17) {
    fail('substrate_shape_mismatch');
  }
  if (substrateReceipt.schema?.rls_state !== 'enabled_all_truth_bearing_tables'
      || substrateReceipt.schema?.rls_policy_state !== 'none_intentional_deny_by_default'
      || substrateReceipt.schema?.service_role_access !== 'select_insert_only'
      || substrateReceipt.schema?.append_only_update_delete_boundary !== 'trigger_enforced') {
    fail('substrate_governance_mismatch');
  }
  if (substrateReceipt.live_migrations?.length !== 2
      || substrateRowCount() !== 0
      || substrateReceipt.capability_boundaries?.runtime_database_adapter_proven !== false) {
    fail('substrate_runtime_boundary_mismatch');
  }

  if (persistencePlan.adapter_state !== 'deterministic_dry_run_mapping_only'
      || persistencePlan.target_schema !== 'kaleidoscope'
      || persistencePlan.table_plan?.length !== 16
      || persistencePlan.blocker_count !== 5) {
    fail('persistence_preflight_shape_mismatch');
  }
  if (persistencePlan.live_write_authorized !== false
      || persistencePlan.database_write_count !== 0
      || persistencePlan.upstream_mutation !== false
      || persistencePlan.credentials_required !== false
      || persistencePlan.sql_emitted !== false) {
    fail('persistence_preflight_safety_boundary_mismatch');
  }

  if (civicGenomeHandoffReceipt.proof_state !== 'completed') {
    fail('civic_genome_handoff_proof_not_complete');
  }
  if (civicGenomeHandoffReceipt.delivery_receipt?.validation_state !== 'validated_unbound') {
    fail('civic_genome_handoff_state_mismatch');
  }
  if (civicGenomeHandoffReceipt.binding?.binding_state !== 'unresolved') {
    fail('civic_genome_binding_state_mismatch');
  }
  const boundary = civicGenomeHandoffReceipt.write_and_execution_boundary;
  if (!boundary
      || boundary.kaleidoscope_persisted !== false
      || boundary.kaleidoscope_projection_executed !== false
      || boundary.upstream_mutation !== false) {
    fail('civic_genome_handoff_boundary_mismatch');
  }
}

function platformContracts() {
  return [
    {
      platform_id: 'docket_room',
      label: 'Docket Room',
      role: 'Official legislation identity, status, and source retrieval',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'rosetta',
      label: 'Rosetta',
      role: 'Deterministic legal decomposition and source-span extraction',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'civic_genome',
      label: 'Civic Genome',
      role: 'Persistent policy identity, traits, events, lineage, and immutable snapshots',
      relationship: 'authenticated read-only source',
      state: civicGenomeHandoffReceipt.delivery_receipt.validation_state,
      mutation: 'prohibited'
    },
    {
      platform_id: 'prism',
      label: 'Prism',
      role: 'Verification receipts, contradictions, and cited evidence findings',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'atlas',
      label: 'Atlas',
      role: 'Governed observations, entity resolution, and historical context',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'esquire',
      label: 'Esquire',
      role: 'Person-controlled procedural state when explicitly authorized',
      relationship: 'future read-only binding',
      state: 'contract_not_established',
      mutation: 'prohibited'
    }
  ];
}

function capabilities(persistencePlan) {
  return [
    {
      capability_id: 'typed_state_diff',
      label: 'Typed state diff',
      state: 'available',
      detail: 'Added, removed, modified, preserved, superseded, preempted, and unresolved state changes.'
    },
    {
      capability_id: 'project2025_vertical_slice',
      label: 'Project 2025 vertical slice',
      state: 'executed_test_fixture',
      detail: 'Four independent lenses with deterministic replay and preserved collisions.'
    },
    {
      capability_id: 'legislative_consequence_stage_1_2',
      label: 'Legislative consequence engine',
      state: 'stage_1_2_source_controlled',
      detail: `${legislativeConsequenceFixture.structural_delta_bundle.delta_count} structural deltas and ${legislativeConsequenceFixture.consequence_graph.edge_count} typed consequence edges; stages 3–6 remain null and projection is not executed.`
    },
    {
      capability_id: 'civic_genome_snapshot_validation',
      label: 'Civic Genome snapshot validation',
      state: 'live_proven_unbound',
      detail: 'Authenticated 62-component snapshot validation proved without persistence or projection.'
    },
    {
      capability_id: 'projection_substrate',
      label: 'Projection substrate',
      state: 'applied_empty_unbound',
      detail: 'The governed Kaleidoscope schema contains 16 truth-bearing tables, 3 functions, 17 append-only triggers, and 2 applied migrations. All tables are empty.'
    },
    {
      capability_id: 'deterministic_persistence_preflight',
      label: 'Persistence preflight',
      state: 'no_write_plan_available',
      detail: `Deterministic dry-run mapping covers all ${persistencePlan.table_plan.length} substrate tables and preserves ${persistencePlan.blocker_count} blockers. It emits no SQL, requests no credentials, and authorizes no live writes.`
    },
    {
      capability_id: 'canonical_projection_persistence',
      label: 'Canonical projection persistence',
      state: 'runtime_not_bound',
      detail: 'The governed substrate exists, but the runtime transport and persistence adapter are not bound and no canonical rows have been persisted.'
    }
  ];
}

export function kaleidoscopePlatformReadModel() {
  const persistencePlan = currentPersistencePlan();
  assertSourceControlledState(persistencePlan);

  const lensRegistry = project2025ReadModel.lens_panels.map((lens) => ({
    lens_id: lens.lens_id,
    effect_count: lens.effect_count,
    state: 'source_controlled_test_fixture',
    href: '/project2025/title-vii#lenses'
  }));
  const rowCount = substrateRowCount();

  const basis = {
    read_model_version: '1.0.0',
    platform: 'kaleidoscope',
    platform_label: 'Kaleidoscope',
    environment: 'staging',
    foundation_version: '0.1.4',
    frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
    deterministic: true,
    truth_label: 'Staging workspace — deterministic source-controlled evidence, not canonical projection truth',
    mission: 'Compare declared civic states through inspectable deterministic lenses while preserving provenance, uncertainty, and disagreement.',
    summary: {
      active_source_artifacts: sourceManifest.entries.length,
      scenario_count: 1,
      lens_count: lensRegistry.length,
      preserved_collision_count: project2025ReadModel.summary.collision_count,
      unresolved_condition_count: project2025ReadModel.summary.unresolved_count,
      accepted_civic_genome_bindings: 0,
      database_tables: substrateReceipt.schema.table_count,
      database_rows: rowCount,
      database_migrations: substrateReceipt.live_migrations.length
    },
    capabilities: capabilities(persistencePlan),
    scenarios: [
      {
        scenario_id: project2025ReadModel.scenario_id,
        policy_family_id: project2025ReadModel.policy_family_id,
        title: project2025ReadModel.title,
        subtitle: project2025ReadModel.subtitle,
        state: project2025ReadModel.status,
        mechanism_count: project2025ReadModel.summary.mechanism_count,
        operation_count: project2025ReadModel.summary.operation_count,
        lens_count: project2025ReadModel.summary.lens_count,
        collision_count: project2025ReadModel.summary.collision_count,
        unresolved_count: project2025ReadModel.summary.unresolved_count,
        href: '/project2025/title-vii',
        receipt_href: '/v1/project2025/title-vii/receipt',
        read_model_hash: project2025ReadModel.read_model_hash
      }
    ],
    legislative_consequence: {
      scenario_id: legislativeConsequenceFixture.structural_delta_bundle.scenario_id,
      state: 'stage_1_2_source_controlled_stages_3_6_null',
      structural_delta_count: legislativeConsequenceFixture.structural_delta_bundle.delta_count,
      consequence_edge_count: legislativeConsequenceFixture.consequence_graph.edge_count,
      platform_binding_count: legislativeConsequenceFixture.legislation_platform_bindings.binding_count,
      preserved_conflict_count: legislativeConsequenceFixture.legislation_platform_bindings.conflict_count,
      upstream_trigger: legislativeConsequenceFixture.legislation_platform_bindings.run_transition.trigger,
      projection_executed: legislativeConsequenceFixture.projection_executed,
      database_persisted: legislativeConsequenceFixture.database_persisted
    },
    persistence_preflight: {
      plan_version: persistencePlan.persistence_plan_version,
      state: persistencePlan.adapter_state,
      target_schema: persistencePlan.target_schema,
      table_plan_count: persistencePlan.table_plan.length,
      blocker_count: persistencePlan.blocker_count,
      blockers: persistencePlan.blockers,
      persistence_plan_hash: persistencePlan.persistence_plan_hash,
      projection_claim_state: persistencePlan.projection_claim_state,
      live_write_authorized: persistencePlan.live_write_authorized,
      database_write_count: persistencePlan.database_write_count,
      upstream_mutation: persistencePlan.upstream_mutation,
      credentials_required: persistencePlan.credentials_required,
      sql_emitted: persistencePlan.sql_emitted
    },
    lens_registry: lensRegistry,
    source_corpus: {
      manifest_id: sourceManifest.manifest_id,
      entry_count: sourceManifest.entries.length,
      corpus_policy: sourceManifest.corpus_policy,
      identity_rule: sourceManifest.identity_rule,
      embedded_in_runtime: false,
      selected_subset: false
    },
    database_substrate: {
      receipt_id: substrateReceipt.receipt_id,
      observed_date: substrateReceipt.observed_date,
      supabase_project_id: substrateReceipt.project_ref,
      schema_name: substrateReceipt.schema.name,
      table_count: substrateReceipt.schema.table_count,
      table_names: Object.keys(substrateReceipt.row_counts),
      function_count: substrateReceipt.schema.function_count,
      trigger_count: substrateReceipt.schema.trigger_count,
      exact_total_rows: rowCount,
      all_tables_rls_enabled: substrateReceipt.schema.rls_state === 'enabled_all_truth_bearing_tables',
      rls_policy_state: substrateReceipt.schema.rls_policy_state,
      service_role_access: substrateReceipt.schema.service_role_access,
      append_only_update_delete_boundary: substrateReceipt.schema.append_only_update_delete_boundary,
      migration_history: substrateReceipt.live_migrations,
      canonical_persistence_state: substrateReceipt.canonical_persistence_state,
      substrate_state: substrateReceipt.state,
      runtime_database_write_path_proven: substrateReceipt.capability_boundaries.runtime_database_adapter_proven
    },
    platform_contracts: platformContracts(),
    receipts: [
      {
        receipt_id: 'project2025_title_vii_vertical_slice.v1',
        label: 'Project 2025 Title VII deterministic run',
        state: 'executed_test_fixture',
        receipt_hash: project2025Receipt.receipt_hash,
        run_id: project2025Receipt.run_id,
        href: '/v1/project2025/title-vii/receipt'
      },
      {
        receipt_id: civicGenomeHandoffReceipt.receipt_id,
        label: 'Civic Genome authenticated handoff — WA HB2487',
        state: civicGenomeHandoffReceipt.delivery_receipt.validation_state,
        receipt_hash: civicGenomeHandoffReceipt.delivery_receipt.delivery_receipt_hash,
        source_snapshot_hash: civicGenomeHandoffReceipt.source_snapshot.snapshot_hash,
        persisted: civicGenomeHandoffReceipt.write_and_execution_boundary.kaleidoscope_persisted,
        projection_executed: civicGenomeHandoffReceipt.write_and_execution_boundary.kaleidoscope_projection_executed,
        binding_state: civicGenomeHandoffReceipt.binding.binding_state
      },
      {
        receipt_id: substrateReceipt.receipt_id,
        label: 'Kaleidoscope Supabase projection substrate',
        state: substrateReceipt.state,
        table_count: substrateReceipt.schema.table_count,
        function_count: substrateReceipt.schema.function_count,
        trigger_count: substrateReceipt.schema.trigger_count,
        row_count: rowCount,
        migration_count: substrateReceipt.live_migrations.length,
        runtime_adapter_proven: substrateReceipt.capability_boundaries.runtime_database_adapter_proven
      }
    ],
    system_boundary: {
      database_schema: substrateReceipt.schema.name,
      database_tables: substrateReceipt.schema.table_count,
      database_functions: substrateReceipt.schema.function_count,
      database_triggers: substrateReceipt.schema.trigger_count,
      database_rows: rowCount,
      database_migrations: substrateReceipt.live_migrations.length,
      database_persistence: false,
      persistence_preflight_available: true,
      persistence_preflight_state: persistencePlan.adapter_state,
      persistence_blocker_count: persistencePlan.blocker_count,
      persistence_live_write_authorized: persistencePlan.live_write_authorized,
      canonical_projection_execution: false,
      legislative_consequence_projection_execution: false,
      upstream_mutation: false,
      hidden_composite_score: false,
      runtime_ai_dependency: false,
      unresolved_states_preserved: true,
      source_identity_rule: 'exact_byte_length_and_sha256'
    },
    routes: {
      app: KALEIDOSCOPE_APP_PATH,
      platform_read_model: KALEIDOSCOPE_APP_READ_MODEL_PATH,
      project2025_scenario: '/project2025/title-vii',
      health: '/health',
      status: '/v1/status'
    }
  };

  return {
    ...basis,
    read_model_hash: sha256Hex(basis)
  };
}

async function textAsset(asset) {
  const body = await readFile(new URL(asset.file, import.meta.url), 'utf8');
  return {
    statusCode: 200,
    contentType: asset.contentType,
    body,
    cacheControl: 'no-store'
  };
}

export async function resolveKaleidoscopePlatformFrontendRequest(pathname) {
  if (pathname === KALEIDOSCOPE_APP_PATH || pathname === `${KALEIDOSCOPE_APP_PATH}/`) {
    return {
      ...(await textAsset(HTML_ASSET)),
      headers: SECURITY_HEADERS
    };
  }

  const asset = ASSET_ROUTES.get(pathname);
  if (asset) {
    return {
      ...(await textAsset(asset)),
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  if (pathname === KALEIDOSCOPE_APP_READ_MODEL_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(canonicalValue(kaleidoscopePlatformReadModel())),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  return null;
}
