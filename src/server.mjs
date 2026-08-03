import http from 'node:http';
import { diffSnapshots } from './diff.mjs';

const PORT = Number.parseInt(process.env.PORT ?? '10000', 10);
const ENGINE_VERSION = '0.1.3';
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

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('request_too_large');
    chunks.push(chunk);
  }
  return chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      return send(res, 200, {
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        source_manifest_id: SOURCE_MANIFEST_ID,
        source_entry_count: 41,
        projection_capability: 'not_yet_enabled',
        routes: ['/health', '/v1/status', '/v1/diff']
      });
    }
    if (req.method === 'GET' && req.url === '/health') {
      return send(res, 200, {
        status: 'ok',
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        deterministic: true,
        projection_capability: 'not_yet_enabled',
        database_state: 'migration_not_applied'
      });
    }
    if (req.method === 'GET' && req.url === '/v1/status') {
      return send(res, 200, {
        platform: 'kaleidoscope',
        foundation_version: ENGINE_VERSION,
        environment: 'staging',
        kernel_state: 'typed_diff_and_hashing_scaffold',
        source_manifest_id: SOURCE_MANIFEST_ID,
        source_entry_count: 41,
        source_corpus_state: 'all_uploaded_documents_active',
        lens_state: 'contracts_and_definition_fixtures_only',
        projection_state: 'not_operational',
        supabase_state: 'empty_project_migration_draft_only',
        unresolved_states_preserved: true
      });
    }
    if (req.method === 'POST' && req.url === '/v1/diff') {
      const body = await readJson(req);
      return send(res, 200, diffSnapshots(body.baseline, body.changed));
    }
    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    const code = error?.message === 'request_too_large' ? 413 : 400;
    return send(res, code, { error: error?.message ?? 'invalid_request' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ event: 'kaleidoscope_started', port: PORT, engine_version: ENGINE_VERSION, environment: 'staging' }));
});
