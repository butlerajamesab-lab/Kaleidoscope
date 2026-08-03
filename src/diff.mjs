import { canonicalize, canonicalValue } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';

const DECLARED_TRANSITIONS = new Set(['modified', 'superseded', 'preempted', 'unresolved']);

function indexComponents(snapshot, label) {
  if (!snapshot || !Array.isArray(snapshot.components)) {
    throw new TypeError(`${label}.components must be an array`);
  }
  const map = new Map();
  for (const component of snapshot.components) {
    if (!component || typeof component.component_id !== 'string' || component.component_id.length === 0) {
      throw new TypeError(`${label} contains a component without component_id`);
    }
    if (map.has(component.component_id)) {
      throw new TypeError(`${label} contains duplicate component_id ${component.component_id}`);
    }
    map.set(component.component_id, component);
  }
  return map;
}

function operationForChangedComponent(after) {
  if (after.declared_transition !== undefined && after.declared_transition !== null) {
    if (!DECLARED_TRANSITIONS.has(after.declared_transition)) {
      throw new TypeError(`Unsupported declared_transition ${after.declared_transition}`);
    }
    return after.declared_transition;
  }
  if ((after.unresolved_conditions?.length ?? 0) > 0) return 'unresolved';
  return 'modified';
}

export function diffSnapshots(baseline, changed) {
  const before = indexComponents(baseline, 'baseline');
  const after = indexComponents(changed, 'changed');
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort();
  const operations = [];

  for (const componentId of ids) {
    const left = before.get(componentId);
    const right = after.get(componentId);
    if (!left) {
      operations.push({ operation: 'added', component_id: componentId, before: null, after: canonicalValue(right) });
      continue;
    }
    if (!right) {
      operations.push({ operation: 'removed', component_id: componentId, before: canonicalValue(left), after: null });
      continue;
    }
    if (canonicalize(left) === canonicalize(right)) {
      operations.push({ operation: 'preserved', component_id: componentId, before: canonicalValue(left), after: canonicalValue(right) });
      continue;
    }
    operations.push({
      operation: operationForChangedComponent(right),
      component_id: componentId,
      before: canonicalValue(left),
      after: canonicalValue(right)
    });
  }

  const result = {
    diff_version: '1.0.0',
    baseline_snapshot_id: baseline.state_snapshot_id,
    changed_snapshot_id: changed.state_snapshot_id,
    operations
  };

  return {
    ...result,
    input_hash: sha256Hex({ baseline, changed }),
    output_hash: sha256Hex(result)
  };
}
