import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIVIC_GENOME_VERIFICATION_MAPPING_RULE_ID,
  CIVIC_GENOME_VERIFICATION_MAPPING_RULE_VERSION,
  mapCivicGenomeVerificationState
} from '../src/civic-genome-verification-mapping.mjs';

function source(owner_service, state) {
  return {
    owner_service,
    state,
    receipt_id: null,
    evidence_hash: 'a'.repeat(64),
    mapping_state: 'source_native_preserved'
  };
}

test('maps Prism structural statuses without manufacturing primary verification', () => {
  const supported = mapCivicGenomeVerificationState(source('prism', 'supported_by_one_source'));
  const contradicted = mapCivicGenomeVerificationState(source('prism', 'contradicted'));
  const incomplete = mapCivicGenomeVerificationState(source('prism', 'incomplete'));

  assert.equal(supported.mapped_verification_state, 'primary_adjacent');
  assert.equal(contradicted.mapped_verification_state, 'contradicted');
  assert.equal(incomplete.mapped_verification_state, 'unresolved');
  assert.notEqual(supported.mapped_verification_state, 'primary_verified');
});

test('treats Rosetta complete as primary-adjacent derived evidence only', () => {
  const mapped = mapCivicGenomeVerificationState(source('rosetta', 'complete'));
  assert.equal(mapped.mapped_verification_state, 'primary_adjacent');
  assert.match(mapped.mapping_reason, /never_promoted_to_primary_verified/);
});

test('keeps Docket and Civic Genome status states locator-only', () => {
  assert.equal(
    mapCivicGenomeVerificationState(source('docket', 'Enrolled')).mapped_verification_state,
    'locator_only'
  );
  assert.equal(
    mapCivicGenomeVerificationState(source('civic_genome', 'enacted')).mapped_verification_state,
    'locator_only'
  );
});

test('preserves unknown and negative states as unresolved', () => {
  assert.equal(
    mapCivicGenomeVerificationState(source('civic_genome', 'human_review_required')).mapped_verification_state,
    'unresolved'
  );
  assert.equal(
    mapCivicGenomeVerificationState(source('unknown_owner', 'apparently_good')).mapped_verification_state,
    'unresolved'
  );
});

test('rejects already-remapped input to prevent crosswalk chaining', () => {
  const entry = source('prism', 'supported_by_one_source');
  entry.mapping_state = 'already_mapped';
  assert.throws(
    () => mapCivicGenomeVerificationState(entry),
    /source_state_must_be_native_preserved/
  );
});

test('pins rule identity', () => {
  assert.equal(
    CIVIC_GENOME_VERIFICATION_MAPPING_RULE_ID,
    'kaleidoscope.civic_genome_verification_mapping'
  );
  assert.equal(CIVIC_GENOME_VERIFICATION_MAPPING_RULE_VERSION, '1.0.0');
});
