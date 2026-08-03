import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex } from '../src/hash.mjs';
import {
  CIVIC_GENOME_SOURCE_SCHEMA_ID,
  assertCivicGenomeSourceSnapshot,
  assertCivicGenomeSnapshotBinding,
  civicGenomeExportReceiptHashBasis,
  civicGenomeSourceComponentHashBasis,
  civicGenomeSourceSnapshotHashBasis
} from '../src/civic-genome-snapshot-binding.mjs';

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
      source_commit_sha: 'c23f4fc6d1904ef16eb186fcece8813c1a33a03d',
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

function bindingFor(snapshot) {
  return {
    binding_id: 'hb2487-family-binding-proof',
    binding_version: '1.0.0',
    source_owner: 'lighthouse/civic_genome',
    source_schema_id: CIVIC_GENOME_SOURCE_SCHEMA_ID,
    source_contract_id: snapshot.contract_id,
    source_contract_version: snapshot.contract_version,
    source_snapshot_id: snapshot.snapshot_id,
    source_snapshot_hash: snapshot.snapshot_hash,
    source_export_receipt_id: snapshot.export_receipt.export_receipt_id,
    source_export_receipt_hash: snapshot.export_receipt.export_receipt_hash,
    source_as_of: snapshot.as_of,
    source_scope: snapshot.scope,
    source_completeness_state: snapshot.completeness_state,
    source_component_count: snapshot.component_count,
    component_manifest: snapshot.components.map((component) => ({
      source_component_id: component.component_id,
      source_component_type: component.component_type,
      source_component_hash: component.component_hash,
      source_canonical_record_id: component.canonical_record_id,
      source_inclusion_state: component.inclusion_state,
      source_verification: component.source_verification,
      source_unresolved_conditions: component.unresolved_conditions,
      kaleidoscope_component_id: `kaleidoscope:${component.component_type}:${component.canonical_record_id}`,
      component_mapping_state: 'mapped_by_declared_rule'
    })),
    verification_mapping_state: 'mapped_by_declared_rule',
    verification_mapping_rule_id: 'civic_genome_source_native_verification.v1',
    verification_mapping_rule_version: '1.0.0',
    binding_state: 'accepted',
    binding_errors: [],
    imported_at: '2026-08-03T22:26:00.000Z',
    no_mutation: true
  };
}

test('accepts a fully hashed immutable Civic Genome snapshot and binding', () => {
  const source = sourceSnapshot();
  const binding = bindingFor(source);
  assert.equal(assertCivicGenomeSourceSnapshot(source), source);
  assert.equal(assertCivicGenomeSnapshotBinding(binding, source), binding);
});

test('rejects a modified component that retains the original hashes and receipt', () => {
  const source = sourceSnapshot();
  const modified = structuredClone(source);
  modified.components[0].value.active_state_count = 2;
  assert.throws(
    () => assertCivicGenomeSourceSnapshot(modified),
    /component_hash_mismatch/
  );
});

test('rejects a rehashed component when the enclosing snapshot hash is stale', () => {
  const source = sourceSnapshot();
  const modified = structuredClone(source);
  modified.components[0].value.active_state_count = 2;
  modified.components[0].component_hash = sha256Hex(
    civicGenomeSourceComponentHashBasis(modified.components[0])
  );
  assert.throws(
    () => assertCivicGenomeSourceSnapshot(modified),
    /snapshot_hash_mismatch/
  );
});

test('rejects a binding whose source snapshot hash was altered in transit', () => {
  const source = sourceSnapshot();
  const binding = bindingFor(source);
  binding.source_snapshot_hash = 'f'.repeat(64);
  assert.throws(
    () => assertCivicGenomeSnapshotBinding(binding, source),
    /binding_snapshot_hash_mismatch/
  );
});
