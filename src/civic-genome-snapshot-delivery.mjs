import { createHmac, timingSafeEqual } from 'node:crypto';
import { canonicalize } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';
import {
  CIVIC_GENOME_SOURCE_SCHEMA_ID,
  assertCivicGenomeSourceSnapshot,
  assertCivicGenomeSnapshotBinding
} from './civic-genome-snapshot-binding.mjs';

export const CIVIC_GENOME_DELIVERY_CONTRACT_ID =
  'kaleidoscope.civic_genome_snapshot_delivery.v1';
export const CIVIC_GENOME_DELIVERY_CONTRACT_VERSION = '1.0.0';
export const CIVIC_GENOME_DELIVERY_PATH = '/v1/civic-genome/snapshots/validate';
export const CIVIC_GENOME_DELIVERY_AUTH_SCHEME = 'hmac-sha256';

const HEX64 = /^[0-9a-f]{64}$/;

function fail(code, detail = '') {
  const suffix = detail ? `: ${detail}` : '';
  throw new Error(`invalid_civic_genome_delivery:${code}${suffix}`);
}

function unauthorized(code) {
  throw new Error(`unauthorized_civic_genome_delivery:${code}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('object_required', label);
  }
  return value;
}

function string(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('string_required', label);
  }
  return value;
}

function signatureBasis(body, keyId) {
  const row = record(body, 'body');
  return {
    delivery_contract_id: CIVIC_GENOME_DELIVERY_CONTRACT_ID,
    delivery_contract_version: CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
    method: 'POST',
    path: CIVIC_GENOME_DELIVERY_PATH,
    key_id: keyId,
    source_schema_id: row.source_schema_id,
    source_contract_id: row.source_contract_id,
    source_contract_version: row.source_contract_version,
    snapshot: row.snapshot
  };
}

export function signCivicGenomeDelivery(body, keyId, secret) {
  const governedKeyId = string(keyId, 'key_id');
  const governedSecret = string(secret, 'secret');
  if (Buffer.byteLength(governedSecret, 'utf8') < 32) {
    fail('secret_too_short');
  }
  return createHmac('sha256', governedSecret)
    .update(canonicalize(signatureBasis(body, governedKeyId)), 'utf8')
    .digest('hex');
}

export function verifyCivicGenomeDeliverySignature({
  body,
  keyId,
  signature,
  expectedKeyId,
  secret
}) {
  const governedKeyId = string(keyId, 'key_id');
  const governedExpectedKeyId = string(expectedKeyId, 'expected_key_id');
  if (governedKeyId !== governedExpectedKeyId) unauthorized('key_id_mismatch');
  if (typeof signature !== 'string' || !HEX64.test(signature)) {
    unauthorized('signature_format_invalid');
  }
  const expected = signCivicGenomeDelivery(body, governedKeyId, secret);
  const observedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (observedBuffer.length !== expectedBuffer.length
      || !timingSafeEqual(observedBuffer, expectedBuffer)) {
    unauthorized('signature_mismatch');
  }
  return true;
}

export function buildUnresolvedCivicGenomeBinding(snapshot) {
  const source = assertCivicGenomeSourceSnapshot(snapshot);
  const bindingBasis = {
    source_snapshot_id: source.snapshot_id,
    source_snapshot_hash: source.snapshot_hash,
    source_export_receipt_hash: source.export_receipt.export_receipt_hash
  };
  const binding = {
    binding_id: `kcg-binding-${sha256Hex(bindingBasis).slice(0, 32)}`,
    binding_version: '1.0.0',
    source_owner: 'lighthouse/civic_genome',
    source_schema_id: CIVIC_GENOME_SOURCE_SCHEMA_ID,
    source_contract_id: source.contract_id,
    source_contract_version: source.contract_version,
    source_snapshot_id: source.snapshot_id,
    source_snapshot_hash: source.snapshot_hash,
    source_export_receipt_id: source.export_receipt.export_receipt_id,
    source_export_receipt_hash: source.export_receipt.export_receipt_hash,
    source_as_of: new Date(source.as_of).toISOString(),
    source_scope: source.scope,
    source_completeness_state: source.completeness_state,
    source_component_count: source.component_count,
    component_manifest: source.components.map((component) => ({
      source_component_id: component.component_id,
      source_component_type: component.component_type,
      source_component_hash: component.component_hash,
      source_canonical_record_id: component.canonical_record_id,
      source_inclusion_state: component.inclusion_state,
      source_verification: component.source_verification,
      source_unresolved_conditions: component.unresolved_conditions,
      kaleidoscope_component_id: null,
      component_mapping_state: 'unmapped'
    })),
    verification_mapping_state: 'unmapped_source_native',
    verification_mapping_rule_id: null,
    verification_mapping_rule_version: null,
    binding_state: 'unresolved',
    binding_errors: [
      'verification_mapping_rule_not_declared',
      'source_snapshot_validated_not_persisted'
    ],
    imported_at: null,
    no_mutation: true
  };
  assertCivicGenomeSnapshotBinding(binding, source);
  return binding;
}

export function buildCivicGenomeDeliveryReceipt({ snapshot, binding, keyId }) {
  const source = assertCivicGenomeSourceSnapshot(snapshot);
  const governedBinding = assertCivicGenomeSnapshotBinding(binding, source);
  const basis = {
    delivery_contract_id: CIVIC_GENOME_DELIVERY_CONTRACT_ID,
    delivery_contract_version: CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
    validation_state: 'validated_unbound',
    authenticated: true,
    auth_scheme: CIVIC_GENOME_DELIVERY_AUTH_SCHEME,
    key_id: string(keyId, 'key_id'),
    source_schema_id: CIVIC_GENOME_SOURCE_SCHEMA_ID,
    source_contract_id: source.contract_id,
    source_contract_version: source.contract_version,
    source_snapshot_id: source.snapshot_id,
    source_snapshot_hash: source.snapshot_hash,
    source_export_receipt_id: source.export_receipt.export_receipt_id,
    source_export_receipt_hash: source.export_receipt.export_receipt_hash,
    source_component_count: source.component_count,
    source_completeness_state: source.completeness_state,
    binding_id: governedBinding.binding_id,
    binding_hash: sha256Hex(governedBinding),
    binding_state: governedBinding.binding_state,
    binding_errors: [...governedBinding.binding_errors].sort(),
    verification_mapping_state: governedBinding.verification_mapping_state,
    persisted: false,
    projection_executed: false,
    no_mutation: true
  };
  const receiptHash = sha256Hex(basis);
  return {
    ...basis,
    delivery_receipt_id: `kcg-delivery-${receiptHash.slice(0, 32)}`,
    delivery_receipt_hash: receiptHash
  };
}

export function validateAuthenticatedCivicGenomeDelivery({
  body,
  keyId,
  signature,
  expectedKeyId,
  secret
}) {
  const row = record(body, 'body');
  if (row.delivery_contract_id !== CIVIC_GENOME_DELIVERY_CONTRACT_ID) {
    fail('delivery_contract_id_mismatch');
  }
  if (row.delivery_contract_version !== CIVIC_GENOME_DELIVERY_CONTRACT_VERSION) {
    fail('delivery_contract_version_mismatch');
  }
  if (row.source_schema_id !== CIVIC_GENOME_SOURCE_SCHEMA_ID) {
    fail('source_schema_id_mismatch');
  }
  verifyCivicGenomeDeliverySignature({
    body: row,
    keyId,
    signature,
    expectedKeyId,
    secret
  });
  const snapshot = assertCivicGenomeSourceSnapshot(row.snapshot);
  if (row.source_contract_id !== snapshot.contract_id) {
    fail('source_contract_id_mismatch');
  }
  if (row.source_contract_version !== snapshot.contract_version) {
    fail('source_contract_version_mismatch');
  }
  const binding = buildUnresolvedCivicGenomeBinding(snapshot);
  return buildCivicGenomeDeliveryReceipt({ snapshot, binding, keyId });
}
