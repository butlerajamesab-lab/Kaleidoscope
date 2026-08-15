import test from 'node:test';
import assert from 'node:assert/strict';
import {STATE_RESPONSE_FRONTEND_PATH,resolveStateResponseFrontendRequest} from '../src/state-response-frontend-shell.mjs';

test('serves the state-response workspace with strict browser boundaries', async () => {
  const response = await resolveStateResponseFrontendRequest(STATE_RESPONSE_FRONTEND_PATH);
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /What can a state lawfully do/);
  assert.match(response.body, /Best-supported pathways/);
  assert.match(response.body, /Affected populations and coverage gaps/);
  assert.match(response.headers['content-security-policy'], /default-src 'self'/);
});

test('state-response browser code renders evidence and never injects HTML', async () => {
  const response = await resolveStateResponseFrontendRequest('/state-responses.js');
  assert.match(response.body, /\/v1\/state-response\/result/);
  assert.match(response.body, /priority_score/);
  assert.match(response.body, /replaceChildren/);
  assert.doesNotMatch(response.body, /innerHTML/);
  assert.doesNotMatch(response.body, /eval\(/);
});

test('state-response CSS is responsive and reduced-motion safe', async () => {
  const response = await resolveStateResponseFrontendRequest('/state-responses.css');
  assert.match(response.body, /@media\(max-width:800px\)/);
  assert.match(response.body, /prefers-reduced-motion/);
});
