import { sha256Hex } from './hash.mjs';

export const CIVIC_GENOME_SOURCE_SCHEMA_ID =
  'https://luminari.org/civic-genome/contracts/external-snapshot.v1.schema.json';
export const CIVIC_GENOME_SOURCE_CONTRACT_ID = 'civic_genome.external_snapshot.v1';
export const CIVIC_GENOME_SOURCE_CONTRACT_VERSION = '1.0.0';

const HEX64 = /^[0-9a-f]{64}$/;
const COMPONENT_TYPES = new Set([
  'family',
  'bill',
  'trait',
  'relationship',
  'lineage_edge',
  'event',
  'momentum_component',
  'momentum_snapshot',
  'comparison_matrix',
  'comparison_state_cell',
  'unresolved_family_candidate'
]);

function fail(code, detail = '') {
  const suffix = detail ? `: ${detail}` : '';
  throw new Error(`invalid_civic_genome_snapshot_binding:${code}${suffix}`);
}

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object_required', label);
  return value;
}

function string(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('string_required', label);
  return value;
}

function nullableString(value, label) {
  if (value === null) return null;
  return string(value, label);
}

function hex64(value, label) {
  const candidate = string(value, label);
  if (!HEX64.test(candidate)) fail('sha256_required', label);
  return candidate;
}

function array(value, label) {
  if (!Array.isArray(value)) fail('array_required', label);
  return value;
}

function uniqueStrings(value, label) {
  const rows = array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
  if (new Set(rows).size !== rows.length) fail('unique_values_required', label);
  return rows;
}

function iso(value, label) {
  const candidate = string(value, label);
  if (!Number.isFinite(Date.parse(candidate))) fail('iso_timestamp_required', label);
  return new Date(candidate).toISOString();
}

function sortBindings(bindings) {
  return [...bindings].sort((left, right) =>
    [left.owner_service, left.record_type, left.record_id, left.receipt_id ?? ''].join('\u0000')
      .localeCompare([right.owner_service, right.record_type, right.record_id, right.receipt_id ?? ''].join('\u0000'))
  );
}

function sortVerification(states) {
  return [...states].sort((left, right) =>
    [left.owner_service, left.state, left.receipt_id ?? ''].join('\u0000')
      .localeCompare([right.owner_service, right.state, right.receipt_id ?? ''].join('\u0000'))
  );
}

export function civicGenomeSourceComponentHashBasis(component) {
  const row = record(component, 'component');
  return {
    component_id: string(row.component_id, 'component.component_id'),
    component_type: string(row.component_type, 'component.component_type'),
    canonical_record_id: string(row.canonical_record_id, 'component.canonical_record_id'),
    inclusion_state: string(row.inclusion_state, 'component.inclusion_state'),
    jurisdiction_code: row.jurisdiction_code === null
      ? null
      : string(row.jurisdiction_code, 'component.jurisdiction_code'),
    temporal_scope: row.temporal_scope === null
      ? null
      : string(row.temporal_scope, 'component.temporal_scope'),
    value: row.value,
    source_bindings: sortBindings(array(row.source_bindings, 'component.source_bindings')),
    source_verification: sortVerification(array(row.source_verification, 'component.source_verification')),
    unresolved_conditions: uniqueStrings(
      row.unresolved_conditions,
      'component.unresolved_conditions'
    ).sort()
  };
}

export function civicGenomeSourceSnapshotHashBasis(snapshot) {
  const row = record(snapshot, 'snapshot');
  const scope = record(row.scope, 'snapshot.scope');
  const components = array(row.components, 'snapshot.components')
    .map((component) => ({
      ...civicGenomeSourceComponentHashBasis(component),
      component_hash: hex64(component.component_hash, 'component.component_hash')
    }))
    .sort((left, right) => left.component_id.localeCompare(right.component_id));
  return {
    contract_id: string(row.contract_id, 'snapshot.contract_id'),
    contract_version: string(row.contract_version, 'snapshot.contract_version'),
    canonical_owner: string(row.canonical_owner, 'snapshot.canonical_owner'),
    snapshot_id: string(row.snapshot_id, 'snapshot.snapshot_id'),
    snapshot_kind: string(row.snapshot_kind, 'snapshot.snapshot_kind'),
    immutable: row.immutable,
    scope: {
      scope_type: string(scope.scope_type, 'snapshot.scope.scope_type'),
      scope_ids: uniqueStrings(scope.scope_ids, 'snapshot.scope.scope_ids').sort(),
      jurisdiction_codes: uniqueStrings(
        scope.jurisdiction_codes,
        'snapshot.scope.jurisdiction_codes'
      ).sort()
    },
    as_of: iso(row.as_of, 'snapshot.as_of'),
    methodology_version: string(row.methodology_version, 'snapshot.methodology_version'),
    components,
    component_count: row.component_count,
    unresolved_conditions: uniqueStrings(
      row.unresolved_conditions,
      'snapshot.unresolved_conditions'
    ).sort(),
    excluded_component_types: uniqueStrings(
      row.excluded_component_types,
      'snapshot.excluded_component_types'
    ).sort(),
    completeness_state: string(row.completeness_state, 'snapshot.completeness_state')
  };
}

export function civicGenomeExportReceiptHashBasis(snapshot) {
  const row = record(snapshot, 'snapshot');
  const receipt = record(row.export_receipt, 'snapshot.export_receipt');
  return {
    export_receipt_id: string(receipt.export_receipt_id, 'export_receipt.export_receipt_id'),
    snapshot_hash: hex64(receipt.snapshot_hash, 'export_receipt.snapshot_hash'),
    deterministic_replay_key: hex64(
      receipt.deterministic_replay_key,
      'export_receipt.deterministic_replay_key'
    ),
    source_commit_sha: receipt.source_commit_sha === null
      ? null
      : string(receipt.source_commit_sha, 'export_receipt.source_commit_sha')
  };
}

export function assertCivicGenomeSourceSnapshot(snapshot) {
  const row = record(snapshot, 'snapshot');
  if (row.contract_id !== CIVIC_GENOME_SOURCE_CONTRACT_ID) fail('source_contract_id_mismatch');
  if (row.contract_version !== CIVIC_GENOME_SOURCE_CONTRACT_VERSION) fail('source_contract_version_mismatch');
  if (row.canonical_owner !== 'lighthouse/civic_genome') fail('source_owner_mismatch');
  if (row.snapshot_kind !== 'baseline_export') fail('snapshot_kind_mismatch');
  if (row.immutable !== true) fail('snapshot_not_immutable');

  const components = array(row.components, 'snapshot.components');
  if (!Number.isInteger(row.component_count) || row.component_count !== components.length) {
    fail('component_count_mismatch');
  }
  const componentIds = components.map((component, index) => {
    const componentRow = record(component, `snapshot.components[${index}]`);
    const componentId = string(componentRow.component_id, `snapshot.components[${index}].component_id`);
    if (!componentId.startsWith('civic_genome:')) fail('component_namespace_mismatch', componentId);
    const componentType = string(
      componentRow.component_type,
      `snapshot.components[${index}].component_type`
    );
    if (!COMPONENT_TYPES.has(componentType)) fail('component_type_not_governed', componentType);
    const observedHash = hex64(
      componentRow.component_hash,
      `snapshot.components[${index}].component_hash`
    );
    const expectedHash = sha256Hex(civicGenomeSourceComponentHashBasis(componentRow));
    if (observedHash !== expectedHash) fail('component_hash_mismatch', componentId);
    return componentId;
  });
  if (new Set(componentIds).size !== componentIds.length) fail('duplicate_component_id');

  const snapshotHash = hex64(row.snapshot_hash, 'snapshot.snapshot_hash');
  const expectedSnapshotHash = sha256Hex(civicGenomeSourceSnapshotHashBasis(row));
  if (snapshotHash !== expectedSnapshotHash) fail('snapshot_hash_mismatch');

  const receipt = record(row.export_receipt, 'snapshot.export_receipt');
  if (hex64(receipt.snapshot_hash, 'export_receipt.snapshot_hash') !== snapshotHash) {
    fail('receipt_snapshot_hash_mismatch');
  }
  const expectedReplayKey = sha256Hex({
    contract_id: row.contract_id,
    contract_version: row.contract_version,
    snapshot_id: row.snapshot_id,
    snapshot_hash: snapshotHash,
    methodology_version: row.methodology_version
  });
  if (hex64(receipt.deterministic_replay_key, 'export_receipt.deterministic_replay_key') !== expectedReplayKey) {
    fail('replay_key_mismatch');
  }
  const expectedReceiptHash = sha256Hex(civicGenomeExportReceiptHashBasis(row));
  if (hex64(receipt.export_receipt_hash, 'export_receipt.export_receipt_hash') !== expectedReceiptHash) {
    fail('export_receipt_hash_mismatch');
  }
  iso(receipt.generated_at, 'export_receipt.generated_at');

  return row;
}

export function assertCivicGenomeSnapshotBinding(binding, sourceSnapshot) {
  const source = assertCivicGenomeSourceSnapshot(sourceSnapshot);
  const row = record(binding, 'binding');
  if (row.source_schema_id !== CIVIC_GENOME_SOURCE_SCHEMA_ID) fail('binding_source_schema_mismatch');
  if (row.source_owner !== 'lighthouse/civic_genome') fail('binding_source_owner_mismatch');
  if (row.source_contract_id !== source.contract_id) fail('binding_source_contract_mismatch');
  if (row.source_contract_version !== source.contract_version) fail('binding_source_version_mismatch');
  if (row.source_snapshot_id !== source.snapshot_id) fail('binding_snapshot_id_mismatch');
  if (row.source_snapshot_hash !== source.snapshot_hash) fail('binding_snapshot_hash_mismatch');
  if (row.source_export_receipt_id !== source.export_receipt.export_receipt_id) {
    fail('binding_receipt_id_mismatch');
  }
  if (row.source_export_receipt_hash !== source.export_receipt.export_receipt_hash) {
    fail('binding_receipt_hash_mismatch');
  }
  if (new Date(row.source_as_of).toISOString() !== new Date(source.as_of).toISOString()) {
    fail('binding_as_of_mismatch');
  }
  if (row.source_component_count !== source.component_count) fail('binding_component_count_mismatch');
  if (row.no_mutation !== true) fail('binding_mutation_not_prohibited');

  const sourceById = new Map(source.components.map((component) => [component.component_id, component]));
  const manifest = array(row.component_manifest, 'binding.component_manifest');
  if (manifest.length !== source.component_count) fail('binding_manifest_count_mismatch');
  for (const entry of manifest) {
    const manifestRow = record(entry, 'binding.component_manifest[]');
    const sourceComponentId = string(manifestRow.source_component_id, 'source_component_id');
    const sourceComponent = sourceById.get(sourceComponentId);
    if (!sourceComponent) fail('binding_component_missing', sourceComponentId);
    if (manifestRow.source_component_hash !== sourceComponent.component_hash) {
      fail('binding_component_hash_mismatch', sourceComponentId);
    }
    if (manifestRow.source_component_type !== sourceComponent.component_type) {
      fail('binding_component_type_mismatch', sourceComponentId);
    }
    if (manifestRow.source_canonical_record_id !== sourceComponent.canonical_record_id) {
      fail('binding_canonical_record_mismatch', sourceComponentId);
    }
  }

  if (source.completeness_state === 'incomplete' && row.binding_state !== 'unresolved') {
    fail('incomplete_source_must_remain_unresolved');
  }
  if (row.binding_state === 'accepted') {
    if (row.verification_mapping_state !== 'mapped_by_declared_rule') {
      fail('accepted_binding_requires_verification_mapping');
    }
    if (!row.verification_mapping_rule_id || !row.verification_mapping_rule_version) {
      fail('accepted_binding_requires_mapping_rule_identity');
    }
    if (array(row.binding_errors, 'binding.binding_errors').length !== 0) {
      fail('accepted_binding_cannot_have_errors');
    }
  }
  return row;
}
