import test from 'node:test';
import assert from 'node:assert/strict';
import legislativeConsequenceFixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.complete.v1.mjs';
import impactFixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.impact_surface.v1.mjs';
import classificationManifest from '../manifests/eeoc_demographics_reporting_rollback_2026.impact_classification.v1.json' with { type: 'json' };
import {
  buildLegislativeImpactSurface,
  assertLegislativeImpactSurface,
  impactItemHashBasis,
  impactSurfaceHashBasis
} from '../src/legislative-impact-surface.mjs';
import { sha256Hex } from '../src/hash.mjs';

test('builds a deterministic Stage 3 impact surface from the existing Stage 2 graph', () => {
  const { impact_surface: surface, receipt } = buildLegislativeImpactSurface(
    legislativeConsequenceFixture,
    classificationManifest
  );

  assert.equal(surface.scenario_id, 'eeoc_demographics_reporting_rollback_2026');
  assert.equal(surface.impact_item_count, 5);
  assert.equal(surface.deferred_reference_count, 1);
  assert.equal(surface.touched_actor_count, 14);
  assert.deepEqual(surface.effect_class_counts, {
    legal: 3,
    operational: 2,
    economic: 0,
    administrative: 1
  });
  assert.equal(surface.no_mutation, true);
  assert.equal(surface.database_write_count, 0);
  assert.equal(receipt.no_mutation, true);
  assert.equal(receipt.database_write_count, 0);
  assert.equal(receipt.impact_surface_hash, surface.impact_surface_hash);
});

test('derives touched actors only from Stage 1 actor identifiers', () => {
  const surface = impactFixture.impact_surface;
  assert.ok(surface.touched_actor_ids.includes('EEOC'));
  assert.ok(surface.touched_actor_ids.includes('particular respondent employer'));
  assert.ok(surface.touched_actor_ids.includes('private entities doing business in Colorado with 100 or more workers'));

  const stage1Actors = new Set(
    legislativeConsequenceFixture.structural_delta_bundle.deltas.flatMap((delta) => delta.actor_ids)
  );
  for (const actorId of surface.touched_actor_ids) {
    assert.ok(stage1Actors.has(actorId), `unexpected derived actor ${actorId}`);
  }
});

test('copies Stage 2 causal and evidence states without strengthening them', () => {
  const surface = impactFixture.impact_surface;
  const graphById = new Map(
    legislativeConsequenceFixture.consequence_graph.edges.map((edge) => [edge.edge_id, edge])
  );

  for (const impact of surface.impact_items) {
    const edge = graphById.get(impact.source_edge_id);
    assert.equal(impact.causal_state, edge.causal_state);
    assert.equal(impact.evidence_ceiling, edge.evidence_ceiling);
    assert.deepEqual(impact.source_bindings, edge.source_bindings);
    assert.equal(impact.effect_statement, edge.explanation);
    assert.equal(impact.no_new_causal_claim, true);
  }

  const unresolved = surface.impact_items.find(
    (impact) => impact.source_edge_id === 'lce-eeoc-2026-proactive-analysis-effect-unresolved'
  );
  assert.equal(unresolved.causal_state, 'hypothesis_only');
  assert.equal(unresolved.evidence_ceiling, 'hypothesis_only');
  assert.ok(unresolved.unresolved_conditions.includes('causation_not_asserted'));
});

test('defers the historical analogue to Stage 4 instead of claiming Atlas comparison executed', () => {
  const surface = impactFixture.impact_surface;
  assert.equal(surface.deferred_reference_count, 1);
  assert.deepEqual(surface.deferred_references.map((entry) => entry.source_edge_id), [
    'lce-eeoc-2026-component2-historical-analogue'
  ]);
  assert.equal(
    surface.deferred_references[0].defer_reason,
    'historical_comparison_reserved_for_stage_4_atlas'
  );
  assert.equal(surface.atlas_historical_comparison_executed, false);
  assert.ok(surface.unresolved_conditions.includes('stage_4_atlas_historical_comparison_not_executed'));
});

test('does not manufacture an economic impact because none is declared', () => {
  const surface = impactFixture.impact_surface;
  assert.equal(surface.effect_class_counts.economic, 0);
  assert.equal(surface.impact_items.some((impact) => impact.effect_classes.includes('economic')), false);
});

test('requires a classification decision for every Stage 2 edge', () => {
  const incomplete = structuredClone(classificationManifest);
  incomplete.classifications.pop();
  assert.throws(
    () => buildLegislativeImpactSurface(legislativeConsequenceFixture, incomplete),
    /manifest_must_classify_every_edge/
  );
});

test('prohibits numeric judgment weights and scores in the Stage 3 manifest', () => {
  const weighted = structuredClone(classificationManifest);
  weighted.classifications[0].weight = 0.9;
  assert.throws(
    () => buildLegislativeImpactSurface(legislativeConsequenceFixture, weighted),
    /numeric_judgment_key_prohibited/
  );
});

test('replay produces identical impact and receipt identities', () => {
  const first = buildLegislativeImpactSurface(legislativeConsequenceFixture, classificationManifest);
  const second = buildLegislativeImpactSurface(legislativeConsequenceFixture, classificationManifest);
  assert.deepEqual(second, first);
  assert.equal(second.impact_surface.impact_surface_hash, first.impact_surface.impact_surface_hash);
  assert.equal(second.receipt.receipt_hash, first.receipt.receipt_hash);
  assert.equal(second.receipt.deterministic_replay_key, first.receipt.deterministic_replay_key);
});

test('rejects a rehashed attempt to strengthen a copied causal state', () => {
  const changed = structuredClone(impactFixture.impact_surface);
  const target = changed.impact_items.find(
    (impact) => impact.source_edge_id === 'lce-eeoc-2026-proactive-analysis-effect-unresolved'
  );
  target.causal_state = 'directly_prescribed';
  target.impact_hash = sha256Hex(impactItemHashBasis(target));
  changed.impact_surface_hash = sha256Hex(impactSurfaceHashBasis(changed));

  assert.throws(
    () => assertLegislativeImpactSurface(changed, legislativeConsequenceFixture, classificationManifest),
    /impact_surface_deterministic_mismatch/
  );
});

test('accepts the exact generated Stage 3 surface and keeps later stages null', () => {
  assert.equal(
    assertLegislativeImpactSurface(
      impactFixture.impact_surface,
      legislativeConsequenceFixture,
      classificationManifest
    ),
    impactFixture.impact_surface
  );
  assert.equal(impactFixture.atlas_historical_compare, null);
  assert.equal(impactFixture.lighthouse_accountability_view, null);
  assert.equal(impactFixture.instantiated_checklist, null);
  assert.equal(impactFixture.projection_executed, false);
  assert.equal(impactFixture.database_persisted, false);
});
