import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.v1.json' with { type: 'json' };
import {
  assertLegislativeConsequenceFixture,
  assertStructuralDeltaBundle,
  assertConsequenceGraph,
  structuralDeltaHashBasis
} from '../src/legislative-consequence.mjs';
import { sha256Hex } from '../src/hash.mjs';

test('accepts the deterministic EEOC structural delta and typed consequence graph', () => {
  assert.equal(assertLegislativeConsequenceFixture(fixture), fixture);
  assert.equal(fixture.structural_delta_bundle.delta_count, 12);
  assert.equal(fixture.consequence_graph.edge_count, 6);
  assert.equal(fixture.projection_executed, false);
  assert.equal(fixture.database_persisted, false);
});

test('replay preserves exact bundle and graph hashes', () => {
  const replay = structuredClone(fixture);
  assertStructuralDeltaBundle(replay.structural_delta_bundle, replay.source_bundle);
  assertConsequenceGraph(replay.consequence_graph, replay.structural_delta_bundle, replay.source_bundle);
  assert.equal(replay.structural_delta_bundle.bundle_hash, fixture.structural_delta_bundle.bundle_hash);
  assert.equal(replay.consequence_graph.graph_hash, fixture.consequence_graph.graph_hash);
});

test('rejects a changed source span under the old delta hash', () => {
  const changed = structuredClone(fixture);
  changed.structural_delta_bundle.deltas[0].legal_citations[0].locator = 'altered locator';
  assert.throws(
    () => assertLegislativeConsequenceFixture(changed),
    /delta_hash_mismatch/
  );
});

test('rejects rehashed delta content under a stale bundle hash', () => {
  const changed = structuredClone(fixture);
  const delta = changed.structural_delta_bundle.deltas[0];
  delta.proposed_state.text = 'altered substantive result';
  delta.delta_hash = sha256Hex(structuralDeltaHashBasis(delta));
  assert.throws(
    () => assertLegislativeConsequenceFixture(changed),
    /bundle_hash_mismatch/
  );
});

test('rejects a consequence edge referencing an unknown structural delta', () => {
  const changed = structuredClone(fixture);
  changed.consequence_graph.edges[0].from_delta_ids = ['lcd-does-not-exist'];
  assert.throws(
    () => assertLegislativeConsequenceFixture(changed),
    /edge_unknown_delta/
  );
});

test('rejects a direct legal effect labeled as hypothesis-only causation', () => {
  const changed = structuredClone(fixture);
  changed.consequence_graph.edges[0].causal_state = 'hypothesis_only';
  assert.throws(
    () => assertLegislativeConsequenceFixture(changed),
    /edge_causal_state_not_allowed/
  );
});

test('preserves downstream enforcement claims as unresolved hypotheses', () => {
  const edge = fixture.consequence_graph.edges.find(
    (candidate) => candidate.edge_id === 'lce-eeoc-2026-proactive-analysis-effect-unresolved'
  );
  assert.equal(edge.relationship_type, 'possible_downstream_effect');
  assert.equal(edge.causal_state, 'hypothesis_only');
  assert.ok(edge.unresolved_conditions.includes('causation_not_asserted'));
});
