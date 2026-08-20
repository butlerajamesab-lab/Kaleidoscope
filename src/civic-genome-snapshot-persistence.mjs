import { assertCivicGenomeSourceSnapshot, assertCivicGenomeSnapshotBinding } from './civic-genome-snapshot-binding.mjs';
import { sha256Hex } from './hash.mjs';

export const CIVIC_GENOME_PERSISTENCE_ADAPTER_VERSION = '1.0.0';
export const CIVIC_GENOME_PERSISTENCE_TARGET_SCHEMA = 'kaleidoscope';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'enabled']);

function fail(code, detail = '') {
  const error = new Error(`civic_genome_persistence_failed:${code}${detail ? `:${detail}` : ''}`);
  return error;
}

function throwFailure(code, detail = '', httpStatus = null) {
  const error = fail(code, detail);
  error.httpStatus = httpStatus;
  throw error;
}

function configuredValue(env, names) {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return '';
}

function persistenceEnabled(env) {
  return ENABLED_VALUES.has(
    (env.KALEIDOSCOPE_CIVIC_GENOME_PERSISTENCE ?? env.KALEIDOSCOPE_CIVIC_GENOME_PERSISTENCE_ENABLED ?? '')
      .trim()
      .toLowerCase()
  );
}

export function civicGenomePersistenceConfiguration(env = process.env) {
  const enabled = persistenceEnabled(env);
  const supabaseUrl = configuredValue(env, [
    'KALEIDOSCOPE_SUPABASE_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL'
  ]);
  const serviceRoleKey = configuredValue(env, [
    'KALEIDOSCOPE_SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY'
  ]);
  const targetSchema = env.KALEIDOSCOPE_SUPABASE_SCHEMA?.trim() || CIVIC_GENOME_PERSISTENCE_TARGET_SCHEMA;
  const hasUrl = supabaseUrl.length > 0;
  const hasServiceRoleKey = serviceRoleKey.length > 0;
  const ready = enabled && hasUrl && hasServiceRoleKey;
  const state = !enabled
    ? 'disabled_no_write'
    : ready
      ? 'ready'
      : 'enabled_missing_database_credentials';

  return {
    adapter_version: CIVIC_GENOME_PERSISTENCE_ADAPTER_VERSION,
    target_schema: targetSchema,
    enabled,
    ready,
    state,
    has_url: hasUrl,
    has_service_role_key: hasServiceRoleKey,
    supabase_url: supabaseUrl,
    service_role_key: serviceRoleKey,
    timeout_ms: Number.parseInt(env.KALEIDOSCOPE_SUPABASE_TIMEOUT_MS ?? '15000', 10)
  };
}

function noWriteResult(state, errors = []) {
  return {
    adapter_version: CIVIC_GENOME_PERSISTENCE_ADAPTER_VERSION,
    target_schema: CIVIC_GENOME_PERSISTENCE_TARGET_SCHEMA,
    state,
    persisted: false,
    projection_executed: false,
    database_write_count: 0,
    source_binding_id: null,
    state_snapshot_id: null,
    state_component_count: 0,
    source_artifact_count: 0,
    idempotent_reuse: false,
    errors
  };
}

function endpoint(configuration, table) {
  const base = configuration.supabase_url.endsWith('/')
    ? configuration.supabase_url
    : `${configuration.supabase_url}/`;
  return new URL(`rest/v1/${table}`, base);
}

function headers(configuration, method) {
  return {
    apikey: configuration.service_role_key,
    authorization: `Bearer ${configuration.service_role_key}`,
    accept: 'application/json',
    ...(method === 'GET'
      ? { 'accept-profile': configuration.target_schema }
      : { 'content-profile': configuration.target_schema }),
    ...(method === 'POST'
      ? {
          'content-type': 'application/json',
          prefer: 'return=representation'
        }
      : {})
  };
}

function sanitizeFailureDetail(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

async function requestJson({ configuration, fetchImpl, method, table, search = {}, body = null }) {
  const url = endpoint(configuration, table);
  for (const [key, value] of Object.entries(search)) {
    url.searchParams.set(key, value);
  }
  const response = await fetchImpl(url, {
    method,
    headers: headers(configuration, method),
    body: body === null ? undefined : JSON.stringify(body),
    signal: typeof AbortSignal?.timeout === 'function'
      ? AbortSignal.timeout(configuration.timeout_ms)
      : undefined
  });
  const text = await response.text();
  if (!response.ok) {
    throwFailure(`${table}_${method.toLowerCase()}_${response.status}`, sanitizeFailureDetail(text), response.status);
  }
  return text ? JSON.parse(text) : null;
}

function equalityFilters(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, `eq.${value}`])
  );
}

async function selectOne({ configuration, fetchImpl, table, filters, select }) {
  const rows = await requestJson({
    configuration,
    fetchImpl,
    method: 'GET',
    table,
    search: {
      select,
      limit: '1',
      ...equalityFilters(filters)
    }
  });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function insertOne({ configuration, fetchImpl, table, row, select }) {
  const rows = await requestJson({
    configuration,
    fetchImpl,
    method: 'POST',
    table,
    search: { select },
    body: row
  });
  if (!Array.isArray(rows) || rows.length !== 1) {
    throwFailure(`${table}_insert_return_shape`);
  }
  return rows[0];
}

async function ensureRow({
  configuration,
  fetchImpl,
  table,
  row,
  unique,
  idColumn
}) {
  const existing = await selectOne({
    configuration,
    fetchImpl,
    table,
    filters: unique,
    select: idColumn
  });
  if (existing) {
    return {
      id: existing[idColumn],
      inserted: false
    };
  }
  let inserted;
  try {
    inserted = await insertOne({
      configuration,
      fetchImpl,
      table,
      row,
      select: idColumn
    });
  } catch (error) {
    if (error?.httpStatus !== 409) throw error;
    const racedExisting = await selectOne({
      configuration,
      fetchImpl,
      table,
      filters: unique,
      select: idColumn
    });
    if (!racedExisting) throw error;
    return {
      id: racedExisting[idColumn],
      inserted: false
    };
  }
  return {
    id: inserted[idColumn],
    inserted: true
  };
}

async function ensureLink({ configuration, fetchImpl, table, row }) {
  const existing = await selectOne({
    configuration,
    fetchImpl,
    table,
    filters: row,
    select: Object.keys(row).join(',')
  });
  if (existing) return false;
  try {
    await insertOne({
      configuration,
      fetchImpl,
      table,
      row,
      select: Object.keys(row).join(',')
    });
  } catch (error) {
    if (error?.httpStatus !== 409) throw error;
    const racedExisting = await selectOne({
      configuration,
      fetchImpl,
      table,
      filters: row,
      select: Object.keys(row).join(',')
    });
    if (!racedExisting) throw error;
    return false;
  }
  return true;
}

function snapshotKindForPersistence(snapshot) {
  if (snapshot.snapshot_kind === 'baseline_export') return 'baseline';
  throwFailure('unsupported_snapshot_kind', snapshot.snapshot_kind);
}

function asOfDate(snapshot) {
  return new Date(snapshot.as_of).toISOString().slice(0, 10);
}

function componentVerificationState(manifestEntry) {
  const mapped = manifestEntry.mapped_verification ?? [];
  const states = mapped.map((entry) => entry.mapped_verification_state);
  if (manifestEntry.source_unresolved_conditions?.length > 0) return 'unresolved';
  if (states.includes('contradicted')) return 'contradicted';
  if (states.includes('unresolved')) return 'unresolved';
  if (states.includes('primary_adjacent')) return 'primary_adjacent';
  if (states.includes('locator_only')) return 'locator_only';
  return 'unresolved';
}

function optionalText(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function componentDomain(component) {
  const value = component.value && typeof component.value === 'object' && !Array.isArray(component.value)
    ? component.value
    : {};
  return optionalText(value.domain)
    ?? optionalText(value.policy_domain)
    ?? optionalText(value.family_domain)
    ?? null;
}

function componentRows(snapshot, binding) {
  const manifestById = new Map(
    binding.component_manifest.map((entry) => [entry.source_component_id, entry])
  );
  return snapshot.components.map((component) => {
    const manifestEntry = manifestById.get(component.component_id);
    if (!manifestEntry) throwFailure('component_manifest_missing', component.component_id);
    return {
      component_id: component.component_id,
      component_type: component.component_type,
      domain: componentDomain(component),
      jurisdiction: component.jurisdiction_code,
      temporal_scope: component.temporal_scope,
      value: component.value,
      verification_state: componentVerificationState(manifestEntry),
      declared_transition: null,
      unresolved_conditions: component.unresolved_conditions,
      component_hash: component.component_hash
    };
  });
}

function persistenceReceiptHash(result, snapshot, binding) {
  return sha256Hex({
    adapter_version: result.adapter_version,
    target_schema: result.target_schema,
    state: result.state,
    source_snapshot_id: snapshot.snapshot_id,
    source_snapshot_hash: snapshot.snapshot_hash,
    binding_id: binding.binding_id,
    binding_hash: sha256Hex(binding),
    persisted: result.persisted,
    projection_executed: false,
    source_binding_id: result.source_binding_id,
    state_snapshot_id: result.state_snapshot_id,
    state_component_count: result.state_component_count,
    source_artifact_count: result.source_artifact_count,
    database_write_count: result.database_write_count,
    idempotent_reuse: result.idempotent_reuse
  });
}

export async function persistCivicGenomeSnapshot({
  snapshot,
  binding,
  configuration = civicGenomePersistenceConfiguration(),
  fetchImpl = globalThis.fetch
}) {
  const source = assertCivicGenomeSourceSnapshot(snapshot);
  const governedBinding = assertCivicGenomeSnapshotBinding(binding, source);
  if (governedBinding.binding_state !== 'accepted') {
    return noWriteResult('binding_unresolved_not_persisted', governedBinding.binding_errors);
  }
  if (!configuration.enabled) {
    return noWriteResult('disabled_no_write');
  }
  if (!configuration.ready) {
    return noWriteResult('enabled_missing_database_credentials', [
      configuration.has_url ? null : 'supabase_url_missing',
      configuration.has_service_role_key ? null : 'service_role_key_missing'
    ].filter(Boolean));
  }
  if (typeof fetchImpl !== 'function') throwFailure('fetch_unavailable');

  let databaseWriteCount = 0;
  const sourceBinding = await ensureRow({
    configuration,
    fetchImpl,
    table: 'source_binding',
    idColumn: 'source_binding_id',
    unique: {
      upstream_platform: 'lighthouse/civic_genome',
      upstream_object_type: 'external_snapshot',
      upstream_object_id: source.snapshot_id,
      upstream_hash: source.snapshot_hash
    },
    row: {
      upstream_platform: 'lighthouse/civic_genome',
      upstream_object_type: 'external_snapshot',
      upstream_object_id: source.snapshot_id,
      upstream_version: `${source.contract_id}@${source.contract_version}:${source.methodology_version}`,
      upstream_hash: source.snapshot_hash,
      verification_state: governedBinding.verification_mapping_state
    }
  });
  if (sourceBinding.inserted) databaseWriteCount += 1;

  const stateSnapshot = await ensureRow({
    configuration,
    fetchImpl,
    table: 'state_snapshot',
    idColumn: 'state_snapshot_id',
    unique: { external_snapshot_id: source.snapshot_id },
    row: {
      external_snapshot_id: source.snapshot_id,
      snapshot_kind: snapshotKindForPersistence(source),
      as_of_date: asOfDate(source),
      jurisdiction_scope: source.scope,
      unresolved_conditions: source.unresolved_conditions,
      snapshot_hash: source.snapshot_hash
    }
  });
  if (stateSnapshot.inserted) databaseWriteCount += 1;

  if (await ensureLink({
    configuration,
    fetchImpl,
    table: 'state_snapshot_source',
    row: {
      state_snapshot_id: stateSnapshot.id,
      source_binding_id: sourceBinding.id
    }
  })) {
    databaseWriteCount += 1;
  }

  let stateComponentCount = 0;
  for (const componentRow of componentRows(source, governedBinding)) {
    const stateComponent = await ensureRow({
      configuration,
      fetchImpl,
      table: 'state_component',
      idColumn: 'state_component_id',
      unique: {
        state_snapshot_id: stateSnapshot.id,
        component_id: componentRow.component_id
      },
      row: {
        state_snapshot_id: stateSnapshot.id,
        ...componentRow
      }
    });
    if (stateComponent.inserted) databaseWriteCount += 1;
    if (await ensureLink({
      configuration,
      fetchImpl,
      table: 'state_component_source',
      row: {
        state_component_id: stateComponent.id,
        source_binding_id: sourceBinding.id
      }
    })) {
      databaseWriteCount += 1;
    }
    stateComponentCount += 1;
  }

  const result = {
    adapter_version: CIVIC_GENOME_PERSISTENCE_ADAPTER_VERSION,
    target_schema: configuration.target_schema,
    state: databaseWriteCount === 0 ? 'existing_persistence_reused' : 'persisted',
    persisted: true,
    projection_executed: false,
    database_write_count: databaseWriteCount,
    source_binding_id: sourceBinding.id,
    state_snapshot_id: stateSnapshot.id,
    state_component_count: stateComponentCount,
    source_artifact_count: 0,
    idempotent_reuse: databaseWriteCount === 0,
    errors: []
  };
  return {
    ...result,
    persistence_receipt_hash: persistenceReceiptHash(result, source, governedBinding)
  };
}
