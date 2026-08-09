import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.complete.v1.mjs';
import {
  assertLegislativeConsequenceFixture,
  assertLegislationPlatformBindings,
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

test('binds legislation through Docket Room, Rosetta, and Civic Genome without collapsing ownership', () => {
  const bindings = assertLegislationPlatformBindings(fixture.legislation_platform_bindings);
  assert.equal(bindings.binding_count, 6);
  const docket = bindings.bindings.find((entry) => entry.binding_id === 'docket_room:legiscan:2115794');
  const rosetta = bindings.bindings.find((entry) => entry.binding_id === 'rosetta:extraction_run:26');
  const genomeBill = bindings.bindings.find((entry) => entry.binding_id === 'civic_genome:bill:ea189395-af71-4d61-907a-508220d6d410');
  const genomeAssembly = bindings.bindings.find((entry) => entry.binding_id === 'civic_genome:assembly:6c5b1326-3c96-41d3-8950-ddc46cb5ebf5');
  const genomeEvent = bindings.bindings.find((entry) => entry.binding_id === 'civic_genome:event:a8b3889c-9bb0-4c02-8d88-242bebe0eba8');
  assert.equal(docket.source_last_action, 'Governor Signed');
  assert.equal(rosetta.verification_state, 'complete');
  assert.equal(genomeBill.current_state_position, 'introduced');
  assert.equal(genomeAssembly.run_status, 'completed');
  assert.equal(genomeEvent.event_type, 'enacted');
  assert.equal(bindings.conflicts[0].resolution_state, 'unresolved_preserved');
  assert.equal(bindings.conflicts[0].prohibited_resolution, 'do_not_silently_choose_or_overwrite_any_source_record');
});

test('preserves completed Rosetta assembly and Prism absence as explicit source state', () => {
  const genomeBill = fixture.legislation_platform_bindings.bindings.find(
    (entry) => entry.binding_id === 'civic_genome:bill:ea189395-af71-4d61-907a-508220d6d410'
  );
  assert.equal(fixture.legislation_platform_bindings.run_transition.post_run_observation.rosetta_source_binding_count, 1);
  assert.equal(fixture.legislation_platform_bindings.run_transition.post_run_observation.completed_assembly_count, 1);
  assert.equal(fixture.legislation_platform_bindings.run_transition.post_run_observation.trait_count, 7);
  assert.equal(genomeBill.rosetta_source_binding_count, 1);
  assert.equal(genomeBill.completed_assembly_count, 1);
  assert.equal(genomeBill.trait_count, 7);
  assert.equal(genomeBill.prism_binding_count, 0);
  assert.ok(genomeBill.unresolved_conditions.includes('prism_verification_not_observed'));
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

test('rejects silent resolution of the Docket and Civic Genome state conflict', () => {
  const changed = structuredClone(fixture);
  changed.legislation_platform_bindings.conflicts[0].resolution_state = 'resolved';
  assert.throws(
    () => assertLegislativeConsequenceFixture(changed),
    /platform_conflict_must_remain_unresolved/
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
