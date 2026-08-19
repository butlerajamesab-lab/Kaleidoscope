export const CIVIC_GENOME_VERIFICATION_MAPPING_RULE_ID =
  'kaleidoscope.civic_genome_verification_mapping';
export const CIVIC_GENOME_VERIFICATION_MAPPING_RULE_VERSION = '1.0.0';

const PRISM_MAP = new Map([
  ['supported_by_one_source', 'primary_adjacent'],
  ['contradicted', 'contradicted'],
  ['incomplete', 'unresolved']
]);

const ROSETTA_POSITIVE_STATES = new Set(['complete', 'confirmed', 'verified']);
const UNRESOLVED_TOKENS = [
  'unresolved',
  'unknown',
  'rejected',
  'failure',
  'failed',
  'unavailable',
  'incomplete',
  'human_review'
];

function fail(code, detail = '') {
  const suffix = detail ? `:${detail}` : '';
  throw new Error(`invalid_civic_genome_verification_mapping:${code}${suffix}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('object_required', label);
  }
  return value;
}

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('string_required', label);
  }
  return value;
}

function containsUnresolvedToken(state) {
  const normalized = state.toLowerCase();
  return UNRESOLVED_TOKENS.some((token) => normalized.includes(token));
}

export function mapCivicGenomeVerificationState(value) {
  const entry = record(value, 'verification');
  const ownerService = text(entry.owner_service, 'owner_service');
  const sourceState = text(entry.state, 'state');
  if (entry.mapping_state !== 'source_native_preserved') {
    fail('source_state_must_be_native_preserved', `${ownerService}:${sourceState}`);
  }

  let mappedVerificationState = 'unresolved';
  let mappingReason = 'unrecognized_source_state_preserved_as_unresolved';

  if (ownerService === 'prism') {
    mappedVerificationState = PRISM_MAP.get(sourceState) ?? 'unresolved';
    mappingReason = PRISM_MAP.has(sourceState)
      ? 'prism_structural_verification_crosswalk'
      : 'unrecognized_prism_state_preserved_as_unresolved';
  } else if (ownerService === 'rosetta') {
    mappedVerificationState = ROSETTA_POSITIVE_STATES.has(sourceState)
      ? 'primary_adjacent'
      : 'unresolved';
    mappingReason = ROSETTA_POSITIVE_STATES.has(sourceState)
      ? 'rosetta_primary_source_derived_state_never_promoted_to_primary_verified'
      : 'rosetta_state_preserved_as_unresolved';
  } else if (ownerService === 'docket' || ownerService === 'civic_genome') {
    mappedVerificationState = containsUnresolvedToken(sourceState)
      ? 'unresolved'
      : 'locator_only';
    mappingReason = mappedVerificationState === 'locator_only'
      ? 'status_or_identity_state_not_treated_as_substantive_verification'
      : 'status_or_identity_uncertainty_preserved';
  }

  return {
    source_owner_service: ownerService,
    source_state: sourceState,
    source_receipt_id: entry.receipt_id ?? null,
    source_evidence_hash: entry.evidence_hash ?? null,
    source_mapping_state: entry.mapping_state,
    mapped_verification_state: mappedVerificationState,
    mapping_rule_id: CIVIC_GENOME_VERIFICATION_MAPPING_RULE_ID,
    mapping_rule_version: CIVIC_GENOME_VERIFICATION_MAPPING_RULE_VERSION,
    mapping_reason: mappingReason
  };
}

export function mapCivicGenomeComponentVerification(component) {
  const row = record(component, 'component');
  if (!Array.isArray(row.source_verification)) {
    fail('source_verification_array_required');
  }
  return row.source_verification.map(mapCivicGenomeVerificationState);
}

export function civicGenomeSnapshotBindingEligibility(snapshot) {
  const row = record(snapshot, 'snapshot');
  if (!Array.isArray(row.unresolved_conditions)) {
    fail('snapshot_unresolved_conditions_array_required');
  }
  const errors = [];
  if (row.completeness_state !== 'bounded_complete') {
    errors.push('source_snapshot_not_bounded_complete');
  }
  if (row.unresolved_conditions.length > 0) {
    errors.push('source_snapshot_has_unresolved_conditions');
  }
  return {
    eligible: errors.length === 0,
    errors
  };
}
