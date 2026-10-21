import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sourceManifest from '../source_manifests/source_pack_2026_08_03_v3.json' with { type: 'json' };
import {
  buildSourceArtifactCustodyManifest,
  buildSourceArtifactCustodyRecord,
  assertSourceArtifactCustodyRecord,
  sourceArtifactCustodyHashBasis
} from '../src/source-artifact-custody.mjs';
import { sha256Hex } from '../src/hash.mjs';

const migration = await readFile(
  new URL('../supabase/migrations/20260809190000_kaleidoscope_source_artifact_custody.sql', import.meta.url),
  'utf8'
);
const rollback = await readFile(
  new URL('../supabase/rollback/20260809190000_kaleidoscope_source_artifact_custody_rollback.sql', import.meta.url),
  'utf8'
);

test('builds one deterministic custody record for every source-manifest artifact', () => {
  const custody = buildSourceArtifactCustodyManifest(sourceManifest);
  assert.equal(custody.source_manifest_id, 'kaleidoscope_source_pack_2026_08_03_v3');
  assert.equal(custody.source_artifact_count, 41);
  assert.equal(custody.custody_records.length, 41);
  assert.equal(custody.content_ownership_asserted, false);
  assert.equal(custody.upstream_object_bindings_created, 0);
  assert.equal(custody.no_upstream_ownership_inference, true);
  assert.match(custody.custody_manifest_hash, /^[0-9a-f]{64}$/);

  for (const record of custody.custody_records) {
    assert.deepEqual(assertSourceArtifactCustodyRecord(record), record);
    assert.equal(record.content_owner_state, 'not_asserted');
    assert.equal(record.upstream_binding_state, 'not_declared');
    assert.equal(record.upstream_platform, null);
    assert.equal(record.upstream_object_type, null);
    assert.equal(record.upstream_object_id, null);
  }
});

test('preserves exact byte identities for current Project 2025 source artifacts', () => {
  const custody = buildSourceArtifactCustodyManifest(sourceManifest);
  const byId = new Map(custody.custody_records.map((record) => [record.source_artifact_id, record]));

  assert.equal(
    byId.get('P25-PREEMPT-FAMILY-01_dossier.md').sha256,
    '0c84ce7e744cc0fc5a2d3cc82f13d5424dd137e82d6943c4ebeffe294f1890bd'
  );
  assert.equal(byId.get('P25-PREEMPT-FAMILY-01_dossier.md').byte_length, 6484);
  assert.equal(
    byId.get('P25-IA-01_mechanism_dossier-4.md').sha256,
    '2157da884d15ceb174ba950b92f2499d110ff9c909e772e5737ae6f5a662e46c'
  );
  assert.equal(byId.get('P25-IA-01_mechanism_dossier-4.md').byte_length, 12185);
});

test('rejects an attempt to smuggle an upstream object binding into source-manifest custody', () => {
  const entry = structuredClone(sourceManifest.entries[0]);
  entry.upstream_platform = 'rosetta';
  entry.upstream_object_type = 'source_document';
  entry.upstream_object_id = 'invented';
  assert.throws(
    () => buildSourceArtifactCustodyRecord(sourceManifest, entry),
    /manifest_must_not_smuggle_upstream_binding/
  );
});

test('custody identity changes deterministically when source bytes change', () => {
  const original = buildSourceArtifactCustodyRecord(sourceManifest, sourceManifest.entries[0]);
  const changed = structuredClone(sourceManifest.entries[0]);
  changed.sha256 = 'f'.repeat(64);
  const next = buildSourceArtifactCustodyRecord(sourceManifest, changed);
  assert.notEqual(next.custody_hash, original.custody_hash);
  assert.equal(next.source_artifact_id, original.source_artifact_id);
});

test('custody ordering is locale independent and uses code-point order', () => {
  const manifest = structuredClone(sourceManifest);
  manifest.entries = structuredClone(sourceManifest.entries.slice(0, 3));
  ['z-file.md', 'A-file.md', 'a-file.md'].forEach((name, index) => {
    manifest.entries[index].source_file_name = name;
  });
  const observed = buildSourceArtifactCustodyManifest(manifest);
  assert.deepEqual(observed.custody_records.map((row) => row.source_artifact_id), [
    'A-file.md', 'a-file.md', 'z-file.md'
  ]);

  manifest.entries[0].source_file_name = '\u{10000}-file.md';
  manifest.entries[1].source_file_name = '\uE000-file.md';
  manifest.entries[2].source_file_name = 'z-file.md';
  const supplementary = buildSourceArtifactCustodyManifest(manifest);
  assert.deepEqual(supplementary.custody_records.map((row) => row.source_artifact_id), [
    'z-file.md', '\uE000-file.md', '\u{10000}-file.md'
  ]);
});

test('custody record builder rejects byte lengths that cannot be represented safely', () => {
  const entry = structuredClone(sourceManifest.entries[0]);
  entry.byte_length = Number.MAX_SAFE_INTEGER + 1;
  assert.throws(
    () => buildSourceArtifactCustodyRecord(sourceManifest, entry),
    /invalid_source_artifact_custody:byte_length_required/
  );
});

test('incoming custody records must satisfy all required fields and no additional fields', () => {
  const original = buildSourceArtifactCustodyRecord(sourceManifest, sourceManifest.entries[0]);
  const cases = [
    { source_artifact_id: '' },
    { source_file_name: '' },
    { custody_manifest_id: '' },
    { source_role: '' },
    { source_use_state: '' },
    { sha256: 'bogus' },
    { byte_length: -1 },
    { byte_length: 1.5 },
    { byte_length: '123' },
    { byte_length: Number.MAX_SAFE_INTEGER + 1 },
    { arbitrary_extra_field: true }
  ];
  for (const change of cases) {
    const invalid = { ...original, ...change };
    invalid.custody_hash = sha256Hex(sourceArtifactCustodyHashBasis(invalid));
    assert.throws(
      () => assertSourceArtifactCustodyRecord(invalid),
      /invalid_source_artifact_custody:/,
      JSON.stringify(change)
    );
  }
  const { source_artifact_id: _missing, ...missingId } = original;
  missingId.custody_hash = sha256Hex(sourceArtifactCustodyHashBasis(missingId));
  assert.throws(() => assertSourceArtifactCustodyRecord(missingId), /record_fields_mismatch/);
});

test('forward migration enforces one external artifact identity per append-only manifest', async () => {
  const uniqueMigration = await readFile(
    new URL('../supabase/migrations/20261018093000_kaleidoscope_custody_identity_unique.sql', import.meta.url),
    'utf8'
  );
  assert.match(uniqueMigration, /group by custody_manifest_id, external_artifact_id/);
  assert.match(uniqueMigration, /having count\(\*\) > 1/);
  assert.match(uniqueMigration, /raise exception using\s+errcode = '23505'/);
  assert.match(uniqueMigration, /create unique index if not exists source_artifact_manifest_external_identity_unique/);
  assert.match(uniqueMigration, /on kaleidoscope\.source_artifact \(custody_manifest_id, external_artifact_id\)/);
  assert.doesNotMatch(uniqueMigration, /delete from|update kaleidoscope\.|drop table/i);
});

test('substrate extension separates direct custody from upstream source_binding semantics', () => {
  assert.match(migration, /create table kaleidoscope\.source_artifact/);
  assert.match(migration, /create table kaleidoscope\.state_snapshot_artifact/);
  assert.match(migration, /create table kaleidoscope\.state_component_artifact/);
  assert.doesNotMatch(migration, /upstream_platform/);
  assert.doesNotMatch(migration, /upstream_object_type/);
  assert.doesNotMatch(migration, /upstream_object_id/);
  assert.match(migration, /content_owner_state text not null check \(content_owner_state = 'not_asserted'\)/);
  assert.match(migration, /upstream_binding_state text not null check \(upstream_binding_state = 'not_declared'\)/);
});

test('custody tables are RLS-protected, service-role insert/select only, and append-only', () => {
  for (const table of ['source_artifact', 'state_snapshot_artifact', 'state_component_artifact']) {
    assert.match(migration, new RegExp(`alter table kaleidoscope\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`revoke all on kaleidoscope\\.${table} from public, anon, authenticated`));
    assert.match(migration, new RegExp(`grant select, insert on kaleidoscope\\.${table} to service_role`));
  }
  assert.doesNotMatch(migration, /grant update/i);
  assert.doesNotMatch(migration, /grant delete/i);
  assert.match(migration, /source_artifact_append_only/);
  assert.match(migration, /state_snapshot_artifact_append_only/);
  assert.match(migration, /state_component_artifact_append_only/);
  assert.match(migration, /execute function kaleidoscope\.deny_mutation\(\)/);
});

test('rollback removes only the custody extension tables, not the Kaleidoscope schema', () => {
  assert.match(rollback, /drop table if exists kaleidoscope\.state_component_artifact/);
  assert.match(rollback, /drop table if exists kaleidoscope\.state_snapshot_artifact/);
  assert.match(rollback, /drop table if exists kaleidoscope\.source_artifact/);
  assert.doesNotMatch(rollback, /drop schema/i);
});
