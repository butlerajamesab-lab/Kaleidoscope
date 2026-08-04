import { readFile } from 'node:fs/promises';
import readModel from '../fixtures/project2025-title-vii-read-model.v1.json' with { type: 'json' };
import receipt from '../fixtures/project2025-title-vii-receipt.v1.json' with { type: 'json' };
import { canonicalValue } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';

export const PROJECT2025_FRONTEND_PATH = '/project2025/title-vii';
export const PROJECT2025_FRONTEND_READ_MODEL_PATH = '/v1/project2025/title-vii/read-model';
export const PROJECT2025_FRONTEND_RECEIPT_PATH = '/v1/project2025/title-vii/receipt';

const ASSET_ROUTES = new Map([
  ['/project2025/title-vii.css', {
    file: '../public/project2025-title-vii.css',
    contentType: 'text/css; charset=utf-8'
  }],
  ['/project2025/title-vii.js', {
    file: '../public/project2025-title-vii.js',
    contentType: 'text/javascript; charset=utf-8'
  }]
]);

const HTML_ASSET = {
  file: '../public/project2025-title-vii.html',
  contentType: 'text/html; charset=utf-8'
};

function fail(code) {
  throw new Error(`invalid_project2025_frontend_shell:${code}`);
}

function assertReadModelIntegrity() {
  if (readModel.status !== 'executed_test_fixture_not_canonical_fact') {
    fail('truth_label_missing');
  }
  if (readModel.inspection?.no_mutation !== true) {
    fail('read_model_mutation_boundary_missing');
  }
  const { read_model_hash: observedHash, ...basis } = readModel;
  if (sha256Hex(basis) !== observedHash) {
    fail('read_model_hash_mismatch');
  }
  if (receipt.read_model_hash !== observedHash) {
    fail('receipt_read_model_hash_mismatch');
  }
  if (receipt.no_mutation !== true || receipt.database_write_count !== 0) {
    fail('receipt_write_boundary_mismatch');
  }
  if (receipt.scenario_id !== readModel.scenario_id) {
    fail('scenario_identity_mismatch');
  }
}

export function project2025FrontendReadModel() {
  assertReadModelIntegrity();
  return canonicalValue(readModel);
}

export function project2025FrontendReceipt() {
  assertReadModelIntegrity();
  return canonicalValue(receipt);
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

export async function resolveProject2025FrontendRequest(pathname) {
  if (pathname === PROJECT2025_FRONTEND_PATH) {
    return {
      ...(await textAsset(HTML_ASSET)),
      headers: {
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer'
      }
    };
  }

  const asset = ASSET_ROUTES.get(pathname);
  if (asset) {
    return {
      ...(await textAsset(asset)),
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  if (pathname === PROJECT2025_FRONTEND_READ_MODEL_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(project2025FrontendReadModel()),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  if (pathname === PROJECT2025_FRONTEND_RECEIPT_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(project2025FrontendReceipt()),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  return null;
}
