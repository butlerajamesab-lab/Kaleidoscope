import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECT2025_FRONTEND_PATH,
  PROJECT2025_FRONTEND_READ_MODEL_PATH,
  PROJECT2025_FRONTEND_RECEIPT_PATH,
  project2025FrontendReadModel,
  project2025FrontendReceipt,
  resolveProject2025FrontendRequest
} from '../src/project2025-frontend-shell.mjs';

test('serves the exact source-controlled read model with truthful status', () => {
  const model = project2025FrontendReadModel();
  assert.equal(model.status, 'executed_test_fixture_not_canonical_fact');
  assert.equal(model.summary.mechanism_count, 2);
  assert.equal(model.summary.lens_count, 4);
  assert.equal(model.summary.collision_count, 3);
  assert.equal(model.source_artifact_ids.length, 8);
  assert.equal(model.inspection.no_mutation, true);
});

test('serves a matching deterministic receipt with zero writes', () => {
  const model = project2025FrontendReadModel();
  const receipt = project2025FrontendReceipt();
  assert.equal(receipt.scenario_id, model.scenario_id);
  assert.equal(receipt.read_model_hash, model.read_model_hash);
  assert.equal(receipt.no_mutation, true);
  assert.equal(receipt.database_write_count, 0);
});

test('returns the inspection-first HTML shell with strict browser boundaries', async () => {
  const response = await resolveProject2025FrontendRequest(PROJECT2025_FRONTEND_PATH);
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'text/html; charset=utf-8');
  assert.match(response.body, /Executed test fixture — not canonical fact/);
  assert.match(response.body, /Preserved collisions/);
  assert.match(response.body, /Open deterministic receipt/);
  assert.match(response.headers['content-security-policy'], /default-src 'self'/);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('frontend JavaScript renders with textContent and never injects dynamic HTML', async () => {
  const response = await resolveProject2025FrontendRequest('/project2025/title-vii.js');
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'text/javascript; charset=utf-8');
  assert.match(response.body, /textContent/);
  assert.match(response.body, /replaceChildren/);
  assert.doesNotMatch(response.body, /innerHTML/);
  assert.match(response.body, /\/v1\/project2025\/title-vii\/read-model/);
  assert.match(response.body, /\/v1\/project2025\/title-vii\/receipt/);
});

test('frontend CSS is responsive and preserves reduced-motion preference', async () => {
  const response = await resolveProject2025FrontendRequest('/project2025/title-vii.css');
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'text/css; charset=utf-8');
  assert.match(response.body, /@media \(max-width: 640px\)/);
  assert.match(response.body, /prefers-reduced-motion/);
});

test('read-model and receipt API routes return exact immutable fixtures', async () => {
  const modelResponse = await resolveProject2025FrontendRequest(PROJECT2025_FRONTEND_READ_MODEL_PATH);
  const receiptResponse = await resolveProject2025FrontendRequest(PROJECT2025_FRONTEND_RECEIPT_PATH);
  assert.deepEqual(JSON.parse(modelResponse.body), project2025FrontendReadModel());
  assert.deepEqual(JSON.parse(receiptResponse.body), project2025FrontendReceipt());
  assert.equal(modelResponse.cacheControl, 'no-store');
  assert.equal(receiptResponse.cacheControl, 'no-store');
});

test('unknown paths remain outside the frontend route boundary', async () => {
  assert.equal(await resolveProject2025FrontendRequest('/project2025/unknown'), null);
  assert.equal(await resolveProject2025FrontendRequest('/../../etc/passwd'), null);
});
