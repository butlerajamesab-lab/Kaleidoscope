import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const receipt = JSON.parse(readFileSync(
  new URL('../docs/receipts/CIVIC_GENOME_KALEIDOSCOPE_AUTHENTICATED_HANDOFF_HB2487_2026-08-04.json', import.meta.url),
  'utf8'
));

test('authenticated HB2487 handoff remains validated, unresolved, and non-persistent', () => {
  assert.equal(receipt.proof_state, 'completed');
  assert.equal(receipt.authentication.scheme, 'hmac-sha256');
  assert.equal(receipt.authentication.canonical_envelope_authenticated, true);
  assert.equal(receipt.kaleidoscope_receiver.response_status, 200);
  assert.equal(receipt.source_snapshot.component_count, 62);
  assert.match(receipt.source_snapshot.snapshot_hash, /^[0-9a-f]{64}$/);
  assert.match(receipt.delivery_receipt.delivery_receipt_hash, /^[0-9a-f]{64}$/);
  assert.equal(receipt.delivery_receipt.validation_state, 'validated_unbound');
  assert.equal(receipt.binding.binding_state, 'unresolved');
  assert.equal(receipt.binding.verification_mapping_state, 'unmapped_source_native');
  assert.deepEqual(receipt.binding.binding_errors, [
    'source_snapshot_validated_not_persisted',
    'verification_mapping_rule_not_declared'
  ]);
  assert.equal(receipt.write_and_execution_boundary.lighthouse_database_write_count, 0);
  assert.equal(receipt.write_and_execution_boundary.kaleidoscope_persisted, false);
  assert.equal(receipt.write_and_execution_boundary.kaleidoscope_projection_executed, false);
  assert.equal(receipt.write_and_execution_boundary.upstream_mutation, false);
});

test('the failed temporal attempt and one-time credential cleanup remain explicit', () => {
  assert.equal(receipt.initial_failed_attempt.receiver_request_sent, false);
  assert.equal(receipt.initial_failed_attempt.delivery_receipt_created, false);
  assert.equal(receipt.initial_failed_attempt.database_write_count, 0);
  assert.equal(receipt.lighthouse_sender.handoff_reran_after_cleanup, false);
  assert.equal(receipt.kaleidoscope_receiver.temporary_credentials_cleared, true);
  assert.equal(receipt.kaleidoscope_receiver.cleanup_root_probe_status, 200);
});
