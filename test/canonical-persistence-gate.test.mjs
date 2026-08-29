import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../fixtures/project2025-title-vii-vertical-slice.v1.mjs';
import sourceManifest from '../source_manifests/source_pack_2026_08_03_v3.json' with { type: 'json' };
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import civilRights from '../lenses/civil_rights.v1.json' with { type: 'json' };
import enforcementPathways from '../lenses/enforcement_pathways.v1.json' with { type: 'json' };
import localGovernmentPreemption from '../lenses/local_government_preemption.v1.json' with { type: 'json' };
import { sha256Hex } from '../src/hash.mjs';
import { buildDeterministicPersistencePlan } from '../src/persistence-plan.mjs';
import {
  evaluateCanonicalPersistenceGate,
  executeCanonicalPersistencePlan
} from '../src/canonical-persistence-gate.mjs';

const lensManifests = [
  affectedPopulations,
  civilRights,
  enforcementPathways,
  localGovernmentPreemption
];

function currentPlan() {
  return buildDeterministicPersistencePlan({ fixture, lensManifests, sourceManifest });
}

function authorization(plan, overrides = {}) {
  return {
    authorization_id: 'governed-review-2026-08-29-001',
    decision: 'canonical_persistence_authorized',
    persistence_plan_hash: plan.persistence_plan_hash,
    expires_at: '2026-08-30T00:00:00.000Z',
    ...overrides
  };
}

function rehash(plan) {
  const { persistence_plan_hash: _ignored, ...basis } = plan;
  return { ...basis, persistence_plan_hash: sha256Hex(basis) };
}

test('current deterministic specimen remains fail-closed even with matching review evidence', () => {
  const plan = currentPlan();
  const gate = evaluateCanonicalPersistenceGate({
    plan,
    authorization: authorization(plan),
    now: new Date('2026-08-29T00:00:00.000Z')
  });
  assert.equal(gate.state, 'blocked');
  assert.equal(gate.write_authorized, false);
  assert.ok(gate.blocker_reasons.includes('projection_claim_state_not_canonical_fact'));
  assert.ok(gate.blocker_reasons.includes('plan_does_not_authorize_live_write'));
  assert.ok(gate.blocker_reasons.includes('runtime_database_transport_not_bound'));
  assert.equal(gate.blocker_reasons.includes('collision_lens_result_foreign_key_mapping_not_declared'), false);
  assert.equal(gate.blocker_reasons.includes('projection_run_event_emission_contract_not_declared'), false);
});

test('missing authorization blocks an otherwise structurally ready plan', () => {
  const source = currentPlan();
  const plan = rehash({
    ...source,
    blockers: [],
    blocker_count: 0,
    projection_claim_state: 'canonical_fact',
    live_write_authorized: true
  });
  const gate = evaluateCanonicalPersistenceGate({ plan, now: new Date('2026-08-29T00:00:00.000Z') });
  assert.deepEqual(gate.blocker_reasons, ['governed_authorization_missing']);
});

test('authorization is bound to the exact plan hash and expiry', () => {
  const source = currentPlan();
  const plan = rehash({
    ...source,
    blockers: [],
    blocker_count: 0,
    projection_claim_state: 'canonical_fact',
    live_write_authorized: true
  });
  const gate = evaluateCanonicalPersistenceGate({
    plan,
    authorization: authorization(plan, {
      persistence_plan_hash: 'f'.repeat(64),
      expires_at: '2026-08-28T00:00:00.000Z'
    }),
    now: new Date('2026-08-29T00:00:00.000Z')
  });
  assert.deepEqual(gate.blocker_reasons, [
    'authorization_expired',
    'authorization_plan_hash_mismatch'
  ]);
});

test('rejects authorization timestamps without an explicit timezone', () => {
  const plan = currentPlan();
  assert.throws(
    () => evaluateCanonicalPersistenceGate({
      plan,
      authorization: authorization(plan, { expires_at: '2026-08-30T00:00:00' }),
      now: new Date('2026-08-29T00:00:00.000Z')
    }),
    /timezone_required_expiry/
  );
  assert.throws(
    () => evaluateCanonicalPersistenceGate({
      plan,
      authorization: authorization(plan),
      now: '2026-08-29T00:00:00'
    }),
    /timezone_required_now/
  );
});

test('blocked execution never invokes the database transport', async () => {
  const plan = currentPlan();
  let calls = 0;
  await assert.rejects(
    executeCanonicalPersistencePlan({
      plan,
      authorization: authorization(plan),
      now: new Date('2026-08-29T00:00:00.000Z'),
      transport: async () => { calls += 1; }
    }),
    /canonical_persistence_gate:write_blocked/
  );
  assert.equal(calls, 0);
});

test('ready authorized plan invokes transport once with a deterministic gate receipt', async () => {
  const source = currentPlan();
  const plan = rehash({
    ...source,
    blockers: [],
    blocker_count: 0,
    projection_claim_state: 'canonical_fact',
    live_write_authorized: true
  });
  let calls = 0;
  const result = await executeCanonicalPersistencePlan({
    plan,
    authorization: authorization(plan),
    now: new Date('2026-08-29T00:00:00.000Z'),
    transport: async ({ gate }) => {
      calls += 1;
      return gate;
    }
  });
  assert.equal(calls, 1);
  assert.equal(result.state, 'authorized');
  assert.equal(result.write_authorized, true);
  assert.match(result.gate_receipt_hash, /^[0-9a-f]{64}$/);
});

test('tampered plan is rejected before authorization evaluation', () => {
  const plan = currentPlan();
  plan.blockers = [];
  assert.throws(
    () => evaluateCanonicalPersistenceGate({ plan }),
    /canonical_persistence_gate:plan_hash_mismatch/
  );
});
