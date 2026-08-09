import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../fixtures/local-preemption-family-vertical-slice.v1.mjs';
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import operability from '../lenses/preemption_operability.v1.json' with { type: 'json' };
import temporalHistory from '../lenses/preemption_temporal_history.v1.json' with { type: 'json' };
import jurisdictionalVariation from '../lenses/preemption_jurisdictional_variation.v1.json' with { type: 'json' };
import { executeLocalPreemptionFamilyVerticalSlice } from '../src/local-preemption-family-slice.mjs';

const lensManifests = [
  affectedPopulations,
  operability,
  temporalHistory,
  jurisdictionalVariation
];

function execute() {
  return executeLocalPreemptionFamilyVerticalSlice(fixture, lensManifests);
}

test('executes the five-jurisdiction preemption family without claiming canonical fact or prediction', () => {
  const result = execute();
  assert.equal(result.bundle.policy_family_id, 'local_lgbtq_ordinance_preemption.v1');
  assert.equal(result.bundle.scenario_id, 'local_lgbtq_ordinance_preemption_vertical_slice.v1');
  assert.equal(result.bundle.projection_claim_state, 'not_prediction_not_canonical_fact');
  assert.equal(result.bundle.no_mutation, true);
  assert.equal(result.bundle.database_write_count, 0);
  assert.equal(result.read_model.status, 'executed_test_fixture_not_canonical_fact');
  assert.match(result.read_model.title, /Local LGBTQ-Ordinance Preemption/);
});

test('preserves the temporal heterogeneity of operative, expired, contested, and newly preempted states', () => {
  const { bundle } = execute();
  const operations = new Map(bundle.diff.operations.map((operation) => [operation.component_id, operation.operation]));
  assert.equal(operations.get('tn_local_nondiscrimination_preemption'), 'preserved');
  assert.equal(operations.get('ar_local_nondiscrimination_preemption'), 'preserved');
  assert.equal(operations.get('nc_local_nondiscrimination_preemption'), 'preserved');
  assert.equal(operations.get('tx_broad_preemption_instrument'), 'modified');
  assert.equal(operations.get('tx_lgbtq_ordinance_application'), 'unresolved');
  assert.equal(operations.get('ia_local_nondiscrimination_authority'), 'preempted');
});

test('does not silently relabel North Carolina historical expiry as a current operative mechanism', () => {
  const nc = fixture.mechanisms.find((mechanism) => mechanism.mechanism_id === 'PREEMPT-NC-HB2-HISTORICAL');
  assert.equal(nc.implementation_state, 'unresolved');
  assert.ok(nc.model.unresolved_questions.some((question) => question.includes('no historical_expired state')));
  const component = fixture.changed.components.find((entry) => entry.component_id === 'nc_local_nondiscrimination_preemption');
  assert.equal(component.status, 'historical_preemption_expired');
  assert.equal(component.temporal_state, 'expired_in_2020_local_authority_restored');
});

test('preserves similar-effect relationships without asserting centralized coordination', () => {
  assert.equal(fixture.relationships.length, 4);
  for (const relationship of fixture.relationships) {
    assert.equal(relationship.relationship_type, 'produces_similar_effect');
    assert.equal(relationship.causal_claim_state, 'not_asserted');
  }
  const result = execute();
  assert.ok(result.bundle.excluded_factors.some((statement) => statement.includes('No centralized coordination')));
});

test('executes four independent lenses and preserves two cross-lens collisions', () => {
  const { bundle } = execute();
  assert.equal(bundle.lens_results.length, 4);
  assert.equal(bundle.collisions.length, 2);
  const collisions = new Map(bundle.collisions.map((collision) => [collision.collision_id, collision]));
  assert.equal(collisions.get('collision_family_active_vs_expired').resolution_state, 'preserved_not_averaged');
  assert.equal(collisions.get('collision_texas_instrument_vs_application').resolution_state, 'preserved_not_averaged');
});

test('preserves source verification ceilings by jurisdiction', () => {
  const { bundle } = execute();
  const effects = bundle.lens_results.flatMap((result) => result.effects);
  const tn = effects.find((effect) => effect.effect_type === 'operative_preemption_persists' && effect.jurisdiction === 'TN');
  const nc = effects.find((effect) => effect.effect_type === 'historical_preemption_expired');
  const tx = effects.find((effect) => effect.effect_type === 'lgbtq_specific_application_unresolved');
  const ia = effects.find((effect) => effect.effect_type === 'local_authority_preempted');
  assert.equal(tn.evidence_ceiling, 'primary_verified');
  assert.equal(nc.evidence_ceiling, 'secondary_verified');
  assert.equal(tx.evidence_ceiling, 'secondary_verified');
  assert.equal(ia.evidence_ceiling, 'secondary_verified_high_confidence');
  assert.ok(tx.unresolved_conditions.includes('dallas_litigation_outcome_not_established_in_source_pack'));
});

test('replay is byte-equivalent at the deterministic object level', () => {
  const first = execute();
  const second = execute();
  assert.deepEqual(second, first);
  assert.equal(second.bundle.projection_bundle_hash, first.bundle.projection_bundle_hash);
  assert.equal(second.read_model.read_model_hash, first.read_model.read_model_hash);
  assert.equal(second.receipt.receipt_hash, first.receipt.receipt_hash);
  assert.equal(second.receipt.deterministic_replay_key, first.receipt.deterministic_replay_key);
});

test('rejects an unsupported causal claim inserted into the family relationship graph', () => {
  const changed = structuredClone(fixture);
  changed.relationships[0].causal_claim_state = 'asserted';
  assert.throws(
    () => executeLocalPreemptionFamilyVerticalSlice(changed, lensManifests),
    /similar_effect_must_not_assert_causation/
  );
});
