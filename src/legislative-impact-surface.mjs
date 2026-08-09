import { canonicalValue } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';
import { assertLegislativeConsequenceFixture } from './legislative-consequence.mjs';

export const LEGISLATIVE_IMPACT_SURFACE_CONTRACT_ID =
  'https://luminari.org/kaleidoscope/contracts/legislative-consequence-impact-surface.v1.json';
export const LEGISLATIVE_IMPACT_SURFACE_ENGINE_ID = 'legislative_consequence_impact_surface';
export const LEGISLATIVE_IMPACT_SURFACE_ENGINE_VERSION = '1.0.0';

const EFFECT_CLASSES = new Set(['legal', 'operational', 'economic', 'administrative']);
const DISPOSITIONS = new Set(['include', 'defer']);
const PROHIBITED_NUMERIC_KEYS = new Set(['weight', 'score', 'probability', 'risk_score']);

function fail(code, detail = '') {
  throw new Error(`invalid_legislative_impact_surface:${code}${detail ? `:${detail}` : ''}`);
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

function assertNoNumericJudgment(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoNumericJudgment(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (PROHIBITED_NUMERIC_KEYS.has(key)) fail('numeric_judgment_key_prohibited', `${path}.${key}`);
    assertNoNumericJudgment(entry, `${path}.${key}`);
  }
}

export function impactItemHashBasis(item) {
  const row = record(item, 'impact_item');
  const { impact_hash: _ignored, ...basis } = row;
  return basis;
}

export function impactSurfaceHashBasis(surface) {
  const row = record(surface, 'impact_surface');
  const { impact_surface_hash: _ignored, ...basis } = row;
  return basis;
}

function validateClassificationManifest(manifest, fixture) {
  const source = canonicalValue(record(manifest, 'classification_manifest'));
  if (source.manifest_version !== '1.0.0') fail('manifest_version_mismatch');
  string(source.manifest_id, 'manifest_id');
  if (source.scenario_id !== fixture.source_bundle.scenario_id) fail('manifest_scenario_mismatch');
  if (source.source_graph_id !== fixture.consequence_graph.graph_id) fail('manifest_graph_mismatch');
  if (source.no_numeric_weights !== true) fail('manifest_numeric_weight_prohibition_missing');
  if (source.no_new_causal_claims !== true) fail('manifest_causal_prohibition_missing');
  assertNoNumericJudgment(source);

  const graphEdgeIds = new Set(fixture.consequence_graph.edges.map((edge) => edge.edge_id));
  const classifications = array(source.classifications, 'classifications');
  if (classifications.length !== graphEdgeIds.size) fail('manifest_must_classify_every_edge');
  const seen = new Set();

  for (const classification of classifications) {
    const row = record(classification, 'classification');
    const edgeId = string(row.source_edge_id, 'classification.source_edge_id');
    if (!graphEdgeIds.has(edgeId)) fail('manifest_unknown_edge', edgeId);
    if (seen.has(edgeId)) fail('manifest_duplicate_edge', edgeId);
    seen.add(edgeId);
    if (!DISPOSITIONS.has(row.disposition)) fail('manifest_disposition_invalid', edgeId);
    const classes = uniqueStrings(row.effect_classes, 'classification.effect_classes');
    for (const effectClass of classes) {
      if (!EFFECT_CLASSES.has(effectClass)) fail('manifest_effect_class_invalid', `${edgeId}:${effectClass}`);
    }
    if (row.disposition === 'include' && classes.length === 0) fail('included_edge_requires_effect_class', edgeId);
    if (row.disposition === 'defer') {
      if (classes.length !== 0) fail('deferred_edge_must_not_classify_effect', edgeId);
      string(row.defer_reason, 'classification.defer_reason');
    } else if ('defer_reason' in row) {
      fail('included_edge_must_not_have_defer_reason', edgeId);
    }
  }

  return source;
}

function actorIdsForEdge(edge, deltaById) {
  const actors = new Set();
  for (const deltaId of edge.from_delta_ids) {
    const delta = deltaById.get(deltaId);
    if (!delta) fail('edge_delta_missing_during_actor_resolution', deltaId);
    for (const actorId of delta.actor_ids) actors.add(actorId);
  }
  return [...actors].sort();
}

function buildImpactItem(edge, classification, deltaById) {
  const basis = {
    impact_id: `impact:${edge.edge_id}`,
    source_edge_id: edge.edge_id,
    from_delta_ids: [...edge.from_delta_ids].sort(),
    effect_classes: [...classification.effect_classes].sort(),
    touched_actor_ids: actorIdsForEdge(edge, deltaById),
    to_node_id: edge.to_node_id,
    relationship_type: edge.relationship_type,
    causal_state: edge.causal_state,
    evidence_ceiling: edge.evidence_ceiling,
    effect_statement: edge.explanation,
    source_bindings: canonicalValue(edge.source_bindings),
    unresolved_conditions: [...new Set(edge.unresolved_conditions)].sort(),
    no_new_causal_claim: true
  };
  return { ...basis, impact_hash: sha256Hex(basis) };
}

function buildDeferredReference(edge, classification) {
  return {
    source_edge_id: edge.edge_id,
    relationship_type: edge.relationship_type,
    defer_reason: classification.defer_reason,
    source_bindings: canonicalValue(edge.source_bindings),
    unresolved_conditions: [...new Set(edge.unresolved_conditions)].sort()
  };
}

function buildReceipt(surface, manifest) {
  const inputHash = sha256Hex({
    source_consequence_graph_hash: surface.source_consequence_graph_hash,
    source_structural_delta_bundle_hash: surface.source_structural_delta_bundle_hash,
    rule_manifest_hash: surface.rule_manifest_hash
  });
  const basis = {
    receipt_version: '1.0.0',
    engine_id: LEGISLATIVE_IMPACT_SURFACE_ENGINE_ID,
    engine_version: LEGISLATIVE_IMPACT_SURFACE_ENGINE_VERSION,
    scenario_id: surface.scenario_id,
    input_hash: inputHash,
    source_consequence_graph_hash: surface.source_consequence_graph_hash,
    rule_manifest_id: manifest.manifest_id,
    rule_manifest_hash: surface.rule_manifest_hash,
    impact_surface_hash: surface.impact_surface_hash,
    atlas_historical_comparison_executed: false,
    lighthouse_accountability_executed: false,
    checklist_instantiated: false,
    no_mutation: true,
    database_write_count: 0
  };
  const receiptHash = sha256Hex(basis);
  return {
    ...basis,
    run_id: `impact-run-${receiptHash.slice(0, 32)}`,
    deterministic_replay_key: sha256Hex({
      input_hash: inputHash,
      engine_version: LEGISLATIVE_IMPACT_SURFACE_ENGINE_VERSION
    }),
    receipt_hash: receiptHash
  };
}

export function buildLegislativeImpactSurface(fixture, classificationManifest) {
  const sourceFixture = canonicalValue(assertLegislativeConsequenceFixture(fixture));
  const manifest = validateClassificationManifest(classificationManifest, sourceFixture);
  const edgeById = new Map(sourceFixture.consequence_graph.edges.map((edge) => [edge.edge_id, edge]));
  const deltaById = new Map(sourceFixture.structural_delta_bundle.deltas.map((delta) => [delta.delta_id, delta]));
  const classificationByEdge = new Map(manifest.classifications.map((entry) => [entry.source_edge_id, entry]));

  const impactItems = [];
  const deferredReferences = [];
  for (const edge of sourceFixture.consequence_graph.edges) {
    const classification = classificationByEdge.get(edge.edge_id);
    if (!classification) fail('classification_missing_during_execution', edge.edge_id);
    if (classification.disposition === 'include') {
      impactItems.push(buildImpactItem(edge, classification, deltaById));
    } else {
      deferredReferences.push(buildDeferredReference(edge, classification));
    }
  }

  impactItems.sort((a, b) => a.impact_id.localeCompare(b.impact_id));
  deferredReferences.sort((a, b) => a.source_edge_id.localeCompare(b.source_edge_id));

  const touchedActors = [...new Set(impactItems.flatMap((item) => item.touched_actor_ids))].sort();
  const effectClassCounts = { legal: 0, operational: 0, economic: 0, administrative: 0 };
  for (const item of impactItems) {
    for (const effectClass of item.effect_classes) effectClassCounts[effectClass] += 1;
  }

  const unresolvedConditions = [...new Set([
    ...impactItems.flatMap((item) => item.unresolved_conditions),
    ...deferredReferences.flatMap((item) => item.unresolved_conditions),
    ...(deferredReferences.length > 0 ? ['stage_4_atlas_historical_comparison_not_executed'] : [])
  ])].sort();

  const surfaceBasis = {
    impact_surface_version: '1.0.0',
    engine_id: LEGISLATIVE_IMPACT_SURFACE_ENGINE_ID,
    engine_version: LEGISLATIVE_IMPACT_SURFACE_ENGINE_VERSION,
    scenario_id: sourceFixture.source_bundle.scenario_id,
    source_consequence_graph_id: sourceFixture.consequence_graph.graph_id,
    source_consequence_graph_hash: sourceFixture.consequence_graph.graph_hash,
    source_structural_delta_bundle_id: sourceFixture.structural_delta_bundle.bundle_id,
    source_structural_delta_bundle_hash: sourceFixture.structural_delta_bundle.bundle_hash,
    rule_manifest_id: manifest.manifest_id,
    rule_manifest_hash: sha256Hex(manifest),
    touched_actor_count: touchedActors.length,
    touched_actor_ids: touchedActors,
    impact_item_count: impactItems.length,
    effect_class_counts: effectClassCounts,
    impact_items: impactItems,
    deferred_reference_count: deferredReferences.length,
    deferred_references: deferredReferences,
    unresolved_conditions: unresolvedConditions,
    atlas_historical_comparison_executed: false,
    lighthouse_accountability_executed: false,
    checklist_instantiated: false,
    no_mutation: true,
    database_write_count: 0
  };
  assertNoNumericJudgment(surfaceBasis);
  const impactSurface = {
    ...surfaceBasis,
    impact_surface_hash: sha256Hex(surfaceBasis)
  };
  const receipt = buildReceipt(impactSurface, manifest);
  return { impact_surface: impactSurface, receipt };
}

export function assertLegislativeImpactSurface(surface, fixture, classificationManifest) {
  const observed = canonicalValue(record(surface, 'impact_surface'));
  const expected = buildLegislativeImpactSurface(fixture, classificationManifest).impact_surface;
  if (observed.impact_surface_hash !== sha256Hex(impactSurfaceHashBasis(observed))) {
    fail('impact_surface_hash_mismatch');
  }
  for (const item of observed.impact_items) {
    if (item.impact_hash !== sha256Hex(impactItemHashBasis(item))) {
      fail('impact_item_hash_mismatch', item.impact_id);
    }
  }
  if (sha256Hex(observed) !== sha256Hex(expected)) fail('impact_surface_deterministic_mismatch');
  assertNoNumericJudgment(observed);
  return observed;
}
