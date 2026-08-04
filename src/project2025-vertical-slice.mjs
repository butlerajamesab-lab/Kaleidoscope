import { canonicalValue } from './canonical-json.mjs';
import { diffSnapshots } from './diff.mjs';
import { sha256Hex } from './hash.mjs';

export const PROJECT2025_VERTICAL_SLICE_ENGINE_ID = 'project2025_vertical_slice_engine';
export const PROJECT2025_VERTICAL_SLICE_ENGINE_VERSION = '1.0.0';

const UPSTREAM_STATES = new Set([
  'not_applicable',
  'not_run',
  'manual_action_available',
  'running',
  'completed',
  'failed',
  'rejected',
  'superseded',
  'not_observed',
  'available_unbound'
]);

const IMPLEMENTATION_MATCH_STATES = new Set([
  'exact_structural_match',
  'partial_structural_match',
  'related_policy_direction',
  'superficial_language_similarity',
  'no_verified_match'
]);

const IMPLEMENTATION_STATES = new Set([
  'proposed',
  'pending',
  'partially_implemented',
  'operative',
  'contested',
  'not_implemented_as_proposed',
  'unresolved',
  'partially_implemented_or_contested',
  'operative_with_open_primary_source_items'
]);

const VERIFICATION_RANK = new Map([
  ['unresolved', 0],
  ['primary_source_not_obtained', 1],
  ['quoted_in_verified_secondary', 2],
  ['secondary_verified', 3],
  ['secondary_verified_high_confidence', 4],
  ['primary_verified', 5]
]);

function fail(code, detail = '') {
  throw new Error(`invalid_project2025_vertical_slice:${code}${detail ? `:${detail}` : ''}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object_required', label);
  return value;
}

function string(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('string_required', label);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) fail('array_required', label);
  return value;
}

function uniqueStrings(value, label) {
  const rows = array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
  if (new Set(rows).size !== rows.length) fail('unique_values_required', label);
  return rows;
}

function validateVerificationState(value, label) {
  const state = string(value, label);
  if (!VERIFICATION_RANK.has(state)) fail('verification_state_invalid', state);
  return state;
}

function aggregateVerificationStates(states) {
  const unique = [...new Set(states)].sort();
  if (unique.length === 0) return 'unresolved';
  if (unique.length > 1) return 'mixed';
  return unique[0];
}

function weakestVerificationState(states) {
  if (states.length === 0) return 'unresolved';
  return [...states].sort((a, b) => VERIFICATION_RANK.get(a) - VERIFICATION_RANK.get(b))[0];
}

function validateSourceBindings(component, sourceArtifactIds) {
  const bindings = array(component.source_bindings, `${component.component_id}.source_bindings`);
  if (bindings.length === 0) fail('source_binding_required', component.component_id);
  const states = [];
  for (const binding of bindings) {
    const row = record(binding, 'source_binding');
    const artifactId = string(row.source_artifact_id, 'source_binding.source_artifact_id');
    if (!sourceArtifactIds.has(artifactId)) fail('unknown_source_artifact', artifactId);
    states.push(validateVerificationState(row.verification_state, 'source_binding.verification_state'));
    string(row.support_statement, 'source_binding.support_statement');
  }
  const declared = validateVerificationState(component.declared_verification_state, `${component.component_id}.declared_verification_state`);
  const ceiling = weakestVerificationState(states);
  if (VERIFICATION_RANK.get(declared) > VERIFICATION_RANK.get(ceiling)) {
    fail('component_verification_exceeds_source_ceiling', component.component_id);
  }
  return { aggregate: aggregateVerificationStates(states), ceiling };
}

function validateMechanism(mechanism, sourceArtifactIds) {
  const row = record(mechanism, 'mechanism');
  string(row.mechanism_id, 'mechanism_id');
  if (!IMPLEMENTATION_MATCH_STATES.has(row.implementation_match)) {
    fail('implementation_match_invalid', row.mechanism_id);
  }
  if (!IMPLEMENTATION_STATES.has(row.implementation_state)) {
    fail('implementation_state_invalid', row.mechanism_id);
  }
  const model = record(row.model, `${row.mechanism_id}.model`);
  for (const key of ['proposal', 'claimed_authority', 'baseline', 'required_instrument']) {
    string(model[key], `${row.mechanism_id}.model.${key}`);
  }
  for (const key of [
    'implementation_chain',
    'observed_evidence',
    'jurisdictional_variation',
    'response_pathways',
    'timing_dependencies',
    'unresolved_questions'
  ]) {
    array(model[key], `${row.mechanism_id}.model.${key}`);
  }
  uniqueStrings(row.implementation_route_types, `${row.mechanism_id}.implementation_route_types`);
  for (const binding of array(row.source_bindings, `${row.mechanism_id}.source_bindings`)) {
    const artifactId = string(binding.source_artifact_id, 'mechanism.source_artifact_id');
    if (!sourceArtifactIds.has(artifactId)) fail('unknown_source_artifact', artifactId);
    validateVerificationState(binding.verification_state, 'mechanism.source_binding.verification_state');
  }
  return row;
}

function validateRelationship(relationship, mechanismIds) {
  const row = record(relationship, 'relationship');
  if (!mechanismIds.has(row.source_id) || !mechanismIds.has(row.target_id)) {
    fail('relationship_unknown_mechanism');
  }
  if (row.relationship_type === 'produces_similar_effect' && row.causal_claim_state !== 'not_asserted') {
    fail('similar_effect_must_not_assert_causation');
  }
  if (row.relationship_type === 'member_of_mechanism_family' && row.causal_claim_state !== 'not_asserted') {
    fail('family_membership_must_not_assert_causation');
  }
  string(row.evidence_note, 'relationship.evidence_note');
  return row;
}

function validateUpstreamProcessing(upstreamProcessing) {
  const row = record(upstreamProcessing, 'upstream_processing');
  for (const [platform, stateRecord] of Object.entries(row)) {
    const stateRow = record(stateRecord, `upstream_processing.${platform}`);
    const state = string(stateRow.state, `upstream_processing.${platform}.state`);
    if (!UPSTREAM_STATES.has(state)) fail('upstream_state_invalid', `${platform}:${state}`);
    if (typeof stateRow.required !== 'boolean') fail('upstream_required_boolean', platform);
    if (stateRow.required && !['completed', 'available_unbound'].includes(state)) {
      fail('required_upstream_not_ready', `${platform}:${state}`);
    }
  }
  return row;
}

function validateSnapshot(snapshot, sourceArtifactIds, label) {
  const row = record(snapshot, label);
  string(row.state_snapshot_id, `${label}.state_snapshot_id`);
  const componentIds = new Set();
  for (const component of array(row.components, `${label}.components`)) {
    const item = record(component, `${label}.component`);
    const componentId = string(item.component_id, 'component_id');
    if (componentIds.has(componentId)) fail('duplicate_component_id', componentId);
    componentIds.add(componentId);
    string(item.component_type, `${componentId}.component_type`);
    string(item.dimension, `${componentId}.dimension`);
    string(item.jurisdiction, `${componentId}.jurisdiction`);
    uniqueStrings(item.affected_population_ids, `${componentId}.affected_population_ids`);
    uniqueStrings(item.unresolved_conditions, `${componentId}.unresolved_conditions`);
    validateSourceBindings(item, sourceArtifactIds);
  }
  return row;
}

function validateLensManifest(manifest) {
  const row = record(manifest, 'lens_manifest');
  string(row.lens_id, 'lens_id');
  if (row.lens_version !== '1.0.0') fail('lens_version_mismatch', row.lens_id);
  string(row.purpose, `${row.lens_id}.purpose`);
  if (row.no_mutation !== true) fail('lens_no_mutation_required', row.lens_id);
  const ruleIds = new Set();
  for (const rule of array(row.rules, `${row.lens_id}.rules`)) {
    const item = record(rule, 'lens_rule');
    const ruleId = string(item.rule_id, 'lens_rule.rule_id');
    if (ruleIds.has(ruleId)) fail('duplicate_lens_rule_id', ruleId);
    ruleIds.add(ruleId);
    uniqueStrings(item.when.operations, `${ruleId}.when.operations`);
    uniqueStrings(item.when.dimensions, `${ruleId}.when.dimensions`);
    if (item.when.component_types) uniqueStrings(item.when.component_types, `${ruleId}.when.component_types`);
    if (item.when.jurisdictions) uniqueStrings(item.when.jurisdictions, `${ruleId}.when.jurisdictions`);
    string(item.emit.effect_type, `${ruleId}.emit.effect_type`);
    string(item.emit.direction, `${ruleId}.emit.direction`);
    string(item.emit.statement, `${ruleId}.emit.statement`);
  }
  return row;
}

function operationComponent(operation) {
  return operation.after ?? operation.before;
}

function matchesRule(operation, rule) {
  const component = operationComponent(operation);
  if (!rule.when.operations.includes(operation.operation)) return false;
  if (!rule.when.dimensions.includes(component.dimension)) return false;
  if (rule.when.component_types && !rule.when.component_types.includes(component.component_type)) return false;
  if (rule.when.jurisdictions && !rule.when.jurisdictions.includes(component.jurisdiction)) return false;
  return true;
}

function executeLens(manifest, diff) {
  const effects = [];
  for (const rule of manifest.rules) {
    for (const operation of diff.operations) {
      if (!matchesRule(operation, rule)) continue;
      const component = operationComponent(operation);
      const bindingStates = component.source_bindings.map((binding) => binding.verification_state);
      const evidenceCeiling = weakestVerificationState(bindingStates);
      const effectBasis = {
        effect_id: `${manifest.lens_id}:${rule.rule_id}:${operation.component_id}`,
        lens_id: manifest.lens_id,
        lens_version: manifest.lens_version,
        rule_id: rule.rule_id,
        effect_type: rule.emit.effect_type,
        direction: rule.emit.direction,
        statement: rule.emit.statement,
        operation: operation.operation,
        component_id: operation.component_id,
        jurisdiction: component.jurisdiction,
        affected_population_ids: [...component.affected_population_ids].sort(),
        source_artifact_ids: [...new Set(component.source_bindings.map((binding) => binding.source_artifact_id))].sort(),
        verification_state: aggregateVerificationStates(bindingStates),
        evidence_ceiling: evidenceCeiling,
        unresolved_conditions: [...new Set([
          ...component.unresolved_conditions,
          ...(rule.emit.unresolved_conditions ?? [])
        ])].sort(),
        no_mutation: true
      };
      effects.push({ ...effectBasis, effect_hash: sha256Hex(effectBasis) });
    }
  }
  effects.sort((a, b) => a.effect_id.localeCompare(b.effect_id));
  const basis = {
    lens_id: manifest.lens_id,
    lens_version: manifest.lens_version,
    lens_manifest_hash: sha256Hex(manifest),
    effect_count: effects.length,
    effects,
    no_mutation: true
  };
  return { ...basis, lens_result_hash: sha256Hex(basis) };
}

function buildCollisions(collisionRules, lensResults) {
  const effects = lensResults.flatMap((result) => result.effects);
  const collisions = [];
  for (const rule of collisionRules) {
    const left = effects.find((effect) => effect.effect_type === rule.left_effect_type);
    const right = effects.find((effect) => effect.effect_type === rule.right_effect_type);
    if (!left || !right) continue;
    const basis = {
      collision_id: rule.collision_id,
      collision_type: rule.collision_type,
      left_effect_id: left.effect_id,
      right_effect_id: right.effect_id,
      statement: rule.statement,
      resolution_state: 'preserved_not_averaged',
      unresolved_conditions: [...new Set([
        ...(rule.unresolved_conditions ?? []),
        ...left.unresolved_conditions,
        ...right.unresolved_conditions
      ])].sort()
    };
    collisions.push({ ...basis, collision_hash: sha256Hex(basis) });
  }
  return collisions.sort((a, b) => a.collision_id.localeCompare(b.collision_id));
}

function buildReadModel(bundle, mechanisms) {
  const operationCounts = {};
  for (const operation of bundle.diff.operations) {
    operationCounts[operation.operation] = (operationCounts[operation.operation] ?? 0) + 1;
  }
  const lensPanels = bundle.lens_results.map((result) => ({
    lens_id: result.lens_id,
    effect_count: result.effect_count,
    effects: result.effects.map((effect) => ({
      effect_id: effect.effect_id,
      effect_type: effect.effect_type,
      direction: effect.direction,
      statement: effect.statement,
      jurisdiction: effect.jurisdiction,
      verification_state: effect.verification_state,
      evidence_ceiling: effect.evidence_ceiling,
      unresolved_conditions: effect.unresolved_conditions
    }))
  }));
  const readModelBasis = {
    read_model_version: '1.0.0',
    scenario_id: bundle.scenario_id,
    policy_family_id: bundle.policy_family_id,
    title: 'Project 2025: Title VII and State-Law Response',
    subtitle: 'Deterministic bounded vertical-slice demonstration',
    status: 'executed_test_fixture_not_canonical_fact',
    summary: {
      mechanism_count: mechanisms.length,
      operation_count: bundle.diff.operations.length,
      operation_counts: operationCounts,
      lens_count: bundle.lens_results.length,
      collision_count: bundle.collisions.length,
      unresolved_count: bundle.unresolved_conditions.length
    },
    mechanism_paths: mechanisms.map((mechanism) => ({
      mechanism_id: mechanism.mechanism_id,
      implementation_match: mechanism.implementation_match,
      implementation_state: mechanism.implementation_state,
      implementation_route_types: mechanism.implementation_route_types,
      implementation_chain: mechanism.model.implementation_chain
    })),
    lens_panels: lensPanels,
    collisions: bundle.collisions,
    source_artifact_ids: bundle.source_artifact_ids,
    assumptions: bundle.assumptions,
    excluded_factors: bundle.excluded_factors,
    unresolved_conditions: bundle.unresolved_conditions,
    inspection: {
      input_hash: bundle.input_hash,
      diff_hash: bundle.diff.output_hash,
      projection_bundle_hash: bundle.projection_bundle_hash,
      no_mutation: true
    }
  };
  return { ...readModelBasis, read_model_hash: sha256Hex(readModelBasis) };
}

export function executeProject2025VerticalSlice(fixture, lensManifests) {
  const source = canonicalValue(record(fixture, 'fixture'));
  if (source.fixture_version !== '1.0.0') fail('fixture_version_mismatch');
  if (source.fixture_state !== 'bounded_source_pack_test') fail('fixture_state_mismatch');
  string(source.scenario_id, 'scenario_id');
  string(source.policy_family_id, 'policy_family_id');
  const sourceArtifactIds = new Set(uniqueStrings(source.source_artifact_ids, 'source_artifact_ids'));
  validateUpstreamProcessing(source.upstream_processing);

  const mechanisms = array(source.mechanisms, 'mechanisms').map((mechanism) => validateMechanism(mechanism, sourceArtifactIds));
  const mechanismIds = new Set(mechanisms.map((mechanism) => mechanism.mechanism_id));
  for (const relationship of array(source.relationships, 'relationships')) validateRelationship(relationship, mechanismIds);

  validateSnapshot(source.baseline, sourceArtifactIds, 'baseline');
  validateSnapshot(source.changed, sourceArtifactIds, 'changed');
  const diff = diffSnapshots(source.baseline, source.changed);

  const manifests = array(lensManifests, 'lens_manifests').map(validateLensManifest);
  const expectedLensIds = uniqueStrings(source.lens_ids, 'lens_ids').sort();
  const observedLensIds = manifests.map((manifest) => manifest.lens_id).sort();
  if (JSON.stringify(expectedLensIds) !== JSON.stringify(observedLensIds)) fail('lens_set_mismatch');
  const lensResults = manifests
    .sort((a, b) => a.lens_id.localeCompare(b.lens_id))
    .map((manifest) => executeLens(manifest, diff));

  const collisions = buildCollisions(array(source.collision_rules, 'collision_rules'), lensResults);
  const unresolvedConditions = [...new Set([
    ...uniqueStrings(source.unresolved_conditions, 'unresolved_conditions'),
    ...lensResults.flatMap((result) => result.effects.flatMap((effect) => effect.unresolved_conditions)),
    ...collisions.flatMap((collision) => collision.unresolved_conditions)
  ])].sort();

  const inputHash = sha256Hex({ fixture: source, lens_manifests: manifests });
  const bundleBasis = {
    projection_bundle_version: '1.0.0',
    engine_id: PROJECT2025_VERTICAL_SLICE_ENGINE_ID,
    engine_version: PROJECT2025_VERTICAL_SLICE_ENGINE_VERSION,
    scenario_id: source.scenario_id,
    policy_family_id: source.policy_family_id,
    projection_kind: 'deterministic_bounded_test',
    projection_claim_state: 'not_prediction_not_canonical_fact',
    source_artifact_ids: [...sourceArtifactIds].sort(),
    mechanism_ids: [...mechanismIds].sort(),
    relationships: source.relationships,
    upstream_processing: source.upstream_processing,
    input_hash: inputHash,
    diff,
    lens_results: lensResults,
    collisions,
    assumptions: source.assumptions,
    excluded_factors: source.excluded_factors,
    unresolved_conditions: unresolvedConditions,
    no_mutation: true,
    database_write_count: 0
  };
  const bundle = { ...bundleBasis, projection_bundle_hash: sha256Hex(bundleBasis) };
  const readModel = buildReadModel(bundle, mechanisms);
  const receiptBasis = {
    receipt_version: '1.0.0',
    engine_id: PROJECT2025_VERTICAL_SLICE_ENGINE_ID,
    engine_version: PROJECT2025_VERTICAL_SLICE_ENGINE_VERSION,
    scenario_id: source.scenario_id,
    input_hash: inputHash,
    diff_hash: diff.output_hash,
    projection_bundle_hash: bundle.projection_bundle_hash,
    read_model_hash: readModel.read_model_hash,
    no_mutation: true,
    database_write_count: 0
  };
  const receiptHash = sha256Hex(receiptBasis);
  const receipt = {
    ...receiptBasis,
    run_id: `p25-run-${receiptHash.slice(0, 32)}`,
    deterministic_replay_key: sha256Hex({ input_hash: inputHash, engine_version: PROJECT2025_VERTICAL_SLICE_ENGINE_VERSION }),
    receipt_hash: receiptHash
  };
  return { bundle, read_model: readModel, receipt };
}
