import test from 'node:test';
import assert from 'node:assert/strict';
import impactFixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.impact_surface.v1.mjs';
import {
  LEGISLATIVE_IMPACT_SURFACE_PATH,
  LEGISLATIVE_IMPACT_RECEIPT_PATH,
  legislativeImpactSurfaceReadModel,
  legislativeImpactSurfaceReceipt,
  resolveLegislativeImpactRequest
} from '../src/legislative-impact-api.mjs';

test('serves the exact Stage 3 impact surface without strengthening or mutation', () => {
  const surface = legislativeImpactSurfaceReadModel();
  assert.deepEqual(surface, impactFixture.impact_surface);
  assert.equal(surface.impact_item_count, 5);
  assert.equal(surface.touched_actor_count, 14);
  assert.equal(surface.deferred_reference_count, 1);
  assert.deepEqual(surface.effect_class_counts, {
    legal: 3,
    operational: 2,
    economic: 0,
    administrative: 1
  });
  assert.equal(surface.atlas_historical_comparison_executed, false);
  assert.equal(surface.lighthouse_accountability_executed, false);
  assert.equal(surface.checklist_instantiated, false);
  assert.equal(surface.no_mutation, true);
  assert.equal(surface.database_write_count, 0);
});

test('serves a matching Stage 3 deterministic receipt with zero writes', () => {
  const surface = legislativeImpactSurfaceReadModel();
  const receipt = legislativeImpactSurfaceReceipt();
  assert.deepEqual(receipt, impactFixture.receipt);
  assert.equal(receipt.impact_surface_hash, surface.impact_surface_hash);
  assert.equal(receipt.atlas_historical_comparison_executed, false);
  assert.equal(receipt.lighthouse_accountability_executed, false);
  assert.equal(receipt.checklist_instantiated, false);
  assert.equal(receipt.no_mutation, true);
  assert.equal(receipt.database_write_count, 0);
});

test('read-only Stage 3 API routes return canonical JSON with no-store boundaries', () => {
  const surfaceResponse = resolveLegislativeImpactRequest(LEGISLATIVE_IMPACT_SURFACE_PATH);
  const receiptResponse = resolveLegislativeImpactRequest(LEGISLATIVE_IMPACT_RECEIPT_PATH);
  assert.equal(surfaceResponse.statusCode, 200);
  assert.equal(surfaceResponse.contentType, 'application/json; charset=utf-8');
  assert.equal(surfaceResponse.cacheControl, 'no-store');
  assert.deepEqual(JSON.parse(surfaceResponse.body), legislativeImpactSurfaceReadModel());
  assert.equal(receiptResponse.statusCode, 200);
  assert.equal(receiptResponse.contentType, 'application/json; charset=utf-8');
  assert.equal(receiptResponse.cacheControl, 'no-store');
  assert.deepEqual(JSON.parse(receiptResponse.body), legislativeImpactSurfaceReceipt());
});

test('unrelated paths remain outside the Stage 3 API boundary', () => {
  assert.equal(resolveLegislativeImpactRequest('/v1/legislative-consequence/eeoc/unknown'), null);
  assert.equal(resolveLegislativeImpactRequest('/project2025/title-vii'), null);
});