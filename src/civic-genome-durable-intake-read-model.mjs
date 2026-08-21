import { civicGenomePersistenceConfiguration } from './civic-genome-snapshot-persistence.mjs';

export const CIVIC_GENOME_DURABLE_INTAKE_READ_MODEL_VERSION = '1.1.1';

const CIVIC_GENOME_PLATFORM = 'lighthouse/civic_genome';
const CIVIC_GENOME_OBJECT_TYPE = 'external_snapshot';
const MAX_READ_ROWS = 1_000;
const ACCEPTED_BINDING_STATE = 'mapped_by_declared_rule';

function emptyIntake(state, errorCode = null) {
  return {
    read_model_version: CIVIC_GENOME_DURABLE_INTAKE_READ_MODEL_VERSION,
    state,
    available: false,
    binding_count: null,
    snapshot_count: null,
    component_count: null,
    projection_run_count: null,
    projection_result_count: null,
    replay_receipt_count: null,
    records: [],
    error_code: errorCode
  };
}

function failure(code) {
  const error = new Error(`civic_genome_durable_intake_read_failed:${code}`);
  error.code = code;
  return error;
}

function requiredText(row, field, maxLength = 300) {
  const value = row?.[field];
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw failure(`invalid_${field}`);
  }
  return value;
}

function requiredHash(row, field) {
  const value = requiredText(row, field, 64);
  if (!/^[0-9a-f]{64}$/.test(value)) throw failure(`invalid_${field}`);
  return value;
}

function endpoint(configuration, table) {
  const base = configuration.supabase_url.endsWith('/')
    ? configuration.supabase_url
    : `${configuration.supabase_url}/`;
  return new URL(`rest/v1/${table}`, base);
}

function headers(configuration) {
  return {
    apikey: configuration.service_role_key,
    authorization: `Bearer ${configuration.service_role_key}`,
    accept: 'application/json',
    'accept-profile': configuration.target_schema
  };
}

async function selectRows({ configuration, fetchImpl, table, search }) {
  const url = endpoint(configuration, table);
  for (const [key, value] of Object.entries(search)) {
    url.searchParams.set(key, value);
  }
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: headers(configuration),
    signal: typeof AbortSignal?.timeout === 'function'
      ? AbortSignal.timeout(Math.min(configuration.timeout_ms, 5_000))
      : undefined
  });
  const text = await response.text();
  if (!response.ok) throw failure(`${table}_get_${response.status}`);
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : [];
  } catch {
    throw failure(`${table}_invalid_json`);
  }
  if (!Array.isArray(parsed)) throw failure(`${table}_invalid_shape`);
  return parsed;
}

async function selectBoundedRows(options) {
  const rows = await selectRows({
    ...options,
    search: {
      ...options.search,
      limit: String(MAX_READ_ROWS)
    }
  });
  if (rows.length === MAX_READ_ROWS) {
    const nextPage = await selectRows({
      ...options,
      search: {
        ...options.search,
        limit: '1',
        offset: String(MAX_READ_ROWS)
      }
    });
    if (nextPage.length > 0) throw failure(`${options.table}_read_limit_reached`);
  }
  return rows;
}

async function selectRowsForIds({
  configuration,
  fetchImpl,
  table,
  select,
  field,
  ids
}) {
  if (ids.length === 0) return [];
  return selectBoundedRows({
    configuration,
    fetchImpl,
    table,
    search: {
      select,
      [field]: inFilter(ids)
    }
  });
}

function inFilter(values) {
  if (values.length === 0) return null;
  return `in.(${values.join(',')})`;
}

function rowsLinkedTo(rows, field, allowedIds) {
  if (allowedIds.size === 0) return [];
  return rows.filter((row) => allowedIds.has(requiredText(row, field, 64)));
}

function countComponents(rows) {
  const countBySnapshot = new Map();
  for (const row of rows) {
    const snapshotId = requiredText(row, 'state_snapshot_id', 64);
    countBySnapshot.set(snapshotId, (countBySnapshot.get(snapshotId) ?? 0) + 1);
  }
  return countBySnapshot;
}

function boundedRecords({ sourceBindings, snapshotSources, snapshots, components }) {
  const snapshotById = new Map(
    snapshots.map((snapshot) => [requiredText(snapshot, 'state_snapshot_id', 64), snapshot])
  );
  const sourceBindingById = new Map(
    sourceBindings.map((binding) => [requiredText(binding, 'source_binding_id', 64), binding])
  );
  const snapshotIdByBindingId = new Map();
  for (const row of snapshotSources) {
    const sourceBindingId = requiredText(row, 'source_binding_id', 64);
    if (!sourceBindingById.has(sourceBindingId)) continue;
    const snapshotId = requiredText(row, 'state_snapshot_id', 64);
    if (snapshotIdByBindingId.has(sourceBindingId)) throw failure('duplicate_snapshot_binding');
    snapshotIdByBindingId.set(sourceBindingId, snapshotId);
  }

  const componentCountBySnapshot = countComponents(components);
  return sourceBindings.map((binding) => {
    const sourceBindingId = requiredText(binding, 'source_binding_id', 64);
    const snapshotId = snapshotIdByBindingId.get(sourceBindingId);
    if (!snapshotId) throw failure('source_binding_snapshot_link_missing');
    const snapshot = snapshotById.get(snapshotId);
    if (!snapshot) throw failure('linked_snapshot_missing');

    const upstreamHash = requiredHash(binding, 'upstream_hash');
    const snapshotHash = requiredHash(snapshot, 'snapshot_hash');
    if (upstreamHash !== snapshotHash) throw failure('source_snapshot_hash_mismatch');
    if (requiredText(binding, 'upstream_object_id') !== requiredText(snapshot, 'external_snapshot_id')) {
      throw failure('source_snapshot_identity_mismatch');
    }

    return {
      external_snapshot_id: requiredText(binding, 'upstream_object_id'),
      snapshot_hash: upstreamHash,
      verification_state: requiredText(binding, 'verification_state', 120),
      bound_at: requiredText(binding, 'bound_at', 80),
      snapshot_kind: requiredText(snapshot, 'snapshot_kind', 40),
      as_of_date: requiredText(snapshot, 'as_of_date', 32),
      created_at: requiredText(snapshot, 'created_at', 80),
      component_count: componentCountBySnapshot.get(snapshotId) ?? 0
    };
  });
}

function safeErrorCode(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  return /^[a-z0-9_]+$/.test(code) ? code : 'live_read_unavailable';
}

export async function readCivicGenomeDurableIntake({
  configuration = civicGenomePersistenceConfiguration(),
  fetchImpl = globalThis.fetch
} = {}) {
  if (!configuration.enabled) return emptyIntake('disabled_no_read');
  if (!configuration.ready) return emptyIntake('enabled_missing_database_credentials');
  if (typeof fetchImpl !== 'function') return emptyIntake('fetch_unavailable');

  try {
    const sourceBindings = (await selectBoundedRows({
      configuration,
      fetchImpl,
      table: 'source_binding',
      search: {
        select: 'source_binding_id,upstream_object_id,upstream_hash,verification_state,bound_at',
        upstream_platform: `eq.${CIVIC_GENOME_PLATFORM}`,
        upstream_object_type: `eq.${CIVIC_GENOME_OBJECT_TYPE}`,
        verification_state: `eq.${ACCEPTED_BINDING_STATE}`,
        order: 'bound_at.desc'
      }
    })).filter((binding) => requiredText(binding, 'verification_state', 120) === ACCEPTED_BINDING_STATE);
    const bindingIds = sourceBindings.map((row) => requiredText(row, 'source_binding_id', 64));
    const bindingIdSet = new Set(bindingIds);

    const snapshotSources = rowsLinkedTo(await selectRowsForIds({
      configuration,
      fetchImpl,
      table: 'state_snapshot_source',
      select: 'state_snapshot_id,source_binding_id',
      field: 'source_binding_id',
      ids: bindingIds
    }), 'source_binding_id', bindingIdSet);

    const snapshotIds = snapshotSources.map((row) => requiredText(row, 'state_snapshot_id', 64));
    const snapshotIdSet = new Set(snapshotIds);
    const [snapshots, components, scenarios] = await Promise.all([
      selectRowsForIds({
        configuration,
        fetchImpl,
        table: 'state_snapshot',
        select: 'state_snapshot_id,external_snapshot_id,snapshot_kind,as_of_date,snapshot_hash,created_at',
        field: 'state_snapshot_id',
        ids: snapshotIds
      }),
      selectRowsForIds({
        configuration,
        fetchImpl,
        table: 'state_component',
        select: 'state_snapshot_id',
        field: 'state_snapshot_id',
        ids: snapshotIds
      }),
      selectRowsForIds({
        configuration,
        fetchImpl,
        table: 'scenario',
        select: 'scenario_id,baseline_snapshot_id',
        field: 'baseline_snapshot_id',
        ids: snapshotIds
      })
    ]);
    const linkedSnapshots = rowsLinkedTo(snapshots, 'state_snapshot_id', snapshotIdSet);
    const linkedComponents = rowsLinkedTo(components, 'state_snapshot_id', snapshotIdSet);
    const linkedScenarios = rowsLinkedTo(scenarios, 'baseline_snapshot_id', snapshotIdSet);
    const scenarioIds = linkedScenarios.map((row) => requiredText(row, 'scenario_id', 64));
    const scenarioIdSet = new Set(scenarioIds);

    const projectionRuns = rowsLinkedTo(await selectRowsForIds({
      configuration,
      fetchImpl,
      table: 'projection_run',
      select: 'projection_run_id,scenario_id',
      field: 'scenario_id',
      ids: scenarioIds
    }), 'scenario_id', scenarioIdSet);
    const projectionRunIds = projectionRuns.map((row) => requiredText(row, 'projection_run_id', 64));
    const projectionRunIdSet = new Set(projectionRunIds);
    const [projectionResults, replayReceipts] = await Promise.all([
      selectRowsForIds({
        configuration,
        fetchImpl,
        table: 'projection_result',
        select: 'projection_result_id,projection_run_id',
        field: 'projection_run_id',
        ids: projectionRunIds
      }),
      selectRowsForIds({
        configuration,
        fetchImpl,
        table: 'replay_receipt',
        select: 'replay_receipt_id,projection_run_id',
        field: 'projection_run_id',
        ids: projectionRunIds
      })
    ]);
    const linkedProjectionResults = rowsLinkedTo(projectionResults, 'projection_run_id', projectionRunIdSet);
    const linkedReplayReceipts = rowsLinkedTo(replayReceipts, 'projection_run_id', projectionRunIdSet);

    const records = boundedRecords({
      sourceBindings,
      snapshotSources,
      snapshots: linkedSnapshots,
      components: linkedComponents
    });
    return {
      read_model_version: CIVIC_GENOME_DURABLE_INTAKE_READ_MODEL_VERSION,
      state: records.length > 0 ? 'durable_intake_active' : 'available_no_durable_intake',
      available: true,
      binding_count: records.length,
      snapshot_count: records.length,
      component_count: records.reduce((sum, record) => sum + record.component_count, 0),
      projection_run_count: projectionRuns.length,
      projection_result_count: linkedProjectionResults.length,
      replay_receipt_count: linkedReplayReceipts.length,
      records,
      error_code: null
    };
  } catch (error) {
    return emptyIntake('live_read_unavailable', safeErrorCode(error));
  }
}
