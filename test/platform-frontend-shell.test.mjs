import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  KALEIDOSCOPE_APP_PATH,
  KALEIDOSCOPE_APP_READ_MODEL_PATH,
  KALEIDOSCOPE_APP_FRONTEND_VERSION,
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
  assert.equal(model.frontend_version, '1.2.0');
  assert.equal(model.read_model_version, '1.2.0');
  assert.equal(model.deterministic, true);
  assert.equal(model.summary.active_source_artifacts, 41);
  assert.equal(model.summary.scenario_count, 2);
  assert.equal(model.scenarios.length, 2);
  assert.equal(model.summary.lens_count, 7);
  assert.equal(model.summary.preserved_collision_count, 5);
  assert.equal(model.summary.accepted_civic_genome_bindings, 0);
  assert.equal(model.summary.database_tables, 16);
  assert.equal(model.summary.database_rows, 0);
  assert.equal(model.summary.database_migrations, 2);

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
  assert.equal(model.database_substrate.table_count, 16);
  assert.equal(model.database_substrate.table_names.length, 16);
  assert.equal(model.database_substrate.function_count, 3);
  assert.equal(model.database_substrate.trigger_count, 17);
  assert.equal(model.database_substrate.exact_total_rows, 0);
  assert.equal(model.database_substrate.all_tables_rls_enabled, true);
  assert.equal(model.database_substrate.rls_policy_state, 'none_intentional_deny_by_default');
  assert.equal(model.database_substrate.service_role_access, 'select_insert_only');
  assert.equal(model.database_substrate.append_only_update_delete_boundary, 'trigger_enforced');
  assert.equal(model.database_substrate.migration_history.length, 2);
  assert.equal(model.database_substrate.substrate_state, 'projection_substrate_applied_empty_unbound');
  assert.equal(model.database_substrate.canonical_persistence_state, 'schema_present_empty_runtime_not_bound');
  assert.equal(model.database_substrate.runtime_database_write_path_proven, false);
});

test('derives Legislative Consequence stages 1 and 2 without inventing later stages or projection', () => {
  const model = kaleidoscopePlatformReadModel();
  const capability = model.capabilities.find((entry) => entry.capability_id === 'legislative_consequence_stage_1_2');
  assert.equal(capability.state, 'source_controlled_no_projection');
  assert.equal(model.legislative_consequence.structural_delta_count, 12);
  assert.equal(model.legislative_consequence.consequence_edge_count, 6);
  assert.equal(model.legislative_consequence.platform_binding_count, 6);
  assert.equal(model.legislative_consequence.preserved_conflict_count, 1);
  assert.equal(model.legislative_consequence.upstream_trigger, 'user_initiated_rosetta_run');
  assert.equal(model.legislative_consequence.impact_surface, null);
  assert.equal(model.legislative_consequence.atlas_historical_compare, null);
  assert.equal(model.legislative_consequence.lighthouse_accountability_view, null);
  assert.equal(model.legislative_consequence.instantiated_checklist, null);
  assert.equal(model.legislative_consequence.projection_executed, false);
  assert.equal(model.legislative_consequence.database_persisted, false);
  assert.equal(model.system_boundary.legislative_consequence_stage_1_2, true);
  assert.equal(model.system_boundary.legislative_consequence_stages_3_6, false);
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
    assert.ok(plan.blockers.includes('source_binding_upstream_ownership_mapping_not_declared'));
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

  assert.equal(css.statusCode, 200);
  assert.match(css.body, /@media \(max-width: 900px\)/);
  assert.match(css.body, /@media \(max-width: 640px\)/);
  assert.match(css.body, /prefers-reduced-motion/);
});

test('serves four proof records and both scenario receipts are inspectable', async () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.receipts.length, 4);
  const titleReceipt = model.receipts.find((receipt) => receipt.receipt_id === 'project2025_title_vii_vertical_slice.v1');
  const preemptionReceipt = model.receipts.find((receipt) => String(receipt.receipt_id).startsWith('preempt-run-'));
  assert.equal(titleReceipt.href, '/v1/project2025/title-vii/receipt');
  assert.equal(preemptionReceipt.href, '/v1/scenarios/state-local-protections/receipt');
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