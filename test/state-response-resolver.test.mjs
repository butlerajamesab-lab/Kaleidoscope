import test from 'node:test';
import assert from 'node:assert/strict';
import fixture, {stateResponseFixtures} from '../fixtures/state-response-guidance-rescission-partial.v1.mjs';
import {resolveStateResponse} from '../src/state-response-resolver.mjs';

test('resolves a ranked but fail-closed partial-primary-source projection', () => {
  const result = resolveStateResponse(fixture);
  assert.equal(result.mechanism_id, 'P25-DOL-01');
  assert.equal(result.acceptance_state, 'fail_closed_missing_primary_sources');
  assert.equal(result.pathways[0].outcome_class, 'preserve');
  assert.equal(result.pathways.length, 2);
  assert.equal(result.pathways[0].ranking.priority_score, 26);
  assert.equal(result.mechanism.implementation_edges.find(edge => edge.from === 'texas-v-eeoc').causal, false);
  assert.match(result.result_hash, /^[0-9a-f]{64}$/);
  assert.match(result.disclaimer, /not legal advice/);
});

test('requires an identified operative instrument', () => {
  const invalid = structuredClone(fixture);
  invalid.mechanism.observed_implementation.events.find(event => event.operative).operative = false;
  assert.throws(() => resolveStateResponse(invalid), /operative_instrument_not_identified/);
});

test('resolves Texas separately and preserves outcome-relevant uncertainty', () => {
  const result = resolveStateResponse(stateResponseFixtures['US-TX']);
  assert.equal(result.jurisdiction_id, 'US-TX');
  assert.equal(result.acceptance_state, 'fail_closed_missing_primary_sources');
  assert.deepEqual(result.pathways.map(pathway => pathway.outcome_class), ['insulate','monitor_and_prepare']);
  assert.ok(result.no_go_paths.some(path => /aggregate local-coverage/.test(path.proposed_action)));
});

test('fails when outcome-determinative constraint remains unresolved', () => {
  const invalid = structuredClone(fixture);
  invalid.candidates[0].constraints[0] = {type:'federal_preemption_conflict',effect:'uncertain',outcome_determinative:true};
  assert.throws(() => resolveStateResponse(invalid), /outcome_determinative_constraint_unresolved/);
});
