import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LOCAL_PREEMPTION_FRONTEND_PATH,
  LOCAL_PREEMPTION_READ_MODEL_PATH,
  LOCAL_PREEMPTION_RECEIPT_PATH,
  localPreemptionFrontendReadModel,
  localPreemptionFrontendReceipt,
  resolveLocalPreemptionFrontendRequest
} from '../src/local-preemption-frontend-shell.mjs';

const html = await readFile(new URL('../public/local-preemption.html', import.meta.url), 'utf8');
const browserJs = await readFile(new URL('../public/local-preemption.js', import.meta.url), 'utf8');

test('serves a five-jurisdiction citizen-readable local-protection example', async () => {
  const model = localPreemptionFrontendReadModel();
  assert.equal(model.policy_family_id, 'local_lgbtq_ordinance_preemption.v1');
  assert.equal(model.status, 'executed_test_fixture_not_canonical_fact');
  assert.equal(model.summary.mechanism_count, 5);
  assert.equal(model.summary.lens_count, 4);
  assert.equal(model.summary.collision_count, 2);

  const response = await resolveLocalPreemptionFrontendRequest(LOCAL_PREEMPTION_FRONTEND_PATH);
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'text/html; charset=utf-8');
  assert.match(response.body, /When states limit local nondiscrimination protections/);
  assert.match(response.body, /Similar legal techniques do not prove coordination/);
  assert.doesNotMatch(response.body, /vertical slice/i);
  assert.doesNotMatch(response.body, /Lens outputs/);
});

test('keeps five jurisdiction states distinct instead of flattening the family', () => {
  const model = localPreemptionFrontendReadModel();
  const states = new Map(model.mechanism_paths.map((mechanism) => [mechanism.mechanism_id, mechanism.implementation_state]));
  assert.equal(states.get('PREEMPT-TN-2011'), 'operative');
  assert.equal(states.get('PREEMPT-AR-2015'), 'operative');
  assert.equal(states.get('PREEMPT-NC-HB2-HISTORICAL'), 'unresolved');
  assert.equal(states.get('PREEMPT-TX-2023'), 'contested');
  assert.equal(states.get('P25-IA-01'), 'operative_with_open_primary_source_items');
});

test('serves matching deterministic read model and receipt with zero writes', async () => {
  const model = localPreemptionFrontendReadModel();
  const receipt = localPreemptionFrontendReceipt();
  assert.equal(receipt.read_model_hash, model.read_model_hash);
  assert.equal(receipt.no_mutation, true);
  assert.equal(receipt.database_write_count, 0);

  const modelResponse = await resolveLocalPreemptionFrontendRequest(LOCAL_PREEMPTION_READ_MODEL_PATH);
  const receiptResponse = await resolveLocalPreemptionFrontendRequest(LOCAL_PREEMPTION_RECEIPT_PATH);
  assert.deepEqual(JSON.parse(modelResponse.body), model);
  assert.deepEqual(JSON.parse(receiptResponse.body), receipt);
});

test('browser copy explains preemption and never injects dynamic HTML', () => {
  assert.match(html, /A state rule that limits what local governments/);
  assert.match(browserJs, /Tennessee/);
  assert.match(browserJs, /North Carolina/);
  assert.match(browserJs, /Similar legal techniques/);
  assert.match(browserJs, /textContent/);
  assert.match(browserJs, /replaceChildren/);
  assert.doesNotMatch(browserJs, /innerHTML/);
  assert.doesNotMatch(browserJs, /eval\(/);
});

test('unrelated paths remain outside the local-protection route boundary', async () => {
  assert.equal(await resolveLocalPreemptionFrontendRequest('/state-local-protections/unknown'), null);
  assert.equal(await resolveLocalPreemptionFrontendRequest('/not-this-example'), null);
});