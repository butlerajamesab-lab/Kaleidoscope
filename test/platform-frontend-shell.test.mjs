import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  KALEIDOSCOPE_APP_PATH,
  KALEIDOSCOPE_APP_READ_MODEL_PATH,
  KALEIDOSCOPE_APP_FRONTEND_VERSION,
  applyCivicGenomeDurableIntake,
  kaleidoscopePlatformReadModel,
  resolveKaleidoscopePlatformFrontendRequest
} from '../src/platform-frontend-shell.mjs';
import { sha256Hex } from '../src/hash.mjs';

const html = await readFile(new URL('../public/kaleidoscope-app.html', import.meta.url), 'utf8');
const browserJs = await readFile(new URL('../public/kaleidoscope-app.js', import.meta.url), 'utf8');

test('builds one deterministic platform read model over both bounded examples', () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.platform, 'kaleidoscope');
  assert.equal(model.environment, 'staging');
  assert.equal(model.frontend_version, KALEIDOSCOPE_APP_FRONTEND_VERSION);
  assert.equal(model.frontend_version, '1.4.0');
  assert.equal(model.read_model_version, '1.4.0');
  assert.equal(model.deterministic, true);
  assert.equal(model.summary.active_source_artifacts, 41);
  assert.equal(model.summary.scenario_count, 2);
  assert.equal(model.scenarios.length, 2);
  assert.equal(model.summary.lens_count, 7);
  assert.equal(model.summary.preserved_collision_count, 5);
  assert.equal(model.summary.accepted_civic_genome_bindings, 0);
  assert.equal(model.summary.civic_genome_durable_snapshots, 0);
  assert.equal(model.summary.civic_genome_durable_components, 0);
  assert.equal(model.summary.database_tables, 36);
  assert.equal(model.summary.database_rows, 0);
  assert.equal(model.summary.database_migrations, 5);

  const { read_model_hash: observedHash, ...basis } = model;
  assert.equal(observedHash, sha256Hex(basis));
});

test('overlays accepted Civic Genome durable intake without claiming a canonical projection', () => {
  const model = applyCivicGenomeDurableIntake(kaleidoscopePlatformReadModel(), {
    read_model_version: '1.0.0',
    state: 'durable_intake_active',
    available: true,
    binding_count: 3,
    snapshot_count: 3,
    component_count: 32,
    projection_run_count: 0,
    projection_result_count: 0,
    replay_receipt_count: 0,
    error_code: null,
    records: [{
      external_snapshot_id: 'cg-family-snapshot-2ddd949cf353a1623f0002b593f0151c',
      snapshot_hash: '6c686159fc70c57384a760e66bc6a59338a2df6a3506d5cad73129aab53a6709',
      verification_state: 'mapped_by_declared_rule',
      bound_at: '2026-08-21T20:41:09.491699Z',
      snapshot_kind: 'baseline',
      as_of_date: '2026-08-21',
      created_at: '2026-08-21T20:41:09.952698Z',
      component_count: 11
    }]
  });

  assert.equal(model.summary.accepted_civic_genome_bindings, 3);
  assert.equal(model.summary.civic_genome_durable_snapshots, 3);
  assert.equal(model.summary.civic_genome_durable_components, 32);
  assert.equal(model.summary.database_rows, 0);
  assert.equal(model.civic_genome_durable_intake.state, 'durable_intake_active');
  assert.equal(model.platform_contracts.find((entry) => entry.platform_id === 'civic_genome').state, 'accepted_durable_no_projection');
  assert.equal(model.capabilities.find((entry) => entry.capability_id === 'civic_genome_snapshot_validation').state, 'accepted_durable_no_projection');
  assert.equal(model.capabilities.find((entry) => entry.capability_id === 'projection_substrate').state, 'durable_intake_active');
  assert.equal(model.capabilities.find((entry) => entry.capability_id === 'canonical_projection_persistence').state, 'runtime_not_bound');
  assert.equal(model.system_boundary.civic_genome_projection_run_count, 0);
  assert.equal(model.system_boundary.civic_genome_projection_result_count, 0);
  assert.equal(model.system_boundary.civic_genome_replay_receipt_count, 0);
  assert.equal(model.receipts.length, 6);
  assert.equal(model.receipts.at(-1).receipt_id, 'civic_genome_durable_intake.live.v1');

  const { read_model_hash: observedHash, ...basis } = model;
  assert.equal(observedHash, sha256Hex(basis));
});

test('preserves the constitutional ownership boundary across peer platforms', () => {
  const model = kaleidoscopePlatformReadModel();
  const owners = new Map(model.platform_contracts.map((contract) => [contract.platform_id, contract]));
  assert.equal(owners.get('docket_room').mutation, 'prohibited');
  assert.equal(owners.get('rosetta').mutation, 'prohibited');
  assert.equal(owners.get('civic_genome').state, 'validated_unbound');
  assert.equal(owners.get('prism').mutation, 'prohibited');
  assert.equal(owners.get('atlas').mutation, 'prohibited');
  assert.equal(owners.get('esquire').state, 'contract_not_established');
  assert.equal(model.system_boundary.upstream_mutation, false);
});

test('reads the canonical live Supabase receipt and preserves an empty runtime-unbound state', () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.database_substrate.receipt_id, 'kaleidoscope_supabase_projection_substrate_2026_08_09.v1');
  assert.equal(model.database_substrate.schema_name, 'kaleidoscope');
  assert.equal(model.database_substrate.table_count, 36);
  assert.equal(model.database_substrate.table_names.length, 36);
  assert.equal(model.database_substrate.function_count, 3);
  assert.equal(model.database_substrate.trigger_count, 37);
  assert.equal(model.database_substrate.exact_total_rows, 0);
  assert.equal(model.database_substrate.all_tables_rls_enabled, true);
  assert.equal(model.database_substrate.rls_policy_state, 'none_intentional_deny_by_default');
  assert.equal(model.database_substrate.service_role_access, 'select_insert_only');
  assert.equal(model.database_substrate.append_only_update_delete_boundary, 'trigger_enforced');
  assert.equal(model.database_substrate.migration_history.length, 5);
  assert.equal(model.database_substrate.substrate_state, 'state_response_projection_substrate_applied_empty_unbound');
  assert.equal(model.database_substrate.canonical_persistence_state, 'schema_present_empty_runtime_not_bound');
  assert.equal(model.database_substrate.runtime_database_write_path_proven, false);
});

test('derives Legislative Consequence stages 1 through 3 without inventing later stages or projection', () => {
  const model = kaleidoscopePlatformReadModel();
  const stage12 = model.capabilities.find((entry) => entry.capability_id === 'legislative_consequence_stage_1_2');
  const stage3 = model.capabilities.find((entry) => entry.capability_id === 'legislative_consequence_stage_3');
  const consequence = model.legislative_consequence;
  const impact = consequence.impact_surface;

  assert.equal(stage12.state, 'source_controlled_no_projection');
  assert.equal(stage3.state, 'source_controlled_no_projection');
  assert.equal(consequence.state, 'stage_1_3_source_controlled_stages_4_6_null_no_projection');
  assert.equal(consequence.structural_delta_count, 12);
  assert.equal(consequence.consequence_edge_count, 6);
  assert.equal(consequence.platform_binding_count, 6);
  assert.equal(consequence.preserved_conflict_count, 1);
  assert.equal(consequence.upstream_trigger, 'user_initiated_rosetta_run');
  assert.equal(consequence.stage_1_2_fixture_impact_surface, null);
  assert.equal(impact.state, 'stage_3_source_controlled_no_projection');
  assert.equal(impact.impact_item_count, 5);
  assert.equal(impact.touched_actor_count, 14);
  assert.deepEqual(impact.effect_class_counts, { legal: 3, operational: 2, economic: 0, administrative: 1 });
  assert.equal(impact.deferred_reference_count, 1);
  assert.equal(impact.atlas_historical_comparison_executed, false);
  assert.equal(impact.lighthouse_accountability_executed, false);
  assert.equal(impact.checklist_instantiated, false);
  assert.match(impact.impact_surface_hash, /^[0-9a-f]{64}$/);
  assert.match(impact.receipt_hash, /^[0-9a-f]{64}$/);
  assert.equal(impact.href, '/v1/legislative-consequence/eeoc/impact-surface');
  assert.equal(impact.receipt_href, '/v1/legislative-consequence/eeoc/impact-surface/receipt');
  assert.equal(consequence.atlas_historical_compare, null);
  assert.equal(consequence.lighthouse_accountability_view, null);
  assert.equal(consequence.instantiated_checklist, null);
  assert.equal(consequence.projection_executed, false);
  assert.equal(consequence.database_persisted, false);
  assert.equal(model.system_boundary.legislative_consequence_stage_1_2, true);
  assert.equal(model.system_boundary.legislative_consequence_stage_3, true);
  assert.equal(model.system_boundary.legislative_consequence_stages_4_6, false);
});

test('runs persistence preflight for both examples while authorizing zero writes', () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.persistence_preflight.state, 'available_no_write');
  assert.equal(model.persistence_preflight.target_schema, 'kaleidoscope');
  assert.equal(model.persistence_preflight.live_write_authorized, false);
  assert.equal(model.persistence_preflight.credentials_required, false);
  assert.equal(model.persistence_preflight.sql_emitted, false);
  assert.equal(model.persistence_preflight.scenario_plans.length, 2);
  for (const plan of model.persistence_preflight.scenario_plans) {
    assert.equal(plan.live_write_authorized, false);
    assert.equal(plan.database_write_count, 0);
    assert.equal(plan.blockers.includes('source_binding_upstream_ownership_mapping_not_declared'), false);
    assert.ok(plan.blockers.includes('projection_claim_state_not_authorized_for_canonical_persistence'));
    assert.ok(plan.blockers.includes('runtime_database_transport_not_bound'));
    assert.match(plan.persistence_plan_hash, /^[0-9a-f]{64}$/);
  }
});

test('surfaces both bounded examples with truthful detail and receipt routes', () => {
  const model = kaleidoscopePlatformReadModel();
  const titleVii = model.scenarios.find((scenario) => scenario.policy_family_id === 'gender_identity_title_vii_redefinition.v1');
  const preemption = model.scenarios.find((scenario) => scenario.policy_family_id === 'local_lgbtq_ordinance_preemption.v1');

  assert.equal(titleVii.state, 'executed_test_fixture_not_canonical_fact');
  assert.equal(titleVii.href, '/project2025/title-vii');
  assert.equal(titleVii.receipt_href, '/v1/project2025/title-vii/receipt');
  assert.equal(titleVii.inspection_state, 'detailed_route_available');

  assert.equal(preemption.state, 'executed_test_fixture_not_canonical_fact');
  assert.equal(preemption.mechanism_count, 5);
  assert.equal(preemption.lens_count, 4);
  assert.equal(preemption.collision_count, 2);
  assert.equal(preemption.href, '/state-local-protections');
  assert.equal(preemption.receipt_href, '/v1/scenarios/state-local-protections/receipt');
  assert.equal(preemption.inspection_state, 'detailed_route_available');
  assert.equal(model.routes.local_preemption_scenario_detail, '/state-local-protections');
});

test('keeps Stage 3 citizen language primary and the technical Impact Surface term secondary', () => {
  assert.match(browserJs, /See who or what is directly touched by the legal change/);
  assert.match(browserJs, /It does not add new causation/);
  assert.match(browserJs, /zero economic impact items because none is declared/);
  assert.match(browserJs, /Legislative Consequence Stage 3 · Impact Surface/);
  assert.match(browserJs, /Who or what is directly touched\?/);
  assert.match(browserJs, /Historical comparison and later stages/);
});

test('keeps technical terminology secondary to plain-language public headings', () => {
  assert.match(html, />What changes</);
  assert.match(html, />Ways to examine it</);
  assert.match(html, />Evidence</);
  assert.match(html, />Proof &amp; history</);
  assert.match(html, />System details</);
  assert.match(html, /Internally these are called <strong>lenses<\/strong>/);
  assert.doesNotMatch(html, /First vertical slice/);
  assert.doesNotMatch(html, /<h1[^>]*>Lens registry<\/h1>/);
  assert.doesNotMatch(html, /<span>Receipts<\/span>/);

  assert.match(browserJs, /Employment discrimination and gender identity/);
  assert.match(browserJs, /U\.S\. Equal Employment Opportunity Commission/);
  assert.match(browserJs, /When states limit local nondiscrimination protections/);
  assert.match(browserJs, /Technical details/);
});

test('browser link rendering remains conditional even though both current examples now have routes', () => {
  assert.match(browserJs, /if \(scenario\.href\)/);
  assert.match(browserJs, /if \(scenario\.receipt_href\)/);
  assert.match(browserJs, /if \(lens\.href\)/);
  assert.match(browserJs, /Detailed evidence page not published yet/);
  assert.match(browserJs, /Detailed findings page not published yet/);
});

test('serves the citizen-first HTML with strict self-only browser boundaries', async () => {
  const response = await resolveKaleidoscopePlatformFrontendRequest(KALEIDOSCOPE_APP_PATH);
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'text/html; charset=utf-8');
  assert.match(response.body, /See exactly what changes when civic rules change/);
  assert.match(response.body, /Current Civic Genome durable intake/);
  assert.match(response.body, /Who owns what information/);
  assert.match(response.body, /What this page can claim/);
  assert.doesNotMatch(response.body, /Run scenario/i);
  assert.match(response.headers['content-security-policy'], /default-src 'self'/);
  assert.match(response.headers['permissions-policy'], /camera=\(\)/);
});

test('serves browser assets without dynamic HTML injection primitives', async () => {
  const js = await resolveKaleidoscopePlatformFrontendRequest('/app.js');
  const css = await resolveKaleidoscopePlatformFrontendRequest('/app.css');

  assert.equal(js.statusCode, 200);
  assert.equal(js.contentType, 'text/javascript; charset=utf-8');
  assert.match(js.body, /textContent/);
  assert.match(js.body, /replaceChildren/);
  assert.doesNotMatch(js.body, /innerHTML/);
  assert.doesNotMatch(js.body, /eval\(/);
  assert.match(js.body, /\/v1\/platform\/read-model/);
  assert.match(js.body, /accepted Civic Genome source binding/);
  assert.match(js.body, /Not executed/);

  assert.equal(css.statusCode, 200);
  assert.match(css.body, /@media \(max-width: 900px\)/);
  assert.match(css.body, /@media \(max-width: 640px\)/);
  assert.match(css.body, /prefers-reduced-motion/);
});

test('serves five proof records including Stage 3 and both scenario receipts', async () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.receipts.length, 5);
  const titleReceipt = model.receipts.find((receipt) => receipt.receipt_id === 'project2025_title_vii_vertical_slice.v1');
  const preemptionReceipt = model.receipts.find((receipt) => String(receipt.receipt_id).startsWith('preempt-run-'));
  const impactReceipt = model.receipts.find((receipt) => String(receipt.receipt_id).startsWith('impact-run-'));
  assert.equal(titleReceipt.href, '/v1/project2025/title-vii/receipt');
  assert.equal(preemptionReceipt.href, '/v1/scenarios/state-local-protections/receipt');
  assert.equal(impactReceipt.href, '/v1/legislative-consequence/eeoc/impact-surface/receipt');
  assert.equal(impactReceipt.state, 'source_controlled_no_projection');
  assert.ok(model.receipts.some((receipt) => receipt.receipt_id === 'civic_genome_kaleidoscope_authenticated_handoff_hb2487_2026_08_04'));
  assert.ok(model.receipts.some((receipt) => receipt.receipt_id === 'kaleidoscope_supabase_projection_substrate_2026_08_09.v1'));

  const response = await resolveKaleidoscopePlatformFrontendRequest(KALEIDOSCOPE_APP_READ_MODEL_PATH);
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(response.body), model);
  assert.equal(response.cacheControl, 'no-store');
  assert.equal(await resolveKaleidoscopePlatformFrontendRequest('/app/unknown'), null);
  assert.equal(await resolveKaleidoscopePlatformFrontendRequest('/../../etc/passwd'), null);
});
