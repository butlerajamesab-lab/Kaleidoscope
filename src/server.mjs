import http from 'node:http';
import { diffSnapshots } from './diff.mjs';
import {
  CIVIC_GENOME_DELIVERY_PATH,
  validateAuthenticatedCivicGenomeDelivery
} from './civic-genome-snapshot-delivery.mjs';
import {
  PROJECT2025_FRONTEND_PATH,
  PROJECT2025_FRONTEND_READ_MODEL_PATH,
  PROJECT2025_FRONTEND_RECEIPT_PATH,
  resolveProject2025FrontendRequest
} from './project2025-frontend-shell.mjs';
import {
  KALEIDOSCOPE_APP_PATH,
  KALEIDOSCOPE_APP_READ_MODEL_PATH,
  KALEIDOSCOPE_APP_FRONTEND_VERSION,
  kaleidoscopePlatformReadModel,
  resolveKaleidoscopePlatformFrontendRequest
} from './platform-frontend-shell.mjs';

const PORT = Number.parseInt(process.env.PORT ?? '10000', 10);
const ENGINE_VERSION = '0.1.4';
const PROJECT2025_FRONTEND_SHELL_VERSION = '1.0.0';
const RUNTIME_REVISION = 'kaleidoscope_platform_frontend_persistence_preflight.v1';
const SOURCE_MANIFEST_ID = 'kaleidoscope_source_pack_2026_08_03_v3';

function send(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store'
  });
  res.end(payload);
}

function sendRaw(res, response) {
  res.writeHead(response.statusCode, {
    'content-type': response.contentType,
    'content-length': Buffer.byteLength(response.body),
    'cache-control': response.cacheControl ?? 'no-store',
    ...(response.headers ?? {})
  });
  res.end(response.body);
}

async function readJson(req, maxBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('request_too_large');
    chunks.push(chunk);
  }
  return chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function header(req, name) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function acceptsHtml(req) {
  return header(req, 'accept').toLowerCase().includes('text/html');
}

function handshakeConfiguration() {
  const keyId = process.env.KALEIDOSCOPE_CIVIC_GENOME_HANDSHAKE_KEY_ID?.trim() ?? '';
  const secret = process.env.KALEIDOSCOPE_CIVIC_GENOME_HANDSHAKE_SECRET?.trim() ?? '';
  return {
    keyId,
    secret,
    ready: keyId.length > 0 && Buffer.byteLength(secret, 'utf8') >= 32
  };
}

function platformStatus() {
  return kaleidoscopePlatformReadModel();
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

    if (req.method === 'GET') {
      if (pathname === '/' && acceptsHtml(req)) {
        const appResponse = await resolveKaleidoscopePlatformFrontendRequest(KALEIDOSCOPE_APP_PATH);
        return sendRaw(res, appResponse);
      }

      const platformResponse = await resolveKaleidoscopePlatformFrontendRequest(pathname);
      if (platformResponse) return sendRaw(res, platformResponse);

      const project2025Response = await resolveProject2025FrontendRequest(pathname);
      if (project2025Response) return sendRaw(res, project2025Response);
    }

    if (req.method === 'GET' && pathname === '/') {
      const platform = platformStatus();
      const database = platform.database_substrate;
      const consequence = platform.legislative_consequence;
      const preflight = platform.persistence_preflight;
      return send(res, 200, {
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        source_manifest_id: SOURCE_MANIFEST_ID,
        source_entry_count: 41,
        projection_capability: 'source_controlled_test_fixture_only',
        legislative_consequence_state: consequence.state,
        legislative_consequence_structural_delta_count: consequence.structural_delta_count,
        legislative_consequence_edge_count: consequence.consequence_edge_count,
        persistence_preflight_state: preflight.state,
        persistence_preflight_blocker_count: preflight.blocker_count,
        persistence_live_write_authorized: preflight.live_write_authorized,
        civic_genome_binding_contract: 'defined_unbound',
        civic_genome_source_validation: 'contract_and_tamper_tests_passed_live_source_not_accepted',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_ready'
          : 'not_configured',
        frontend_state: 'kaleidoscope_platform_workspace_with_project2025_inspection',
        platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
        project2025_frontend_shell_version: PROJECT2025_FRONTEND_SHELL_VERSION,
        database_state: database.canonical_persistence_state,
        database_receipt_state: database.substrate_state,
        database_schema: database.schema_name,
        database_table_count: database.table_count,
        database_function_count: database.function_count,
        database_trigger_count: database.trigger_count,
        database_row_count: database.exact_total_rows,
        browser_root: KALEIDOSCOPE_APP_PATH,
        routes: [
          '/health',
          '/v1/status',
          '/v1/diff',
          CIVIC_GENOME_DELIVERY_PATH,
          KALEIDOSCOPE_APP_PATH,
          KALEIDOSCOPE_APP_READ_MODEL_PATH,
          PROJECT2025_FRONTEND_PATH,
          PROJECT2025_FRONTEND_READ_MODEL_PATH,
          PROJECT2025_FRONTEND_RECEIPT_PATH
        ]
      });
    }
    if (req.method === 'GET' && pathname === '/health') {
      const platform = platformStatus();
      const database = platform.database_substrate;
      const consequence = platform.legislative_consequence;
      const preflight = platform.persistence_preflight;
      return send(res, 200, {
        status: 'ok',
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        deterministic: true,
        projection_capability: 'source_controlled_test_fixture_only',
        legislative_consequence_state: consequence.state,
        persistence_preflight_state: preflight.state,
        persistence_live_write_authorized: preflight.live_write_authorized,
        frontend_state: 'kaleidoscope_platform_workspace_with_project2025_inspection',
        platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
        civic_genome_binding_contract: 'defined_unbound',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_ready'
          : 'not_configured',
        database_state: database.canonical_persistence_state,
        database_receipt_state: database.substrate_state,
        database_schema: database.schema_name,
        database_table_count: database.table_count,
        database_function_count: database.function_count,
        database_trigger_count: database.trigger_count,
        database_row_count: database.exact_total_rows
      });
    }
    if (req.method === 'GET' && pathname === '/v1/status') {
      const platform = platformStatus();
      const database = platform.database_substrate;
      const consequence = platform.legislative_consequence;
      const preflight = platform.persistence_preflight;
      return send(res, 200, {
        platform: 'kaleidoscope',
        foundation_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        environment: 'staging',
        kernel_state: 'typed_diff_hashing_source_tamper_validation_authenticated_handoff_project2025_vertical_slice_legislative_consequence_stage2_and_persistence_preflight',
        source_manifest_id: SOURCE_MANIFEST_ID,
        source_entry_count: 41,
        source_corpus_state: 'all_uploaded_documents_active',
        civic_genome_source_schema_id: 'https://luminari.org/civic-genome/contracts/external-snapshot.v1.schema.json',
        civic_genome_binding_contract: 'defined_unbound',
        civic_genome_validation_state: 'component_snapshot_replay_receipt_and_hmac_validation_passed',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_ready_no_persistence'
          : 'not_configured',
        civic_genome_live_binding_state: 'not_accepted',
        lens_state: 'project2025_vertical_slice_fixture_with_four_declared_lenses',
        projection_state: 'executed_test_fixture_not_canonical_fact',
        legislative_consequence_state: consequence.state,
        legislative_consequence_structural_delta_count: consequence.structural_delta_count,
        legislative_consequence_edge_count: consequence.consequence_edge_count,
        legislative_consequence_platform_binding_count: consequence.platform_binding_count,
        legislative_consequence_preserved_conflict_count: consequence.preserved_conflict_count,
        legislative_consequence_projection_executed: consequence.projection_executed,
        persistence_preflight_state: preflight.state,
        persistence_preflight_plan_hash: preflight.persistence_plan_hash,
        persistence_preflight_table_plan_count: preflight.table_plan_count,
        persistence_preflight_blocker_count: preflight.blocker_count,
        persistence_live_write_authorized: preflight.live_write_authorized,
        persistence_database_write_count: preflight.database_write_count,
        persistence_credentials_required: preflight.credentials_required,
        persistence_sql_emitted: preflight.sql_emitted,
        persistence_upstream_mutation: preflight.upstream_mutation,
        frontend_state: 'kaleidoscope_platform_workspace_with_project2025_inspection',
        platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
        project2025_frontend_shell_version: PROJECT2025_FRONTEND_SHELL_VERSION,
        supabase_state: database.canonical_persistence_state,
        supabase_receipt_state: database.substrate_state,
        supabase_schema: database.schema_name,
        supabase_table_count: database.table_count,
        supabase_function_count: database.function_count,
        supabase_trigger_count: database.trigger_count,
        supabase_row_count: database.exact_total_rows,
        supabase_migration_count: database.migration_history.length,
        runtime_persistence_adapter_state: 'not_bound',
        runtime_database_write_path_proven: database.runtime_database_write_path_proven,
        unresolved_states_preserved: true
      });
    }
    if (req.method === 'POST' && pathname === CIVIC_GENOME_DELIVERY_PATH) {
      const configuration = handshakeConfiguration();
      if (!configuration.ready) {
        return send(res, 503, { error: 'civic_genome_handoff_not_configured' });
      }
      const body = await readJson(req, 5_000_000);
      const receipt = validateAuthenticatedCivicGenomeDelivery({
        body,
        keyId: header(req, 'x-kaleidoscope-key-id'),
        signature: header(req, 'x-kaleidoscope-signature'),
        expectedKeyId: configuration.keyId,
        secret: configuration.secret
      });
      console.log(JSON.stringify({
        event: 'civic_genome_snapshot_validated_unbound',
        delivery_receipt_id: receipt.delivery_receipt_id,
        delivery_receipt_hash: receipt.delivery_receipt_hash,
        source_snapshot_id: receipt.source_snapshot_id,
        source_snapshot_hash: receipt.source_snapshot_hash,
        source_component_count: receipt.source_component_count,
        binding_state: receipt.binding_state,
        persisted: receipt.persisted,
        projection_executed: receipt.projection_executed
      }));
      return send(res, 200, receipt);
    }
    if (req.method === 'POST' && pathname === '/v1/diff') {
      const body = await readJson(req);
      return send(res, 200, diffSnapshots(body.baseline, body.changed));
    }
    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    const message = error?.message ?? 'invalid_request';
    const code = message === 'request_too_large'
      ? 413
      : message.startsWith('unauthorized_civic_genome_delivery:')
        ? 401
        : 400;
    return send(res, code, { error: message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const platform = platformStatus();
  const database = platform.database_substrate;
  const consequence = platform.legislative_consequence;
  const preflight = platform.persistence_preflight;
  console.log(JSON.stringify({
    event: 'kaleidoscope_started',
    port: PORT,
    engine_version: ENGINE_VERSION,
    runtime_revision: RUNTIME_REVISION,
    platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
    project2025_frontend_shell_version: PROJECT2025_FRONTEND_SHELL_VERSION,
    legislative_consequence_state: consequence.state,
    persistence_preflight_state: preflight.state,
    persistence_live_write_authorized: preflight.live_write_authorized,
    database_state: database.canonical_persistence_state,
    database_receipt_state: database.substrate_state,
    database_table_count: database.table_count,
    database_function_count: database.function_count,
    database_trigger_count: database.trigger_count,
    database_row_count: database.exact_total_rows,
    environment: 'staging'
  }));
});
