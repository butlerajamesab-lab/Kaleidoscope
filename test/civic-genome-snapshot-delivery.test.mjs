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
  signCivicGenomeDelivery,
  validateAuthenticatedCivicGenomeDelivery
} from '../src/civic-genome-snapshot-delivery.mjs';

const KEY_ID = 'lighthouse-civic-genome-v1';
const SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function sourceSnapshot() {
  const component = {
    component_id: 'civic_genome:family:a9620a24-9ae4-487d-a55b-5e646c729432',
    component_type: 'family',
    canonical_record_id: 'a9620a24-9ae4-487d-a55b-5e646c729432',
    inclusion_state: 'current',
    jurisdiction_code: null,
    temporal_scope: '2026-08-03T22:01:51.000Z',
    value: {
      family_key: 'finance:concerning_taxes_imposed_on_insurers_operating_within_the_state',
      family_status: 'active',
      active_state_count: 1,
      enacted_state_count: 1
    },
    source_bindings: [{
      owner_service: 'civic_genome',
      record_type: 'civic_genome_family',
      record_id: 'a9620a24-9ae4-487d-a55b-5e646c729432',
      receipt_id: null,
      content_hash: '1'.repeat(64),
      engine_id: 'civic_genome_family_resolver',
      engine_version: 'weighted-confirmed-traits-v2',
      rule_id: 'docket_title_policy_domain_signature_v1',
      rule_version: '1'
    }],
    source_verification: [{
      owner_service: 'civic_genome',
      state: 'active',
      receipt_id: null,
      evidence_hash: '1'.repeat(64),
      mapping_state: 'source_native_preserved'
    }],
    unresolved_conditions: []
  };
  component.component_hash = sha256Hex(civicGenomeSourceComponentHashBasis(component));

  const snapshot = {
    contract_id: 'civic_genome.external_snapshot.v1',
    contract_version: '1.0.0',
    canonical_owner: 'lighthouse/civic_genome',
    snapshot_id: 'cg-family-snapshot-proof',
    snapshot_kind: 'baseline_export',
    immutable: true,
    scope: {
      scope_type: 'family',
      scope_ids: ['a9620a24-9ae4-487d-a55b-5e646c729432'],
      jurisdiction_codes: ['WA']
    },
    as_of: '2026-08-03T22:24:00.000Z',
    methodology_version: 'civic_genome_external_family_snapshot.1.0.0',
    components: [component],
    component_count: 1,
    unresolved_conditions: [],
    excluded_component_types: ['comparison_matrix', 'comparison_state_cell'],
    completeness_state: 'bounded_complete',
    snapshot_hash: '0'.repeat(64),
    export_receipt: {
      export_receipt_id: 'pending',
      export_receipt_hash: '0'.repeat(64),
      snapshot_hash: '0'.repeat(64),
      deterministic_replay_key: '0'.repeat(64),
      replay_state: 'original',
      source_commit_sha: '614294c36eddac4aad0acdb22bfb004599e73682',
      generated_at: '2026-08-03T22:25:00.000Z'
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

test('authenticates and validates a source snapshot without accepting or persisting it', () => {
  const body = delivery();
  const signature = signCivicGenomeDelivery(body, KEY_ID, SECRET);
  const receipt = validateAuthenticatedCivicGenomeDelivery({
    body,
    keyId: KEY_ID,
    signature,
    expectedKeyId: KEY_ID,
    secret: SECRET
  });

  assert.equal(receipt.validation_state, 'validated_unbound');
  assert.equal(receipt.authenticated, true);
  assert.equal(receipt.binding_state, 'unresolved');
  assert.equal(receipt.verification_mapping_state, 'unmapped_source_native');
  assert.deepEqual(receipt.binding_errors, [
    'source_snapshot_validated_not_persisted',
    'verification_mapping_rule_not_declared'
  ]);
  assert.equal(receipt.persisted, false);
  assert.equal(receipt.projection_executed, false);
  assert.equal(receipt.no_mutation, true);
});

test('produces one deterministic receipt for the same authenticated source state', () => {
  const body = delivery();
  const signature = signCivicGenomeDelivery(body, KEY_ID, SECRET);
  const first = validateAuthenticatedCivicGenomeDelivery({
    body,
    keyId: KEY_ID,
    signature,
    expectedKeyId: KEY_ID,
    secret: SECRET
  });
  const second = validateAuthenticatedCivicGenomeDelivery({
    body: structuredClone(body),
    keyId: KEY_ID,
    signature,
    expectedKeyId: KEY_ID,
    secret: SECRET
  });
  assert.deepEqual(first, second);
  assert.match(first.delivery_receipt_hash, /^[0-9a-f]{64}$/);
});

test('rejects source modification beneath the original HMAC signature', () => {
  const body = delivery();
  const signature = signCivicGenomeDelivery(body, KEY_ID, SECRET);
  const modified = structuredClone(body);
  modified.snapshot.components[0].value.active_state_count = 2;
  assert.throws(
    () => validateAuthenticatedCivicGenomeDelivery({
      body: modified,
      keyId: KEY_ID,
      signature,
      expectedKeyId: KEY_ID,
      secret: SECRET
    }),
    /unauthorized_civic_genome_delivery:signature_mismatch/
  );
});

test('rejects an unknown key identity before source validation', () => {
  const body = delivery();
  const signature = signCivicGenomeDelivery(body, KEY_ID, SECRET);
  assert.throws(
    () => validateAuthenticatedCivicGenomeDelivery({
      body,
      keyId: 'unknown-key',
      signature,
      expectedKeyId: KEY_ID,
      secret: SECRET
    }),
    /unauthorized_civic_genome_delivery:key_id_mismatch/
  );
});
