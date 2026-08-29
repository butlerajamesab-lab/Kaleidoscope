import { sha256Hex } from './hash.mjs';

export const CANONICAL_PERSISTENCE_GATE_VERSION = '1.0.0';

function fail(code, detail = '') {
  throw new Error(`canonical_persistence_gate:${code}${detail ? `:${detail}` : ''}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object_required', label);
  return value;
}

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('text_required', label);
  return value;
}

function hash(value, label) {
  const observed = text(value, label);
  if (!/^[0-9a-f]{64}$/.test(observed)) fail('sha256_required', label);
  return observed;
}

function instant(value, label) {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) fail(`invalid_${label}`);
    return value;
  }
  const observed = text(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(observed)) {
    fail(`timezone_required_${label}`);
  }
  const parsed = new Date(observed);
  if (!Number.isFinite(parsed.getTime())) fail(`invalid_${label}`);
  return parsed;
}

function verifyPlanIntegrity(plan) {
  const claimedHash = hash(plan.persistence_plan_hash, 'plan.persistence_plan_hash');
  const { persistence_plan_hash: _ignored, ...basis } = plan;
  if (sha256Hex(basis) !== claimedHash) fail('plan_hash_mismatch');
  if (!Array.isArray(plan.blockers)) fail('array_required', 'plan.blockers');
  if (plan.blocker_count !== plan.blockers.length) fail('blocker_count_mismatch');
  return claimedHash;
}

/**
 * Evaluates, but never grants, canonical-write authority.
 *
 * An authorization record is evidence supplied by a separate governed process.
 * This gate only verifies that the evidence targets the exact deterministic plan
 * and that the plan itself declares no unresolved blockers.
 */
export function evaluateCanonicalPersistenceGate({ plan, authorization = null, now = new Date() }) {
  const governedPlan = record(plan, 'plan');
  const planHash = verifyPlanIntegrity(governedPlan);
  const reasons = new Set(governedPlan.blockers.map((entry) => text(entry, 'plan.blocker')));

  if (governedPlan.projection_claim_state !== 'canonical_fact') {
    reasons.add('projection_claim_state_not_canonical_fact');
  }
  if (governedPlan.live_write_authorized !== true) {
    reasons.add('plan_does_not_authorize_live_write');
  }

  let authorizationId = null;
  if (authorization === null) {
    reasons.add('governed_authorization_missing');
  } else {
    const authority = record(authorization, 'authorization');
    authorizationId = text(authority.authorization_id, 'authorization.authorization_id');
    if (authority.decision !== 'canonical_persistence_authorized') {
      reasons.add('authorization_decision_not_approved');
    }
    if (hash(authority.persistence_plan_hash, 'authorization.persistence_plan_hash') !== planHash) {
      reasons.add('authorization_plan_hash_mismatch');
    }
    const expiresAt = instant(authority.expires_at, 'expiry');
    const observedNow = instant(now, 'now');
    if (expiresAt.getTime() <= observedNow.getTime()) reasons.add('authorization_expired');
  }

  const blockerReasons = [...reasons].sort();
  const basis = {
    gate_version: CANONICAL_PERSISTENCE_GATE_VERSION,
    persistence_plan_hash: planHash,
    authorization_id: authorizationId,
    state: blockerReasons.length === 0 ? 'authorized' : 'blocked',
    write_authorized: blockerReasons.length === 0,
    blocker_reasons: blockerReasons
  };
  return { ...basis, gate_receipt_hash: sha256Hex(basis) };
}

export async function executeCanonicalPersistencePlan({ plan, authorization, transport, now = new Date() }) {
  const gate = evaluateCanonicalPersistenceGate({ plan, authorization, now });
  if (!gate.write_authorized) fail('write_blocked', gate.gate_receipt_hash);
  if (typeof transport !== 'function') fail('transport_required');
  return transport({ plan, authorization, gate });
}
