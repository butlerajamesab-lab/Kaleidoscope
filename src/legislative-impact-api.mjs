import impactFixture from '../fixtures/eeoc_demographics_reporting_rollback_2026.impact_surface.v1.mjs';
import { canonicalValue } from './canonical-json.mjs';

export const LEGISLATIVE_IMPACT_SURFACE_PATH = '/v1/legislative-consequence/eeoc/impact-surface';
export const LEGISLATIVE_IMPACT_RECEIPT_PATH = '/v1/legislative-consequence/eeoc/impact-surface/receipt';

function fail(code) {
  throw new Error(`invalid_legislative_impact_api:${code}`);
}

function assertImpactState() {
  const surface = impactFixture.impact_surface;
  const receipt = impactFixture.receipt;
  if (impactFixture.stage !== 3 || impactFixture.stage_name !== 'impact_surface') fail('stage_identity_mismatch');
  if (surface.impact_item_count !== 5 || surface.deferred_reference_count !== 1) fail('impact_shape_mismatch');
  if (surface.touched_actor_count !== 14) fail('touched_actor_count_mismatch');
  if (surface.effect_class_counts.legal !== 3
      || surface.effect_class_counts.operational !== 2
      || surface.effect_class_counts.economic !== 0
      || surface.effect_class_counts.administrative !== 1) {
    fail('effect_class_count_mismatch');
  }
  if (surface.atlas_historical_comparison_executed !== false
      || surface.lighthouse_accountability_executed !== false
      || surface.checklist_instantiated !== false
      || surface.no_mutation !== true
      || surface.database_write_count !== 0) {
    fail('impact_boundary_mismatch');
  }
  if (receipt.impact_surface_hash !== surface.impact_surface_hash
      || receipt.no_mutation !== true
      || receipt.database_write_count !== 0) {
    fail('receipt_boundary_mismatch');
  }
  if (impactFixture.atlas_historical_compare !== null
      || impactFixture.lighthouse_accountability_view !== null
      || impactFixture.instantiated_checklist !== null
      || impactFixture.projection_executed !== false
      || impactFixture.database_persisted !== false) {
    fail('later_stage_boundary_mismatch');
  }
  return { surface, receipt };
}

export function legislativeImpactSurfaceReadModel() {
  return canonicalValue(assertImpactState().surface);
}

export function legislativeImpactSurfaceReceipt() {
  return canonicalValue(assertImpactState().receipt);
}

export function resolveLegislativeImpactRequest(pathname) {
  if (pathname === LEGISLATIVE_IMPACT_SURFACE_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(legislativeImpactSurfaceReadModel()),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }
  if (pathname === LEGISLATIVE_IMPACT_RECEIPT_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(legislativeImpactSurfaceReceipt()),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }
  return null;
}
