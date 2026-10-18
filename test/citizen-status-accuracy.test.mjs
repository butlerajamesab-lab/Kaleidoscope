import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../public/kaleidoscope-app.js', import.meta.url), 'utf8');
const platform = await readFile(new URL('../src/platform-frontend-shell.mjs', import.meta.url), 'utf8');

test('each emitted source-controlled scenario has a human-readable status label and warning tone', () => {
  const state = 'executed_test_fixture_not_canonical_fact';
  assert.match(platform, /state: project2025ReadModel\.status/);
  assert.match(platform, /state: localPreemption\.read_model\.status/);
  assert.match(app, /\['executed_test_fixture_not_canonical_fact', 'Tested example — not an official fact'\]/);
  const tone = app.slice(app.indexOf('function statusTone('), app.indexOf('function statusLabel('));
  const warningSegment = tone.slice(tone.indexOf("return 'positive';"), tone.indexOf("return 'warning';"));
  assert.ok(warningSegment.includes(`'${state}'`));
});

test('storage status avoids technical machine codes and false readiness', () => {
  for (const state of [
    'projection_substrate_applied_empty_unbound',
    'state_response_projection_substrate_applied_empty_unbound'
  ]) {
    assert.ok(app.includes(`['${state}', 'Storage ready — runtime not connected']`));
  }
});

test('both spotlight and scenario cards show per-scenario unresolved counts', () => {
  assert.match(app, /\['Open questions', scenario\.unresolved_count \?\? '—'\]/);
  assert.match(app, /function renderScenarioSpotlight\([\s\S]*?createScenarioStats\(scenario\)/);
  assert.match(app, /function renderScenarios\([\s\S]*?createScenarioStats\(scenario\)/);
  assert.match(platform, /unresolved_count: project2025ReadModel\.summary\.unresolved_count/);
  assert.match(platform, /unresolved_count: localPreemption\.read_model\.summary\.unresolved_count/);
});

test('platform description does not conflate all database triggers with append-only triggers', () => {
  assert.match(platform, /database triggers \(including append-only mutation guards\)/);
  assert.doesNotMatch(platform, /schema\.trigger_count} append-only triggers/);
});
