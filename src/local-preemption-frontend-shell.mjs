import { readFile } from 'node:fs/promises';
import fixture from '../fixtures/local-preemption-family-vertical-slice.v1.mjs';
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import preemptionOperability from '../lenses/preemption_operability.v1.json' with { type: 'json' };
import preemptionTemporalHistory from '../lenses/preemption_temporal_history.v1.json' with { type: 'json' };
import preemptionJurisdictionalVariation from '../lenses/preemption_jurisdictional_variation.v1.json' with { type: 'json' };
import { executeLocalPreemptionFamilyVerticalSlice } from './local-preemption-family-slice.mjs';
import { canonicalValue } from './canonical-json.mjs';

export const LOCAL_PREEMPTION_FRONTEND_PATH = '/state-local-protections';
export const LOCAL_PREEMPTION_READ_MODEL_PATH = '/v1/scenarios/state-local-protections/read-model';
export const LOCAL_PREEMPTION_RECEIPT_PATH = '/v1/scenarios/state-local-protections/receipt';
export const LOCAL_PREEMPTION_FRONTEND_VERSION = '1.0.0';

const LENSES = [
  affectedPopulations,
  preemptionOperability,
  preemptionTemporalHistory,
  preemptionJurisdictionalVariation
];

const HTML_ASSET = {
  file: '../public/local-preemption.html',
  contentType: 'text/html; charset=utf-8'
};

const ASSET_ROUTES = new Map([
  ['/state-local-protections.css', {
    file: '../public/project2025-title-vii.css',
    contentType: 'text/css; charset=utf-8'
  }],
  ['/state-local-protections.js', {
    file: '../public/local-preemption.js',
    contentType: 'text/javascript; charset=utf-8'
  }]
]);

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

function fail(code) {
  throw new Error(`invalid_local_preemption_frontend:${code}`);
}

function execution() {
  const result = executeLocalPreemptionFamilyVerticalSlice(fixture, LENSES);
  if (result.read_model.status !== 'executed_test_fixture_not_canonical_fact') {
    fail('truth_label_missing');
  }
  if (result.bundle.no_mutation !== true || result.bundle.database_write_count !== 0) {
    fail('write_boundary_mismatch');
  }
  if (result.bundle.projection_claim_state !== 'not_prediction_not_canonical_fact') {
    fail('projection_claim_state_mismatch');
  }
  if (result.receipt.no_mutation !== true || result.receipt.database_write_count !== 0) {
    fail('receipt_write_boundary_mismatch');
  }
  if (result.receipt.read_model_hash !== result.read_model.read_model_hash) {
    fail('receipt_read_model_hash_mismatch');
  }
  if (result.read_model.summary.mechanism_count !== 5
      || result.read_model.summary.lens_count !== 4
      || result.read_model.summary.collision_count !== 2) {
    fail('expected_shape_mismatch');
  }
  return result;
}

export function localPreemptionFrontendReadModel() {
  return canonicalValue(execution().read_model);
}

export function localPreemptionFrontendReceipt() {
  return canonicalValue(execution().receipt);
}

async function textAsset(asset) {
  const body = await readFile(new URL(asset.file, import.meta.url), 'utf8');
  return {
    statusCode: 200,
    contentType: asset.contentType,
    body,
    cacheControl: 'no-store'
  };
}

export async function resolveLocalPreemptionFrontendRequest(pathname) {
  if (pathname === LOCAL_PREEMPTION_FRONTEND_PATH || pathname === `${LOCAL_PREEMPTION_FRONTEND_PATH}/`) {
    return {
      ...(await textAsset(HTML_ASSET)),
      headers: SECURITY_HEADERS
    };
  }

  const asset = ASSET_ROUTES.get(pathname);
  if (asset) {
    return {
      ...(await textAsset(asset)),
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  if (pathname === LOCAL_PREEMPTION_READ_MODEL_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(localPreemptionFrontendReadModel()),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  if (pathname === LOCAL_PREEMPTION_RECEIPT_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(localPreemptionFrontendReceipt()),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  return null;
}
