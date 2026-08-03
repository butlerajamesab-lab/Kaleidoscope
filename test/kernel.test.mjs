import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalize } from '../src/canonical-json.mjs';
import { sha256Hex } from '../src/hash.mjs';
import { diffSnapshots } from '../src/diff.mjs';

test('canonicalization and hashing ignore object insertion order', () => {
  const a = { z: 2, a: { y: 1, x: 0 } };
  const b = { a: { x: 0, y: 1 }, z: 2 };
  assert.equal(canonicalize(a), canonicalize(b));
  assert.equal(sha256Hex(a), sha256Hex(b));
});

test('canonicalization rejects unsupported state', () => {
  assert.throws(() => canonicalize({ a: undefined }), /Undefined value/);
  assert.throws(() => canonicalize({ a: Number.NaN }), /Non-finite number/);
});

const baseline = {
  state_snapshot_id: 's0',
  components: [
    { component_id: 'a', component_type: 'rule', value: 1, verification_state: 'primary_verified', source_artifact_ids: ['x'] },
    { component_id: 'b', component_type: 'rule', value: 2, verification_state: 'primary_verified', source_artifact_ids: ['x'] },
    { component_id: 'c', component_type: 'rule', value: 3, verification_state: 'primary_verified', source_artifact_ids: ['x'] },
    { component_id: 'e', component_type: 'rule', value: 5, verification_state: 'primary_verified', source_artifact_ids: ['x'] }
  ]
};

const changed = {
  state_snapshot_id: 's1',
  components: [
    { component_id: 'a', component_type: 'rule', value: 1, verification_state: 'primary_verified', source_artifact_ids: ['x'] },
    { component_id: 'b', component_type: 'rule', value: 4, verification_state: 'primary_verified', source_artifact_ids: ['y'] },
    { component_id: 'd', component_type: 'rule', value: 9, verification_state: 'secondary_verified', source_artifact_ids: ['z'] },
    { component_id: 'e', component_type: 'rule', value: 5, verification_state: 'primary_verified', source_artifact_ids: ['x'], declared_transition: 'preempted' }
  ]
};

test('typed diff emits stable ordered operations and hashes', () => {
  const first = diffSnapshots(baseline, changed);
  const second = diffSnapshots(baseline, changed);
  assert.deepEqual(first, second);
  assert.deepEqual(first.operations.map((row) => [row.component_id, row.operation]), [
    ['a', 'preserved'], ['b', 'modified'], ['c', 'removed'], ['d', 'added'], ['e', 'preempted']
  ]);
  assert.match(first.input_hash, /^[0-9a-f]{64}$/);
  assert.match(first.output_hash, /^[0-9a-f]{64}$/);
});

test('duplicate component identifiers are rejected', () => {
  assert.throws(() => diffSnapshots({ state_snapshot_id: 'bad', components: [baseline.components[0], baseline.components[0]] }, changed), /duplicate component_id/);
});
