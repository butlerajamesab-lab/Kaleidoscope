import { sha256Hex } from './hash.mjs';

export const PROJECTION_PERSISTENCE_CONTRACT_VERSION = '1.0.0';

function fail(code, detail = '') {
  throw new Error(`projection_persistence_contract:${code}${detail ? `:${detail}` : ''}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object_required', label);
  return value;
}

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('text_required', label);
  return value;
}

function effectOwners(lensResults) {
  if (!Array.isArray(lensResults)) fail('array_required', 'lens_results');
  const owners = new Map();
  for (const resultValue of lensResults) {
    const result = record(resultValue, 'lens_result');
    const lensId = text(result.lens_id, 'lens_result.lens_id');
    if (!Array.isArray(result.effects)) fail('array_required', `${lensId}.effects`);
    for (const effectValue of result.effects) {
      const effect = record(effectValue, `${lensId}.effect`);
      const effectId = text(effect.effect_id, `${lensId}.effect_id`);
      if (owners.has(effectId)) fail('duplicate_effect_id', effectId);
      owners.set(effectId, lensId);
    }
  }
  return owners;
}

export function mapCollisionLensResultContracts({ collisions, lensResults }) {
  if (!Array.isArray(collisions)) fail('array_required', 'collisions');
  const owners = effectOwners(lensResults);
  const links = [];
  for (const collisionValue of collisions) {
    const collision = record(collisionValue, 'collision');
    const collisionId = text(collision.collision_id, 'collision.collision_id');
    const leftEffectId = text(collision.left_effect_id, `${collisionId}.left_effect_id`);
    const rightEffectId = text(collision.right_effect_id, `${collisionId}.right_effect_id`);
    const leftLensId = owners.get(leftEffectId);
    const rightLensId = owners.get(rightEffectId);
    if (!leftLensId) fail('collision_effect_owner_missing', `${collisionId}:${leftEffectId}`);
    if (!rightLensId) fail('collision_effect_owner_missing', `${collisionId}:${rightEffectId}`);
    const lensIds = [...new Set([leftLensId, rightLensId])].sort();
    for (const lensId of lensIds) {
      links.push({
        collision_external_id: collisionId,
        lens_id: lensId,
        mapping_basis: 'referenced_effect_emitted_by_lens'
      });
    }
  }
  links.sort((a, b) =>
    a.collision_external_id.localeCompare(b.collision_external_id)
    || a.lens_id.localeCompare(b.lens_id));
  return links;
}

export function buildProjectionRunEventContracts({ bundle, runStatus }) {
  const projection = record(bundle, 'bundle');
  const terminalEvent = text(runStatus, 'run_status');
  if (!['completed', 'failed', 'unresolved'].includes(terminalEvent)) {
    fail('invalid_terminal_run_status', terminalEvent);
  }
  const common = {
    contract_version: PROJECTION_PERSISTENCE_CONTRACT_VERSION,
    external_scenario_id: text(projection.scenario_id, 'bundle.scenario_id'),
    engine_id: text(projection.engine_id, 'bundle.engine_id'),
    engine_version: text(projection.engine_version, 'bundle.engine_version'),
    input_hash: text(projection.input_hash, 'bundle.input_hash')
  };
  const startedPayload = { ...common, transition: 'pending_to_started' };
  const terminalPayload = {
    ...common,
    transition: `started_to_${terminalEvent}`,
    output_hash: text(projection.projection_bundle_hash, 'bundle.projection_bundle_hash'),
    unresolved_conditions: [...new Set(projection.unresolved_conditions ?? [])].sort()
  };
  return [
    { event_order: 1, event_type: 'started', event_payload: startedPayload, event_hash: sha256Hex(startedPayload) },
    { event_order: 2, event_type: terminalEvent, event_payload: terminalPayload, event_hash: sha256Hex(terminalPayload) }
  ];
}
