import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../fixtures/project2025-title-vii-vertical-slice.v1.mjs';
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import civilRights from '../lenses/civil_rights.v1.json' with { type: 'json' };
import enforcementPathways from '../lenses/enforcement_pathways.v1.json' with { type: 'json' };
import localGovernmentPreemption from '../lenses/local_government_preemption.v1.json' with { type: 'json' };
import { executeProject2025VerticalSlice } from '../src/project2025-vertical-slice.mjs';
import {
  buildProjectionRunEventContracts,
  mapCollisionLensResultContracts
} from '../src/projection-persistence-contracts.mjs';

const execution = () => executeProject2025VerticalSlice(fixture, [
  affectedPopulations,
  civilRights,
  enforcementPathways,
  localGovernmentPreemption
]);

test('maps each collision only to the two lenses that emitted its referenced effects', () => {
  const { bundle } = execution();
  const links = mapCollisionLensResultContracts({
    collisions: bundle.collisions,
    lensResults: bundle.lens_results
  });
  assert.equal(links.length, bundle.collisions.length * 2);
  for (const collision of bundle.collisions) {
    const linked = links.filter((link) => link.collision_external_id === collision.collision_id);
    assert.equal(linked.length, 2);
    assert.equal(new Set(linked.map((link) => link.lens_id)).size, 2);
    assert.ok(linked.every((link) => link.mapping_basis === 'referenced_effect_emitted_by_lens'));
  }
});

test('collision mapping is deterministic under lens-result input reordering', () => {
  const { bundle } = execution();
  const first = mapCollisionLensResultContracts({ collisions: bundle.collisions, lensResults: bundle.lens_results });
  const second = mapCollisionLensResultContracts({
    collisions: [...bundle.collisions].reverse(),
    lensResults: [...bundle.lens_results].reverse()
  });
  assert.deepEqual(second, first);
});

test('deduplicates the junction when both collision effects came from one lens', () => {
  const links = mapCollisionLensResultContracts({
    collisions: [{
      collision_id: 'same-lens-collision',
      left_effect_id: 'effect-left',
      right_effect_id: 'effect-right'
    }],
    lensResults: [{
      lens_id: 'temporal-state.v1',
      effects: [{ effect_id: 'effect-left' }, { effect_id: 'effect-right' }]
    }]
  });
  assert.deepEqual(links, [{
    collision_external_id: 'same-lens-collision',
    lens_id: 'temporal-state.v1',
    mapping_basis: 'referenced_effect_emitted_by_lens'
  }]);
});

test('fails closed when a collision references an effect that no lens emitted', () => {
  const { bundle } = execution();
  const collisions = structuredClone(bundle.collisions);
  collisions[0].left_effect_id = 'missing-effect';
  assert.throws(
    () => mapCollisionLensResultContracts({ collisions, lensResults: bundle.lens_results }),
    /collision_effect_owner_missing/
  );
});

test('rejects duplicate collision identifiers before emitting ambiguous links', () => {
  const { bundle } = execution();
  const collisions = [bundle.collisions[0], structuredClone(bundle.collisions[0])];
  assert.throws(
    () => mapCollisionLensResultContracts({ collisions, lensResults: bundle.lens_results }),
    /duplicate_collision_id/
  );
});

test('emits exactly one started event and one terminal event with stable hashes', () => {
  const { bundle } = execution();
  const first = buildProjectionRunEventContracts({ bundle, runStatus: 'unresolved' });
  const second = buildProjectionRunEventContracts({ bundle, runStatus: 'unresolved' });
  assert.deepEqual(second, first);
  assert.deepEqual(first.map((event) => event.event_type), ['started', 'unresolved']);
  assert.deepEqual(first.map((event) => event.event_order), [1, 2]);
  assert.ok(first.every((event) => /^[0-9a-f]{64}$/.test(event.event_hash)));
});

test('rejects non-terminal run status', () => {
  const { bundle } = execution();
  assert.throws(
    () => buildProjectionRunEventContracts({ bundle, runStatus: 'started' }),
    /invalid_terminal_run_status:started/
  );
});

test('failed terminal event permits a null output hash', () => {
  const { bundle } = execution();
  const failedBundle = { ...bundle, projection_bundle_hash: null };
  const events = buildProjectionRunEventContracts({ bundle: failedBundle, runStatus: 'failed' });
  assert.equal(events[1].event_type, 'failed');
  assert.equal(events[1].event_payload.output_hash, null);
  assert.match(events[1].event_hash, /^[0-9a-f]{64}$/);
});

test('completed and unresolved events require an output hash', () => {
  const { bundle } = execution();
  const noOutput = { ...bundle, projection_bundle_hash: null };
  assert.throws(
    () => buildProjectionRunEventContracts({ bundle: noOutput, runStatus: 'completed' }),
    /terminal_output_hash_required:completed/
  );
  assert.throws(
    () => buildProjectionRunEventContracts({ bundle: noOutput, runStatus: 'unresolved' }),
    /terminal_output_hash_required:unresolved/
  );
});
