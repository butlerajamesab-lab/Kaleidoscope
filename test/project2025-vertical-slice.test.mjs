import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../fixtures/project2025-title-vii-vertical-slice.v1.mjs';
import emittedReadModel from '../fixtures/project2025-title-vii-read-model.v1.json' with { type: 'json' };
import emittedReceipt from '../fixtures/project2025-title-vii-receipt.v1.json' with { type: 'json' };
import civilRights from '../lenses/civil_rights.v1.json' with { type: 'json' };
import enforcement from '../lenses/enforcement_pathways.v1.json' with { type: 'json' };
import localPreemption from '../lenses/local_government_preemption.v1.json' with { type: 'json' };
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import { executeProject2025VerticalSlice } from '../src/project2025-vertical-slice.mjs';

const manifests = [civilRights, enforcement, localPreemption, affectedPopulations];

test('executes the bounded Project 2025 Title VII vertical slice', () => {
  const result = executeProject2025VerticalSlice(fixture, manifests);
  assert.equal(result.bundle.projection_claim_state, 'not_prediction_not_canonical_fact');
  assert.equal(result.bundle.no_mutation, true);
  assert.equal(result.bundle.database_write_count, 0);
  assert.equal(result.bundle.lens_results.length, 4);
  assert.equal(result.bundle.collisions.length, 3);
  assert.equal(result.read_model.summary.mechanism_count, 2);
  assert.equal(result.read_model.summary.lens_count, 4);
  assert.equal(result.receipt.no_mutation, true);
});

test('produces exact deterministic replay identities', () => {
  const first = executeProject2025VerticalSlice(fixture, manifests);
  const second = executeProject2025VerticalSlice(structuredClone(fixture), structuredClone(manifests));
  assert.deepEqual(second, first);
  assert.equal(second.receipt.receipt_hash, first.receipt.receipt_hash);
  assert.equal(second.bundle.projection_bundle_hash, first.bundle.projection_bundle_hash);
  assert.equal(second.read_model.read_model_hash, first.read_model.read_model_hash);
});

test('treats Rosetta not_run as a valid neutral upstream state when not required', () => {
  const result = executeProject2025VerticalSlice(fixture, manifests);
  assert.equal(result.bundle.upstream_processing.rosetta.state, 'not_run');
  assert.equal(result.bundle.upstream_processing.rosetta.required, false);
});

test('rejects required upstream state that has not completed', () => {
  const changed = structuredClone(fixture);
  changed.upstream_processing.rosetta.required = true;
  assert.throws(
    () => executeProject2025VerticalSlice(changed, manifests),
    /required_upstream_not_ready:rosetta:not_run/
  );
});

test('preserves produces_similar_effect as explicitly non-causal', () => {
  const relation = fixture.relationships.find((item) => item.relationship_type === 'produces_similar_effect');
  assert.equal(relation.causal_claim_state, 'not_asserted');
  const changed = structuredClone(fixture);
  changed.relationships.find((item) => item.relationship_type === 'produces_similar_effect').causal_claim_state = 'asserted';
  assert.throws(
    () => executeProject2025VerticalSlice(changed, manifests),
    /similar_effect_must_not_assert_causation/
  );
});

test('does not promote projection effects above the weakest source support', () => {
  const result = executeProject2025VerticalSlice(fixture, manifests);
  const preemptionEffect = result.bundle.lens_results
    .flatMap((lens) => lens.effects)
    .find((effect) => effect.effect_type === 'local_authority_preempted');
  assert.equal(preemptionEffect.evidence_ceiling, 'primary_source_not_obtained');
  assert.equal(preemptionEffect.verification_state, 'mixed');
});

test('rejects a component verification state above its source ceiling', () => {
  const changed = structuredClone(fixture);
  const component = changed.changed.components.find((item) => item.component_id === 'iowa_local_broader_nondiscrimination_authority');
  component.declared_verification_state = 'primary_verified';
  assert.throws(
    () => executeProject2025VerticalSlice(changed, manifests),
    /component_verification_exceeds_source_ceiling/
  );
});

test('preserves the formal-right versus agency-path collision', () => {
  const result = executeProject2025VerticalSlice(fixture, manifests);
  const collision = result.bundle.collisions.find((item) => item.collision_id === 'collision_formal_federal_right_vs_agency_path');
  assert.equal(collision.resolution_state, 'preserved_not_averaged');
});

test('changes the output hash when a declared lens rule changes', () => {
  const first = executeProject2025VerticalSlice(fixture, manifests);
  const changedManifests = structuredClone(manifests);
  changedManifests[0].rules[0].emit.statement = 'Changed governed rule statement.';
  const second = executeProject2025VerticalSlice(fixture, changedManifests);
  assert.notEqual(second.bundle.projection_bundle_hash, first.bundle.projection_bundle_hash);
  assert.notEqual(second.receipt.receipt_hash, first.receipt.receipt_hash);
});

test('produces a frontend-ready read model with inspectable hashes and unresolved state', () => {
  const result = executeProject2025VerticalSlice(fixture, manifests);
  assert.equal(result.read_model.status, 'executed_test_fixture_not_canonical_fact');
  assert.ok(result.read_model.lens_panels.every((panel) => Array.isArray(panel.effects)));
  assert.equal(result.read_model.inspection.projection_bundle_hash, result.bundle.projection_bundle_hash);
  assert.ok(result.read_model.unresolved_conditions.length >= 5);
});

test('matches the source-controlled frontend read model and deterministic receipt byte-for-byte', () => {
  const output = executeProject2025VerticalSlice(fixture, manifests);
  assert.deepEqual(output.read_model, emittedReadModel);
  assert.deepEqual(output.receipt, emittedReceipt);
});
