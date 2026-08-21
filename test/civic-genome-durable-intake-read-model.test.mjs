import test from 'node:test';
import assert from 'node:assert/strict';
import { readCivicGenomeDurableIntake } from '../src/civic-genome-durable-intake-read-model.mjs';
import { civicGenomePersistenceConfiguration } from '../src/civic-genome-snapshot-persistence.mjs';

const FIRST_HASH = 'a'.repeat(64);
const SECOND_HASH = 'b'.repeat(64);

function configuration() {
  return civicGenomePersistenceConfiguration({
    KALEIDOSCOPE_CIVIC_GENOME_PERSISTENCE: 'enabled',
    KALEIDOSCOPE_SUPABASE_URL: 'https://example.supabase.co',
    KALEIDOSCOPE_SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key'
  });
}

function fakeSupabase(rowsByTable) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, options) => {
      const parsed = new URL(String(url));
      const table = parsed.pathname.split('/').at(-1);
      calls.push({ table, url: parsed, options });
      return new Response(JSON.stringify(rowsByTable[table] ?? []), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  };
}

test('reads accepted Civic Genome durable inputs without treating them as projections', async () => {
  const database = fakeSupabase({
    source_binding: [
      {
        source_binding_id: 'binding-1',
        upstream_object_id: 'cg-family-snapshot-newer',
        upstream_hash: FIRST_HASH,
        verification_state: 'mapped_by_declared_rule',
        bound_at: '2026-08-21T20:41:09.491699Z'
      },
      {
        source_binding_id: 'binding-2',
        upstream_object_id: 'cg-family-snapshot-earlier',
        upstream_hash: SECOND_HASH,
        verification_state: 'mapped_by_declared_rule',
        bound_at: '2026-08-21T12:22:34.129869Z'
      }
    ],
    state_snapshot_source: [
      { source_binding_id: 'binding-1', state_snapshot_id: 'snapshot-1' },
      { source_binding_id: 'binding-2', state_snapshot_id: 'snapshot-2' }
    ],
    state_snapshot: [
      {
        state_snapshot_id: 'snapshot-1',
        external_snapshot_id: 'cg-family-snapshot-newer',
        snapshot_kind: 'baseline',
        as_of_date: '2026-08-21',
        snapshot_hash: FIRST_HASH,
        created_at: '2026-08-21T20:41:09.952698Z'
      },
      {
        state_snapshot_id: 'snapshot-2',
        external_snapshot_id: 'cg-family-snapshot-earlier',
        snapshot_kind: 'baseline',
        as_of_date: '2026-08-21',
        snapshot_hash: SECOND_HASH,
        created_at: '2026-08-21T12:22:34.562780Z'
      }
    ],
    state_component: [
      { state_snapshot_id: 'snapshot-1' },
      { state_snapshot_id: 'snapshot-1' },
      { state_snapshot_id: 'snapshot-2' }
    ],
    projection_run: [],
    projection_result: [],
    replay_receipt: []
  });

  const intake = await readCivicGenomeDurableIntake({
    configuration: configuration(),
    fetchImpl: database.fetchImpl
  });

  assert.equal(intake.state, 'durable_intake_active');
  assert.equal(intake.available, true);
  assert.equal(intake.binding_count, 2);
  assert.equal(intake.snapshot_count, 2);
  assert.equal(intake.component_count, 3);
  assert.equal(intake.projection_run_count, 0);
  assert.equal(intake.projection_result_count, 0);
  assert.equal(intake.replay_receipt_count, 0);
  assert.equal(intake.records[0].external_snapshot_id, 'cg-family-snapshot-newer');
  assert.equal(intake.records[0].component_count, 2);
  assert.equal(intake.records[1].component_count, 1);
  assert.ok(database.calls.some((call) => call.table === 'projection_run'));
  assert.ok(database.calls.every((call) => call.options.headers['accept-profile'] === 'kaleidoscope'));
  assert.ok(database.calls.every((call) => call.options.headers.authorization === 'Bearer server-only-test-key'));
});

test('fails closed to an unavailable intake state when the source and snapshot hashes disagree', async () => {
  const database = fakeSupabase({
    source_binding: [{
      source_binding_id: 'binding-1',
      upstream_object_id: 'cg-family-snapshot',
      upstream_hash: FIRST_HASH,
      verification_state: 'mapped_by_declared_rule',
      bound_at: '2026-08-21T20:41:09.491699Z'
    }],
    state_snapshot_source: [{ source_binding_id: 'binding-1', state_snapshot_id: 'snapshot-1' }],
    state_snapshot: [{
      state_snapshot_id: 'snapshot-1',
      external_snapshot_id: 'cg-family-snapshot',
      snapshot_kind: 'baseline',
      as_of_date: '2026-08-21',
      snapshot_hash: SECOND_HASH,
      created_at: '2026-08-21T20:41:09.952698Z'
    }],
    state_component: [],
    projection_run: [],
    projection_result: [],
    replay_receipt: []
  });

  const intake = await readCivicGenomeDurableIntake({
    configuration: configuration(),
    fetchImpl: database.fetchImpl
  });

  assert.equal(intake.available, false);
  assert.equal(intake.state, 'live_read_unavailable');
  assert.equal(intake.error_code, 'source_snapshot_hash_mismatch');
  assert.equal(intake.records.length, 0);
});

test('does not attempt a live read until the durable persistence configuration is ready', async () => {
  let fetchCalled = false;
  const intake = await readCivicGenomeDurableIntake({
    configuration: civicGenomePersistenceConfiguration({}),
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error('must_not_run');
    }
  });

  assert.equal(intake.available, false);
  assert.equal(intake.state, 'disabled_no_read');
  assert.equal(fetchCalled, false);
});
