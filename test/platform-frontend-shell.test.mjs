import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KALEIDOSCOPE_APP_PATH,
  KALEIDOSCOPE_APP_READ_MODEL_PATH,
  KALEIDOSCOPE_APP_FRONTEND_VERSION,
  kaleidoscopePlatformReadModel,
  resolveKaleidoscopePlatformFrontendRequest
} from '../src/platform-frontend-shell.mjs';
import { sha256Hex } from '../src/hash.mjs';

test('builds a deterministic platform read model over the current source-controlled state', () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.platform, 'kaleidoscope');
  assert.equal(model.environment, 'staging');
  assert.equal(model.frontend_version, KALEIDOSCOPE_APP_FRONTEND_VERSION);
  assert.equal(model.deterministic, true);
  assert.equal(model.summary.active_source_artifacts, 41);
  assert.equal(model.summary.scenario_count, 1);
  assert.equal(model.summary.lens_count, 4);
  assert.equal(model.summary.preserved_collision_count, 3);
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

test('represents the database as present and empty without inventing runtime persistence', () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.database_substrate.schema_name, 'kaleidoscope');
  assert.equal(model.database_substrate.table_count, 16);
  assert.equal(model.database_substrate.table_names.length, 16);
  assert.equal(model.database_substrate.exact_total_rows, 0);
  assert.equal(model.database_substrate.all_tables_rls_enabled, true);
  assert.equal(model.database_substrate.migration_history.length, 2);
  assert.equal(model.database_substrate.runtime_database_write_path_proven, false);
  assert.equal(model.database_substrate.canonical_persistence_state, 'schema_present_empty_runtime_not_bound');

  const substrateCapability = model.capabilities.find((capability) => capability.capability_id === 'projection_substrate');
  const persistenceCapability = model.capabilities.find((capability) => capability.capability_id === 'canonical_projection_persistence');
  assert.equal(substrateCapability.state, 'schema_present_empty');
  assert.equal(persistenceCapability.state, 'runtime_not_bound');
});

test('derives Legislative Consequence Stage 1/2 from the source-controlled specimen without claiming projection', () => {
  const model = kaleidoscopePlatformReadModel();
  const capability = model.capabilities.find((entry) => entry.capability_id === 'legislative_consequence_stage_1_2');
  assert.equal(capability.state, 'stage_1_2_source_controlled');
  assert.equal(model.legislative_consequence.state, 'stage_1_2_source_controlled_stages_3_6_null');
  assert.equal(model.legislative_consequence.structural_delta_count, 12);
  assert.equal(model.legislative_consequence.consequence_edge_count, 6);
  assert.equal(model.legislative_consequence.platform_binding_count, 6);
  assert.equal(model.legislative_consequence.preserved_conflict_count, 1);
  assert.equal(model.legislative_consequence.projection_executed, false);
  assert.equal(model.legislative_consequence.database_persisted, false);
  assert.equal(model.system_boundary.legislative_consequence_projection_execution, false);
});

test('does not overstate accepted binding, canonical projection, or AI runtime state', () => {
  const model = kaleidoscopePlatformReadModel();
  assert.equal(model.system_boundary.database_persistence, false);
  assert.equal(model.system_boundary.canonical_projection_execution, false);
  assert.equal(model.system_boundary.runtime_ai_dependency, false);
  assert.equal(model.system_boundary.hidden_composite_score, false);
  assert.equal(model.system_boundary.unresolved_states_preserved, true);
  assert.equal(model.summary.accepted_civic_genome_bindings, 0);
});

test('surfaces the existing Project 2025 scenario as a child of the platform workspace', () => {
  const model = kaleidoscopePlatformReadModel();
  const scenario = model.scenarios[0];
  assert.equal(scenario.policy_family_id, 'gender_identity_title_vii_redefinition.v1');
  assert.equal(scenario.state, 'executed_test_fixture_not_canonical_fact');
  assert.equal(scenario.mechanism_count, 2);
  assert.equal(scenario.lens_count, 4);
  assert.equal(scenario.collision_count, 3);
  assert.equal(scenario.href, '/project2025/title-vii');
});

test('serves the platform HTML with strict self-only browser boundaries', async () => {
  const response = await resolveKaleidoscopePlatformFrontendRequest(KALEIDOSCOPE_APP_PATH);
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'text/html; charset=utf-8');
  assert.match(response.body, /Inspect transformations, not conclusions/);
  assert.match(response.body, /Platform ownership map/);
  assert.match(response.body, /Scenario spotlight/);
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

test('serves the exact platform read model as JSON and fails closed on unrelated routes', async () => {
  const response = await resolveKaleidoscopePlatformFrontendRequest(KALEIDOSCOPE_APP_READ_MODEL_PATH);
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(response.body), kaleidoscopePlatformReadModel());
  assert.equal(response.cacheControl, 'no-store');

  assert.equal(await resolveKaleidoscopePlatformFrontendRequest('/app/unknown'), null);
  assert.equal(await resolveKaleidoscopePlatformFrontendRequest('/../../etc/passwd'), null);
});
