import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import contract from '../contracts/foundation-contracts.v1.json' with { type: 'json' };

const root = new URL('../', import.meta.url);

test('all verification state enums support the explicitly declared high-confidence secondary state', () => {
  const found = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (key === 'verification_state' && Array.isArray(value.enum)) found.push(value.enum);
      walk(value);
    }
  };
  walk(contract);
  assert.ok(found.length >= 3);
  for (const states of found) {
    assert.ok(states.includes('secondary_verified_high_confidence'));
    assert.ok(states.includes('secondary_verified'));
    assert.ok(states.includes('primary_source_not_obtained'));
  }
});

test('foundation validators reject any asserted causation and every duplicated deployment identity mismatch', async () => {
  const source = await readFile(new URL('../scripts/validate_foundation.py', import.meta.url), 'utf8');
  assert.match(source, /all_causal_claims_unasserted\(relations\)/);
  assert.match(source, /all_causal_claims_unasserted\(preemption\.get\('relationships'/);
  assert.match(source, /deployment_identity_mismatches\(receipt, runtime_receipt\)/);

  const py = `
import copy
import json
from pathlib import Path
from scripts.foundation_integrity import all_causal_claims_unasserted, deployment_identity_mismatches

root = Path('.')
load = lambda name: json.loads((root / name).read_text())
family = load('fixtures/gender_identity_title_vii_family.v1.json')
preemption = load('fixtures/local_lgbtq_ordinance_preemption_family.v1.json')
assert all_causal_claims_unasserted(family['relationships'])
assert all_causal_claims_unasserted(preemption['relationships'])
assert not all_causal_claims_unasserted([])
for relationships in (family['relationships'], preemption['relationships']):
    changed = copy.deepcopy(relationships)
    changed.append({'relationship_type': 'produces_similar_effect', 'causal_claim_state': 'documented'})
    assert not all_causal_claims_unasserted(changed)
    changed = copy.deepcopy(relationships)
    changed[0]['causal_claim_state'] = 'asserted'
    assert not all_causal_claims_unasserted(changed)

foundation = load('FOUNDATION_RECEIPT.json')
runtime = load('docs/receipts/KALEIDOSCOPE_RUNTIME_V0_1_4_2026-08-03.json')
assert deployment_identity_mismatches(foundation, runtime) == []
for path in [
    ('source_control', 'merge_commit_sha'),
    ('render', 'service_id'),
    ('render', 'service_url'),
    ('render', 'deploy_id'),
    ('render', 'deploy_finished_at'),
    ('render', 'startup_event', 'engine_version'),
    ('render', 'root_probe', 'status_code')
]:
    changed = copy.deepcopy(runtime)
    target = changed
    for segment in path[:-1]:
        target = target[segment]
    target[path[-1]] = 'inconsistent' if isinstance(target[path[-1]], str) else 404
    observed = deployment_identity_mismatches(foundation, changed)
    assert observed, path
    assert '.'.join(path) in observed, (path, observed)
`;
  const child = spawnSync('python3', ['-c', py], { cwd: root, encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr || child.stdout);
});
