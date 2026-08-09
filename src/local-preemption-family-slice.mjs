import { executeProject2025VerticalSlice } from './project2025-vertical-slice.mjs';
import { sha256Hex } from './hash.mjs';

export const LOCAL_PREEMPTION_FAMILY_SLICE_ENGINE_ID = 'local_preemption_family_slice_adapter';
export const LOCAL_PREEMPTION_FAMILY_SLICE_ENGINE_VERSION = '1.0.0';
export const LOCAL_PREEMPTION_POLICY_FAMILY_ID = 'local_lgbtq_ordinance_preemption.v1';

function fail(code) {
  throw new Error(`invalid_local_preemption_family_slice:${code}`);
}

export function executeLocalPreemptionFamilyVerticalSlice(fixture, lensManifests) {
  if (!fixture || fixture.policy_family_id !== LOCAL_PREEMPTION_POLICY_FAMILY_ID) {
    fail('policy_family_mismatch');
  }

  const base = executeProject2025VerticalSlice(fixture, lensManifests);
  if (base.bundle.no_mutation !== true || base.bundle.database_write_count !== 0) {
    fail('source_execution_write_boundary_mismatch');
  }
  if (base.bundle.projection_claim_state !== 'not_prediction_not_canonical_fact') {
    fail('projection_claim_state_mismatch');
  }

  const { read_model_hash: _oldReadModelHash, ...baseReadModelBasis } = base.read_model;
  const readModelBasis = {
    ...baseReadModelBasis,
    title: 'Local LGBTQ-Ordinance Preemption: Cross-Jurisdiction Family',
    subtitle: 'Deterministic temporal and jurisdictional stress-test from the governed source pack',
    status: 'executed_test_fixture_not_canonical_fact'
  };
  const readModel = {
    ...readModelBasis,
    read_model_hash: sha256Hex(readModelBasis)
  };

  const receiptBasis = {
    receipt_version: '1.0.0',
    engine_id: LOCAL_PREEMPTION_FAMILY_SLICE_ENGINE_ID,
    engine_version: LOCAL_PREEMPTION_FAMILY_SLICE_ENGINE_VERSION,
    source_engine_id: base.bundle.engine_id,
    source_engine_version: base.bundle.engine_version,
    source_execution_receipt_hash: base.receipt.receipt_hash,
    scenario_id: base.bundle.scenario_id,
    policy_family_id: base.bundle.policy_family_id,
    input_hash: base.bundle.input_hash,
    diff_hash: base.bundle.diff.output_hash,
    projection_bundle_hash: base.bundle.projection_bundle_hash,
    read_model_hash: readModel.read_model_hash,
    projection_claim_state: base.bundle.projection_claim_state,
    no_mutation: true,
    database_write_count: 0
  };
  const receiptHash = sha256Hex(receiptBasis);
  const receipt = {
    ...receiptBasis,
    run_id: `preempt-run-${receiptHash.slice(0, 32)}`,
    deterministic_replay_key: sha256Hex({
      input_hash: base.bundle.input_hash,
      source_engine_version: base.bundle.engine_version,
      adapter_engine_version: LOCAL_PREEMPTION_FAMILY_SLICE_ENGINE_VERSION
    }),
    receipt_hash: receiptHash
  };

  return {
    bundle: base.bundle,
    read_model: readModel,
    receipt,
    source_execution_receipt: base.receipt
  };
}
