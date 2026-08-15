import test from 'node:test';
import assert from 'node:assert/strict';
import {STATE_RESPONSE_FRONTEND_PATH,resolveStateResponseFrontendRequest} from '../src/state-response-frontend-shell.mjs';

test('serves the state-response workspace with strict browser boundaries', async () => {
  const response = await resolveStateResponseFrontendRequest(STATE_RESPONSE_FRONTEND_PATH);
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /What can a state lawfully do/);
  assert.match(response.body, /What the state could do/);
  assert.match(response.body, /People covered — and people who may still fall through gaps/);
  assert.match(response.headers['content-security-policy'], /default-src 'self'/);
});

test('keeps citizen language primary and technical terms secondary', async () => {
  const response = await resolveStateResponseFrontendRequest(STATE_RESPONSE_FRONTEND_PATH);
  assert.match(response.body, /Federal action being examined/);
  assert.match(response.body, /Federal action currently in effect/);
  assert.match(response.body, /What state law and institutions already provide/);
  assert.match(response.body, /Who could be affected/);
  assert.match(response.body, /Evidence and open questions/);
  assert.match(response.body, /Technical details/);
  assert.match(response.body, /Mechanism ID/);
  assert.match(response.body, /Implementation status code/);
  assert.doesNotMatch(response.body, /<span>Federal mechanism<\/span>/);
  assert.doesNotMatch(response.body, /<span>Operative instrument<\/span>/);
  assert.doesNotMatch(response.body, /<strong>State baseline<\/strong>/);
});

test('explains legal terms that a general reader may not know', async () => {
  const response = await resolveStateResponseFrontendRequest(STATE_RESPONSE_FRONTEND_PATH);
  assert.match(response.body, /<strong>Authority<\/strong> means the legal power/);
  assert.match(response.body, /<strong>Preemption<\/strong> means a higher level of law/);
  assert.match(response.body, /<strong>Jurisdiction<\/strong> means which government/);
  assert.match(response.body, /<strong>Operative<\/strong> means currently in effect/);
});

test('state-response browser code renders evidence, translates technical codes, and never injects HTML', async () => {
  const response = await resolveStateResponseFrontendRequest('/state-responses.js');
  assert.match(response.body, /\/v1\/state-response\/result/);
  assert.match(response.body, /priority_score/);
  assert.match(response.body, /Federal action being examined|result\.mechanism\?\.title/);
  assert.match(response.body, /Who can act/);
  assert.match(response.body, /When action is possible/);
  assert.match(response.body, /Strength of the evidence/);
  assert.match(response.body, /does not establish causation/);
  assert.match(response.body, /technical-mechanism-id/);
  assert.match(response.body, /replaceChildren/);
  assert.doesNotMatch(response.body, /innerHTML/);
  assert.doesNotMatch(response.body, /eval\(/);
});

test('state-response CSS is responsive and reduced-motion safe', async () => {
  const response = await resolveStateResponseFrontendRequest('/state-responses.css');
  assert.match(response.body, /@media\(max-width:800px\)/);
  assert.match(response.body, /prefers-reduced-motion/);
});
