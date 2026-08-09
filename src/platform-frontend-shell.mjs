import { readFile } from 'node:fs/promises';
import sourceManifest from '../source_manifests/source_pack_2026_08_03_v3.json' with { type: 'json' };
import project2025ReadModel from '../fixtures/project2025-title-vii-read-model.v1.json' with { type: 'json' };
import project2025Receipt from '../fixtures/project2025-title-vii-receipt.v1.json' with { type: 'json' };
import project2025Fixture from '../fixtures/project2025-title-vii-vertical-slice.v1.mjs';
import localPreemptionFixture from '../fixtures/local-preemption-family-vertical-slice.v1.mjs';
import substrateReceipt from '../receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json' with { type: 'json' };
import civicGenomeHandoffReceipt from '../docs/receipts/CIVIC_GENOME_KALEIDOSCOPE_AUTHENTICATED_HANDOFF_HB2487_2026-08-04.json' with { type: 'json' };
import legislativeConsequenceFixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.complete.v1.mjs';
import legislativeImpactFixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.impact_surface.v1.mjs';
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import civilRights from '../lenses/civil_rights.v1.json' with { type: 'json' };
import enforcementPathways from '../lenses/enforcement_pathways.v1.json' with { type: 'json' };
import localGovernmentPreemption from '../lenses/local_government_preemption.v1.json' with { type: 'json' };
import preemptionOperability from '../lenses/preemption_operability.v1.json' with { type: 'json' };
import preemptionTemporalHistory from '../lenses/preemption_temporal_history.v1.json' with { type: 'json' };
import preemptionJurisdictionalVariation from '../lenses/preemption_jurisdictional_variation.v1.json' with { type: 'json' };
import { buildDeterministicPersistencePlan } from './persistence-plan.mjs';
import { executeLocalPreemptionFamilyVerticalSlice } from './local-preemption-family-slice.mjs';
import {
  LOCAL_PREEMPTION_FRONTEND_PATH,
  LOCAL_PREEMPTION_RECEIPT_PATH
} from './local-preemption-frontend-shell.mjs';
import {
  LEGISLATIVE_IMPACT_SURFACE_PATH,
  LEGISLATIVE_IMPACT_RECEIPT_PATH
} from './legislative-impact-api.mjs';
import { canonicalValue } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';

export const KALEIDOSCOPE_APP_PATH = '/app';
export const KALEIDOSCOPE_APP_READ_MODEL_PATH = '/v1/platform/read-model';
export const KALEIDOSCOPE_APP_FRONTEND_VERSION = '1.3.0';

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

const PROJECT2025_LENSES = [
  affectedPopulations,
  civilRights,
  enforcementPathways,
  localGovernmentPreemption
];

const LOCAL_PREEMPTION_LENSES = [
  affectedPopulations,
  preemptionOperability,
  preemptionTemporalHistory,
  preemptionJurisdictionalVariation
];

function fail(code) {
  throw new Error(`invalid_kaleidoscope_platform_frontend:${code}`);
}

function substrateRowCount() {
  return Object.values(substrateReceipt.row_counts ?? {}).reduce((sum, value) => {
    if (!Number.isInteger(value) || value < 0) fail('substrate_row_count_invalid');
    return sum + value;
  }, 0);
}

function sourceEntry(name) {
  return sourceManifest.entries.find((entry) => entry.source_file_name === name) ?? null;
}

function derivedRuntimeState() {
  const localPreemption = executeLocalPreemptionFamilyVerticalSlice(
    localPreemptionFixture,
    LOCAL_PREEMPTION_LENSES
  );
  const project2025PersistencePlan = buildDeterministicPersistencePlan({
    fixture: project2025Fixture,
    lensManifests: PROJECT2025_LENSES,
    sourceManifest
  });
  const localPreemptionPersistencePlan = buildDeterministicPersistencePlan({
    fixture: localPreemptionFixture,
    lensManifests: LOCAL_PREEMPTION_LENSES,
    sourceManifest
  });
  return {
    localPreemption,
    project2025PersistencePlan,
    localPreemptionPersistencePlan
  };
}

function assertLegislativeImpactState() {
  const surface = legislativeImpactFixture.impact_surface;
  const receipt = legislativeImpactFixture.receipt;
  if (legislativeImpactFixture.stage !== 3
      || legislativeImpactFixture.stage_name !== 'impact_surface'
      || legislativeImpactFixture.source_stage_1_2_fixture_id !== legislativeConsequenceFixture.fixture_id) {
    fail('legislative_impact_stage_identity_mismatch');
  }
  if (surface.source_consequence_graph_hash !== legislativeConsequenceFixture.consequence_graph.graph_hash
      || surface.source_structural_delta_bundle_hash !== legislativeConsequenceFixture.structural_delta_bundle.bundle_hash) {
    fail('legislative_impact_source_identity_mismatch');
  }
  if (surface.impact_item_count !== 5
      || surface.deferred_reference_count !== 1
      || surface.touched_actor_count !== 14
      || surface.effect_class_counts.legal !== 3
      || surface.effect_class_counts.operational !== 2
      || surface.effect_class_counts.economic !== 0
      || surface.effect_class_counts.administrative !== 1) {
    fail('legislative_impact_shape_mismatch');
  }
  if (surface.atlas_historical_comparison_executed !== false
      || surface.lighthouse_accountability_executed !== false
      || surface.checklist_instantiated !== false
      || surface.no_mutation !== true
      || surface.database_write_count !== 0) {
    fail('legislative_impact_boundary_mismatch');
  }
  if (receipt.impact_surface_hash !== surface.impact_surface_hash
      || receipt.atlas_historical_comparison_executed !== false
      || receipt.lighthouse_accountability_executed !== false
      || receipt.checklist_instantiated !== false
      || receipt.no_mutation !== true
      || receipt.database_write_count !== 0) {
    fail('legislative_impact_receipt_mismatch');
  }
  if (legislativeImpactFixture.atlas_historical_compare !== null
      || legislativeImpactFixture.lighthouse_accountability_view !== null
      || legislativeImpactFixture.instantiated_checklist !== null
      || legislativeImpactFixture.projection_executed !== false
      || legislativeImpactFixture.database_persisted !== false) {
    fail('legislative_impact_later_stage_boundary_mismatch');
  }
  return { surface, receipt };
}

function assertSourceControlledState(derived) {
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

  const familySource = sourceEntry('P25-PREEMPT-FAMILY-01_dossier.md');
  const iowaSource = sourceEntry('P25-IA-01_mechanism_dossier-4.md');
  if (familySource?.sha256 !== '0c84ce7e744cc0fc5a2d3cc82f13d5424dd137e82d6943c4ebeffe294f1890bd'
      || familySource?.byte_length !== 6484) {
    fail('local_preemption_family_source_identity_mismatch');
  }
  if (iowaSource?.sha256 !== '2157da884d15ceb174ba950b92f2499d110ff9c909e772e5737ae6f5a662e46c'
      || iowaSource?.byte_length !== 12185) {
    fail('local_preemption_iowa_source_identity_mismatch');
  }
  if (derived.localPreemption.bundle.lens_results.length !== 4
      || derived.localPreemption.bundle.collisions.length !== 2
      || derived.localPreemption.bundle.no_mutation !== true
      || derived.localPreemption.bundle.database_write_count !== 0
      || derived.localPreemption.bundle.projection_claim_state !== 'not_prediction_not_canonical_fact') {
    fail('local_preemption_slice_boundary_mismatch');
  }

  if (legislativeConsequenceFixture.structural_delta_bundle?.delta_count !== 12
      || legislativeConsequenceFixture.consequence_graph?.edge_count !== 6
      || legislativeConsequenceFixture.legislation_platform_bindings?.binding_count !== 6) {
    fail('legislative_consequence_stage_1_2_shape_mismatch');
  }
  if (legislativeConsequenceFixture.legislation_platform_bindings?.conflict_count !== 1
      || legislativeConsequenceFixture.legislation_platform_bindings?.conflicts?.[0]?.resolution_state !== 'unresolved_preserved'
      || legislativeConsequenceFixture.legislation_platform_bindings?.run_transition?.trigger !== 'user_initiated_rosetta_run') {
    fail('legislative_consequence_upstream_transition_mismatch');
  }
  if (legislativeConsequenceFixture.projection_executed !== false
      || legislativeConsequenceFixture.database_persisted !== false
      || legislativeConsequenceFixture.impact_surface !== null
      || legislativeConsequenceFixture.atlas_historical_compare !== null
      || legislativeConsequenceFixture.lighthouse_accountability_view !== null
      || legislativeConsequenceFixture.instantiated_checklist !== null) {
    fail('legislative_consequence_stage_1_2_boundary_mismatch');
  }
  assertLegislativeImpactState();

  if (substrateReceipt.platform !== 'kaleidoscope'
      || substrateReceipt.project_ref !== 'iwmytuwofniybsmidtki'
      || substrateReceipt.state !== 'projection_substrate_applied_empty_unbound'
      || substrateReceipt.canonical_persistence_state !== 'schema_present_empty_runtime_not_bound') {
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

  for (const plan of [derived.project2025PersistencePlan, derived.localPreemptionPersistencePlan]) {
    if (plan.target_schema !== 'kaleidoscope'
        || plan.table_plan.length !== 16
        || plan.live_write_authorized !== false
        || plan.database_write_count !== 0
        || plan.credentials_required !== false
        || plan.sql_emitted !== false
        || plan.upstream_mutation !== false) {
      fail('persistence_preflight_boundary_mismatch');
    }
    if (!plan.blockers.includes('source_binding_upstream_ownership_mapping_not_declared')
        || !plan.blockers.includes('projection_claim_state_not_authorized_for_canonical_persistence')
        || !plan.blockers.includes('runtime_database_transport_not_bound')) {
      fail('persistence_preflight_blocker_mismatch');
    }
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

function capabilities(derived) {
  const impact = assertLegislativeImpactState().surface;
  return [
    {
      capability_id: 'typed_state_diff',
      label: 'Typed state diff',
      state: 'available',
      detail: 'Added, removed, modified, preserved, superseded, preempted, and unresolved state changes.'
    },
    {
      capability_id: 'project2025_vertical_slice',
      label: 'Project 2025 Title VII vertical slice',
      state: 'executed_test_fixture',
      detail: 'Four independent lenses with deterministic replay and preserved collisions.'
    },
    {
      capability_id: 'local_preemption_family_vertical_slice',
      label: 'Local preemption family vertical slice',
      state: 'executed_test_fixture',
      detail: 'Five jurisdictions, four lenses, and preserved temporal/current-state heterogeneity without asserting centralized coordination.'
    },
    {
      capability_id: 'legislative_consequence_stage_1_2',
      label: 'Legislative Consequence · Stages 1–2',
      state: 'source_controlled_no_projection',
      detail: `${legislativeConsequenceFixture.structural_delta_bundle.delta_count} structural deltas, ${legislativeConsequenceFixture.consequence_graph.edge_count} governed consequence edges, ${legislativeConsequenceFixture.legislation_platform_bindings.binding_count} Docket/Rosetta/Civic Genome bindings, and ${legislativeConsequenceFixture.legislation_platform_bindings.conflict_count} preserved lifecycle conflict.`
    },
    {
      capability_id: 'legislative_consequence_stage_3',
      label: 'Legislative Consequence · Stage 3 Impact Surface',
      state: 'source_controlled_no_projection',
      detail: `${impact.impact_item_count} declared impact items touch ${impact.touched_actor_count} Stage 1 actor identifiers; one historical reference is deferred to Stage 4, and no economic effect is manufactured where none is declared.`
    },
    {
      capability_id: 'deterministic_persistence_preflight',
      label: 'Deterministic persistence preflight',
      state: 'available_no_write',
      detail: `Both bounded scenarios map against all 16 substrate tables while preserving ${derived.project2025PersistencePlan.blocker_count} explicit blockers and authorizing zero live writes.`
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
      detail: 'The Kaleidoscope schema contains 16 RLS-enabled truth-bearing tables, 3 governed functions, 17 append-only triggers, and 2 applied migrations. All tables remain empty.'
    },
    {
      capability_id: 'canonical_projection_persistence',
      label: 'Canonical projection persistence',
      state: 'runtime_not_bound',
      detail: 'The governed substrate exists, but the runtime database transport is not proven and no source binding, scenario, projection run, or replay receipt has been persisted.'
    }
  ];
}

function combinedLensRegistry(localPreemption) {
  const registry = new Map();
  const add = (lens, scenarioId, href) => {
    const existing = registry.get(lens.lens_id) ?? {
      lens_id: lens.lens_id,
      effect_count: 0,
      scenario_count: 0,
      state: 'source_controlled_test_fixture',
      href: null
    };
    existing.effect_count += lens.effect_count;
    existing.scenario_count += 1;
    if (existing.scenario_count === 1) existing.href = href;
    else existing.href = null;
    registry.set(lens.lens_id, existing);
  };

  for (const lens of project2025ReadModel.lens_panels) {
    add(lens, project2025ReadModel.scenario_id, '/project2025/title-vii#lenses');
  }
  for (const lens of localPreemption.read_model.lens_panels) {
    add(lens, localPreemption.read_model.scenario_id, `${LOCAL_PREEMPTION_FRONTEND_PATH}#lenses`);
  }
  return [...registry.values()].sort((a, b) => a.lens_id.localeCompare(b.lens_id));
}

export function kaleidoscopePlatformReadModel() {
  const derived = derivedRuntimeState();
  assertSourceControlledState(derived);

  const localPreemption = derived.localPreemption;
  const legislativeImpact = assertLegislativeImpactState();
  const lensRegistry = combinedLensRegistry(localPreemption);
  const rowCount = substrateRowCount();

  const basis = {
    read_model_version: '1.3.0',
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
      scenario_count: 2,
      lens_count: lensRegistry.length,
      preserved_collision_count: project2025ReadModel.summary.collision_count + localPreemption.read_model.summary.collision_count,
      unresolved_condition_count: project2025ReadModel.summary.unresolved_count + localPreemption.read_model.summary.unresolved_count,
      accepted_civic_genome_bindings: 0,
      database_tables: substrateReceipt.schema.table_count,
      database_rows: rowCount,
      database_migrations: substrateReceipt.live_migrations.length
    },
    capabilities: capabilities(derived),
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
        inspection_state: 'detailed_route_available',
        read_model_hash: project2025ReadModel.read_model_hash
      },
      {
        scenario_id: localPreemption.read_model.scenario_id,
        policy_family_id: localPreemption.read_model.policy_family_id,
        title: localPreemption.read_model.title,
        subtitle: localPreemption.read_model.subtitle,
        state: localPreemption.read_model.status,
        mechanism_count: localPreemption.read_model.summary.mechanism_count,
        operation_count: localPreemption.read_model.summary.operation_count,
        lens_count: localPreemption.read_model.summary.lens_count,
        collision_count: localPreemption.read_model.summary.collision_count,
        unresolved_count: localPreemption.read_model.summary.unresolved_count,
        href: LOCAL_PREEMPTION_FRONTEND_PATH,
        receipt_href: LOCAL_PREEMPTION_RECEIPT_PATH,
        inspection_state: 'detailed_route_available',
        read_model_hash: localPreemption.read_model.read_model_hash
      }
    ],
    legislative_consequence: {
      specimen_id: legislativeConsequenceFixture.fixture_id,
      scenario_id: legislativeConsequenceFixture.structural_delta_bundle.scenario_id,
      state: 'stage_1_3_source_controlled_stages_4_6_null_no_projection',
      structural_delta_count: legislativeConsequenceFixture.structural_delta_bundle.delta_count,
      consequence_edge_count: legislativeConsequenceFixture.consequence_graph.edge_count,
      platform_binding_count: legislativeConsequenceFixture.legislation_platform_bindings.binding_count,
      preserved_conflict_count: legislativeConsequenceFixture.legislation_platform_bindings.conflict_count,
      upstream_trigger: legislativeConsequenceFixture.legislation_platform_bindings.run_transition.trigger,
      stage_1_2_fixture_impact_surface: legislativeConsequenceFixture.impact_surface,
      impact_surface: {
        state: 'stage_3_source_controlled_no_projection',
        impact_item_count: legislativeImpact.surface.impact_item_count,
        touched_actor_count: legislativeImpact.surface.touched_actor_count,
        effect_class_counts: legislativeImpact.surface.effect_class_counts,
        deferred_reference_count: legislativeImpact.surface.deferred_reference_count,
        atlas_historical_comparison_executed: legislativeImpact.surface.atlas_historical_comparison_executed,
        lighthouse_accountability_executed: legislativeImpact.surface.lighthouse_accountability_executed,
        checklist_instantiated: legislativeImpact.surface.checklist_instantiated,
        impact_surface_hash: legislativeImpact.surface.impact_surface_hash,
        run_id: legislativeImpact.receipt.run_id,
        receipt_hash: legislativeImpact.receipt.receipt_hash,
        href: LEGISLATIVE_IMPACT_SURFACE_PATH,
        receipt_href: LEGISLATIVE_IMPACT_RECEIPT_PATH
      },
      atlas_historical_compare: legislativeImpactFixture.atlas_historical_compare,
      lighthouse_accountability_view: legislativeImpactFixture.lighthouse_accountability_view,
      instantiated_checklist: legislativeImpactFixture.instantiated_checklist,
      projection_executed: legislativeImpactFixture.projection_executed,
      database_persisted: legislativeImpactFixture.database_persisted
    },
    persistence_preflight: {
      state: 'available_no_write',
      target_schema: 'kaleidoscope',
      live_write_authorized: false,
      credentials_required: false,
      sql_emitted: false,
      scenario_plans: [
        {
          scenario_id: derived.project2025PersistencePlan.scenario_id,
          persistence_plan_hash: derived.project2025PersistencePlan.persistence_plan_hash,
          blocker_count: derived.project2025PersistencePlan.blocker_count,
          blockers: derived.project2025PersistencePlan.blockers,
          live_write_authorized: derived.project2025PersistencePlan.live_write_authorized,
          database_write_count: derived.project2025PersistencePlan.database_write_count
        },
        {
          scenario_id: derived.localPreemptionPersistencePlan.scenario_id,
          persistence_plan_hash: derived.localPreemptionPersistencePlan.persistence_plan_hash,
          blocker_count: derived.localPreemptionPersistencePlan.blocker_count,
          blockers: derived.localPreemptionPersistencePlan.blockers,
          live_write_authorized: derived.localPreemptionPersistencePlan.live_write_authorized,
          database_write_count: derived.localPreemptionPersistencePlan.database_write_count
        }
      ]
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
      table_names: Object.keys(substrateReceipt.row_counts).sort(),
      function_count: substrateReceipt.schema.function_count,
      trigger_count: substrateReceipt.schema.trigger_count,
      exact_total_rows: rowCount,
      all_tables_rls_enabled: substrateReceipt.schema.rls_state === 'enabled_all_truth_bearing_tables',
      rls_policy_state: substrateReceipt.schema.rls_policy_state,
      service_role_access: substrateReceipt.schema.service_role_access,
      append_only_update_delete_boundary: substrateReceipt.schema.append_only_update_delete_boundary,
      migration_history: substrateReceipt.live_migrations,
      substrate_state: substrateReceipt.state,
      canonical_persistence_state: substrateReceipt.canonical_persistence_state,
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
        receipt_id: localPreemption.receipt.run_id,
        label: 'Local preemption family deterministic run',
        state: 'executed_test_fixture',
        receipt_hash: localPreemption.receipt.receipt_hash,
        run_id: localPreemption.receipt.run_id,
        href: LOCAL_PREEMPTION_RECEIPT_PATH
      },
      {
        receipt_id: legislativeImpact.receipt.run_id,
        label: 'Legislative Consequence Stage 3 impact surface',
        state: 'source_controlled_no_projection',
        receipt_hash: legislativeImpact.receipt.receipt_hash,
        run_id: legislativeImpact.receipt.run_id,
        href: LEGISLATIVE_IMPACT_RECEIPT_PATH
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
      canonical_projection_execution: false,
      legislative_consequence_stage_1_2: true,
      legislative_consequence_stage_3: true,
      legislative_consequence_stages_4_6: false,
      persistence_preflight_available: true,
      persistence_live_write_authorized: false,
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
      local_preemption_scenario_detail: LOCAL_PREEMPTION_FRONTEND_PATH,
      legislative_consequence_stage_3: LEGISLATIVE_IMPACT_SURFACE_PATH,
      legislative_consequence_stage_3_receipt: LEGISLATIVE_IMPACT_RECEIPT_PATH,
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
