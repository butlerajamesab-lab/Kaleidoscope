import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex } from '../src/hash.mjs';
import {
  CIVIC_GENOME_SOURCE_SCHEMA_ID,
  civicGenomeExportReceiptHashBasis,
  civicGenomeSourceComponentHashBasis,
  civicGenomeSourceSnapshotHashBasis
} from '../src/civic-genome-snapshot-binding.mjs';
import {
  CIVIC_GENOME_DELIVERY_CONTRACT_ID,
  CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
  authenticateAndMapCivicGenomeDelivery,
  buildCivicGenomeDeliveryReceipt,
  signCivicGenomeDelivery
} from '../src/civic-genome-snapshot-delivery.mjs';
import {
  civicGenomePersistenceConfiguration,
  persistCivicGenomeSnapshot
} from '../src/civic-genome-snapshot-persistence.mjs';

const KEY_ID = 'lighthouse-civic-genome-v1';
const SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function component(index, overrides = {}) {
  const row = {
    component_id: `civic_genome:trait:${index}`,
    component_type: 'trait',
    canonical_record_id: `trait-${index}`,
    inclusion_state: 'current',
    jurisdiction_code: 'WA',
    temporal_scope: '2026-08-20T00:00:00.000Z',
    value: {
      domain: 'child_care',
      label: `Trait ${index}`
    },
    source_bindings: [{
      owner_service: 'prism',
      record_type: 'civic_genome_prism_binding',
      record_id: `binding-${index}`,
      receipt_id: `receipt-${index}`,
      content_hash: `${index}`.repeat(64),
      engine_id: 'prism',
      engine_version: 'deterministic',
      rule_id: 'rule',
      rule_version: '1'
    }],
    source_verification: [{
      owner_service: 'prism',
      state: 'supported_by_one_source',
      receipt_id: `receipt-${index}`,
      evidence_hash: `${index}`.repeat(64),
      mapping_state: 'source_native_preserved'
    }],
    unresolved_conditions: [],
    ...overrides
  };
  row.component_hash = sha256Hex(civicGenomeSourceComponentHashBasis(row));
  return row;
}

function sourceSnapshot() {
  const components = [component(1), component(2)];
  const snapshot = {
    contract_id: 'civic_genome.external_snapshot.v1',
    contract_version: '1.0.0',
    canonical_owner: 'lighthouse/civic_genome',
    snapshot_id: 'cg-family-snapshot-persistence-proof',
    snapshot_kind: 'baseline_export',
    immutable: true,
    scope: {
      scope_type: 'family',
      scope_ids: ['family-proof'],
      jurisdiction_codes: ['WA']
    },
    as_of: '2026-08-20T15:00:00.000Z',
    methodology_version: 'civic_genome_external_family_snapshot.1.0.0',
    components,
    component_count: components.length,
    unresolved_conditions: [],
    excluded_component_types: [],
    completeness_state: 'bounded_complete',
    snapshot_hash: '0'.repeat(64),
    export_receipt: {
      export_receipt_id: 'pending',
      export_receipt_hash: '0'.repeat(64),
      snapshot_hash: '0'.repeat(64),
      deterministic_replay_key: '0'.repeat(64),
      replay_state: 'original',
      source_commit_sha: '614294c36eddac4aad0acdb22bfb004599e73682',
      generated_at: '2026-08-20T15:01:00.000Z'
    }
  };
  snapshot.snapshot_hash = sha256Hex(civicGenomeSourceSnapshotHashBasis(snapshot));
  snapshot.export_receipt.snapshot_hash = snapshot.snapshot_hash;
  snapshot.export_receipt.deterministic_replay_key = sha256Hex({
    contract_id: snapshot.contract_id,
    contract_version: snapshot.contract_version,
    snapshot_id: snapshot.snapshot_id,
    snapshot_hash: snapshot.snapshot_hash,
    methodology_version: snapshot.methodology_version
  });
  snapshot.export_receipt.export_receipt_id =
    `cg-export-${snapshot.export_receipt.deterministic_replay_key.slice(0, 32)}`;
  snapshot.export_receipt.export_receipt_hash = sha256Hex(
    civicGenomeExportReceiptHashBasis(snapshot)
  );
  return snapshot;
}

function delivery(snapshot = sourceSnapshot()) {
  return {
    delivery_contract_id: CIVIC_GENOME_DELIVERY_CONTRACT_ID,
    delivery_contract_version: CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
    source_schema_id: CIVIC_GENOME_SOURCE_SCHEMA_ID,
    source_contract_id: snapshot.contract_id,
    source_contract_version: snapshot.contract_version,
    snapshot
  };
}

function authenticated() {
  const body = delivery();
  const signature = signCivicGenomeDelivery(body, KEY_ID, SECRET);
  return authenticateAndMapCivicGenomeDelivery({
    body,
    keyId: KEY_ID,
    signature,
    expectedKeyId: KEY_ID,
    secret: SECRET
  });
}

function deterministicUuid(seed) {
  const digest = sha256Hex(seed);
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
}

function fakeSupabaseFetch() {
  const tables = new Map();
  const calls = [];
  const ids = new Map([
    ['source_binding', 'source_binding_id'],
    ['state_snapshot', 'state_snapshot_id'],
    ['state_component', 'state_component_id']
  ]);

  function rows(table) {
    const existing = tables.get(table) ?? [];
    tables.set(table, existing);
    return existing;
  }

  function matches(row, url) {
    for (const [key, value] of url.searchParams.entries()) {
      if (key === 'select' || key === 'limit') continue;
      if (!value.startsWith('eq.')) continue;
      if (String(row[key]) !== value.slice(3)) return false;
    }
    return true;
  }

  const fetchImpl = async (url, options) => {
    const parsed = new URL(String(url));
    const table = parsed.pathname.split('/').at(-1);
    calls.push({ table, method: options.method, body: options.body ? JSON.parse(options.body) : null });
    if (options.method === 'GET') {
      return new Response(JSON.stringify(rows(table).filter((row) => matches(row, parsed))));
    }
    const row = JSON.parse(options.body);
    const idColumn = ids.get(table);
    const stored = idColumn ? { [idColumn]: deterministicUuid(`${table}:${JSON.stringify(row)}`), ...row } : row;
    rows(table).push(stored);
    return new Response(JSON.stringify([stored]));
  };

  return {
    fetchImpl,
    calls,
    rows: (table) => rows(table)
  };
}

test('default persistence configuration preserves transient validation only', async () => {
  const deliveryState = authenticated();
  const result = await persistCivicGenomeSnapshot({
    snapshot: deliveryState.snapshot,
    binding: deliveryState.binding,
    configuration: civicGenomePersistenceConfiguration({})
  });
  const receipt = buildCivicGenomeDeliveryReceipt({
    snapshot: deliveryState.snapshot,
    binding: deliveryState.binding,
    keyId: deliveryState.keyId,
    deliveryContractVersion: deliveryState.deliveryContractVersion,
    persistence: result
  });

  assert.equal(result.state, 'disabled_no_write');
  assert.equal(receipt.persisted, false);
  assert.equal(receipt.projection_executed, false);
  assert.equal(receipt.database_write_count, 0);
});

test('persists accepted Civic Genome snapshots without projection execution', async () => {
  const deliveryState = authenticated();
  const db = fakeSupabaseFetch();
  const configuration = civicGenomePersistenceConfiguration({
    KALEIDOSCOPE_CIVIC_GENOME_PERSISTENCE: 'enabled',
    KALEIDOSCOPE_SUPABASE_URL: 'https://example.supabase.co',
    KALEIDOSCOPE_SUPABASE_SERVICE_ROLE_KEY: 'secret-service-role-key'
  });

  const first = await persistCivicGenomeSnapshot({
    snapshot: deliveryState.snapshot,
    binding: deliveryState.binding,
    configuration,
    fetchImpl: db.fetchImpl
  });
  const second = await persistCivicGenomeSnapshot({
    snapshot: deliveryState.snapshot,
    binding: deliveryState.binding,
    configuration,
    fetchImpl: db.fetchImpl
  });

  assert.equal(first.state, 'persisted');
  assert.equal(first.persisted, true);
  assert.equal(first.projection_executed, false);
  assert.equal(first.state_component_count, 2);
  assert.equal(first.source_artifact_count, 0);
  assert.equal(first.database_write_count, 7);
  assert.match(first.persistence_receipt_hash, /^[0-9a-f]{64}$/);

  assert.equal(second.state, 'existing_persistence_reused');
  assert.equal(second.database_write_count, 0);
  assert.equal(second.idempotent_reuse, true);
  assert.equal(second.source_binding_id, first.source_binding_id);
  assert.equal(second.state_snapshot_id, first.state_snapshot_id);

  assert.equal(db.rows('source_binding').length, 1);
  assert.equal(db.rows('state_snapshot').length, 1);
  assert.equal(db.rows('state_snapshot_source').length, 1);
  assert.equal(db.rows('state_component').length, 2);
  assert.equal(db.rows('state_component_source').length, 2);
  assert.equal(db.rows('projection_run').length, 0);
  assert.equal(db.rows('projection_result').length, 0);
  assert.equal(db.rows('replay_receipt').length, 0);
  assert.ok(db.calls.every((call) => !['projection_run', 'projection_result', 'replay_receipt'].includes(call.table)));
});
