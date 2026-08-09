import { canonicalValue } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';

export const SOURCE_ARTIFACT_CUSTODY_CONTRACT_ID =
  'https://luminari.org/kaleidoscope/contracts/source-artifact-custody.v1.json';
export const SOURCE_ARTIFACT_CUSTODY_CONTRACT_VERSION = '1.0.0';

function fail(code, detail = '') {
  throw new Error(`invalid_source_artifact_custody:${code}${detail ? `:${detail}` : ''}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object_required', label);
  return value;
}

function string(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('string_required', label);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) fail('array_required', label);
  return value;
}

export function sourceArtifactCustodyHashBasis(custodyRecord) {
  const row = record(custodyRecord, 'custody_record');
  const { custody_hash: _ignored, ...basis } = row;
  return basis;
}

export function buildSourceArtifactCustodyRecord(manifest, entry) {
  const sourceManifest = canonicalValue(record(manifest, 'source_manifest'));
  const source = canonicalValue(record(entry, 'source_manifest_entry'));
  const manifestId = string(sourceManifest.manifest_id, 'source_manifest.manifest_id');
  const fileName = string(source.source_file_name, 'source_file_name');
  const hash = string(source.sha256, 'sha256');
  if (!/^[0-9a-f]{64}$/.test(hash)) fail('sha256_required', fileName);
  if (!Number.isInteger(source.byte_length) || source.byte_length < 0) {
    fail('byte_length_required', fileName);
  }
  string(source.source_role, 'source_role');
  string(source.source_use_state, 'source_use_state');

  for (const prohibited of ['upstream_platform', 'upstream_object_type', 'upstream_object_id']) {
    if (prohibited in source) fail('manifest_must_not_smuggle_upstream_binding', `${fileName}:${prohibited}`);
  }

  const basis = {
    custody_contract_version: SOURCE_ARTIFACT_CUSTODY_CONTRACT_VERSION,
    custody_record_kind: 'source_artifact_custody',
    custody_manifest_id: manifestId,
    source_artifact_id: fileName,
    source_file_name: fileName,
    sha256: hash,
    byte_length: source.byte_length,
    source_role: source.source_role,
    source_use_state: source.source_use_state,
    custody_scope: 'artifact_identity_and_provenance_only',
    content_owner_state: 'not_asserted',
    upstream_binding_state: 'not_declared',
    upstream_platform: null,
    upstream_object_type: null,
    upstream_object_id: null,
    no_upstream_ownership_inference: true
  };
  return { ...basis, custody_hash: sha256Hex(basis) };
}

export function buildSourceArtifactCustodyManifest(sourceManifest) {
  const manifest = canonicalValue(record(sourceManifest, 'source_manifest'));
  const entries = array(manifest.entries, 'source_manifest.entries');
  const custodyRecords = entries.map((entry) => buildSourceArtifactCustodyRecord(manifest, entry));
  custodyRecords.sort((a, b) => a.source_artifact_id.localeCompare(b.source_artifact_id));

  const ids = custodyRecords.map((entry) => entry.source_artifact_id);
  if (new Set(ids).size !== ids.length) fail('duplicate_source_artifact_id');

  const basis = {
    custody_manifest_version: '1.0.0',
    source_manifest_id: string(manifest.manifest_id, 'source_manifest.manifest_id'),
    source_artifact_count: custodyRecords.length,
    custody_records: custodyRecords,
    content_ownership_asserted: false,
    upstream_object_bindings_created: 0,
    no_upstream_ownership_inference: true
  };
  return { ...basis, custody_manifest_hash: sha256Hex(basis) };
}

export function assertSourceArtifactCustodyRecord(custodyRecord) {
  const row = canonicalValue(record(custodyRecord, 'custody_record'));
  if (row.custody_contract_version !== '1.0.0') fail('custody_version_mismatch');
  if (row.custody_record_kind !== 'source_artifact_custody') fail('custody_kind_mismatch');
  if (row.custody_scope !== 'artifact_identity_and_provenance_only') fail('custody_scope_mismatch');
  if (row.content_owner_state !== 'not_asserted') fail('content_owner_state_mismatch');
  if (row.upstream_binding_state !== 'not_declared') fail('upstream_binding_state_mismatch');
  if (row.upstream_platform !== null || row.upstream_object_type !== null || row.upstream_object_id !== null) {
    fail('upstream_binding_must_remain_null');
  }
  if (row.no_upstream_ownership_inference !== true) fail('ownership_inference_prohibition_missing');
  if (row.custody_hash !== sha256Hex(sourceArtifactCustodyHashBasis(row))) fail('custody_hash_mismatch');
  return row;
}
