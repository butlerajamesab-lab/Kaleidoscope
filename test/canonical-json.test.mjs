import assert from 'node:assert/strict';
import test from 'node:test';

import { canonicalize, canonicalValue } from '../src/canonical-json.mjs';
import { sha256Hex } from '../src/hash.mjs';

test('canonical JSON preserves an own __proto__ key without prototype mutation', () => {
  const input = JSON.parse('{"z":2,"__proto__":{"polluted":true},"a":1}');

  assert.equal(
    canonicalize(input),
    '{"__proto__":{"polluted":true},"a":1,"z":2}'
  );

  const normalized = canonicalValue(input);
  assert.equal(Object.hasOwn(normalized, '__proto__'), true);
  assert.deepEqual(normalized.__proto__, { polluted: true });
  assert.equal({}.polluted, undefined);
});

test('an own __proto__ key contributes to the canonical hash', () => {
  const withProtoKey = JSON.parse('{"a":1,"__proto__":{"polluted":true}}');

  assert.notEqual(sha256Hex(withProtoKey), sha256Hex({ a: 1 }));
});
