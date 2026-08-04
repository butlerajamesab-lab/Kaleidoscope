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

const PORT = Number.parseInt(process.env.PORT ?? '10000', 10);
const ENGINE_VERSION = '0.1.5';
const RUNTIME_REVISION = 'project2025_frontend_shell.v1';
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

function handshakeConfiguration() {
  const keyId = process.env.KALEIDOSCOPE_CIVIC_GENOME_HANDSHAKE_KEY_ID?.trim() ?? '';
  const secret = process.env.KALEIDOSCOPE_CIVIC_GENOME_HANDSHAKE_SECRET?.trim() ?? '';
  return {
    keyId,
    secret,
    ready: keyId.length > 0 && Buffer.byteLength(secret, 'utf8') >= 32
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

    if (req.method === 'GET') {
      const frontendResponse = await resolveProject2025FrontendRequest(pathname);
      if (frontendResponse) return sendRaw(res, frontendResponse);
    }

    if (req.method === 'GET' && pathname === '/') {
      return send(res, 200, {
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        source_manifest_id: SOURCE_MANIFEST_ID,
        source_entry_count: 41,
        projection_capability: 'source_controlled_test_fixture_only',
        civic_genome_binding_contract: 'defined_unbound',
        civic_genome_source_validation: 'contract_and_tamper_tests_passed_live_source_not_accepted',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_ready'
          : 'not_configured',
        frontend_state: 'read_only_project2025_vertical_slice_shell',
        routes: [
          '/health',
          '/v1/status',
          '/v1/diff',
          CIVIC_GENOME_DELIVERY_PATH,
          PROJECT2025_FRONTEND_PATH,
          PROJECT2025_FRONTEND_READ_MODEL_PATH,
          PROJECT2025_FRONTEND_RECEIPT_PATH
        ]
      });
    }
    if (req.method === 'GET' && pathname === '/health') {
      return send(res, 200, {
        status: 'ok',
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        deterministic: true,
        projection_capability: 'source_controlled_test_fixture_only',
        frontend_state: 'read_only_project2025_vertical_slice_shell',
        civic_genome_binding_contract: 'defined_unbound',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_ready'
          : 'not_configured',
        database_state: 'migration_not_applied'
      });
    }
    if (req.method === 'GET' && pathname === '/v1/status') {
      return send(res, 200, {
        platform: 'kaleidoscope',
        foundation_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        environment: 'staging',
        kernel_state: 'typed_diff_hashing_source_tamper_validation_authenticated_handoff_and_project2025_vertical_slice',
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
        frontend_state: 'read_only_project2025_vertical_slice_shell',
        supabase_state: 'empty_project_migration_draft_only',
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
  console.log(JSON.stringify({
    event: 'kaleidoscope_started',
    port: PORT,
    engine_version: ENGINE_VERSION,
    runtime_revision: RUNTIME_REVISION,
    environment: 'staging'
  }));
});
