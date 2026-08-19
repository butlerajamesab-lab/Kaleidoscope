import http from 'node:http';
import { diffSnapshots } from './diff.mjs';
import {
  CIVIC_GENOME_DELIVERY_PATH,
  CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
  validateAuthenticatedCivicGenomeDelivery
} from './civic-genome-snapshot-delivery.mjs';
import {
  PROJECT2025_FRONTEND_PATH,
  PROJECT2025_FRONTEND_READ_MODEL_PATH,
  PROJECT2025_FRONTEND_RECEIPT_PATH,
  resolveProject2025FrontendRequest
} from './project2025-frontend-shell.mjs';
import {
  LOCAL_PREEMPTION_FRONTEND_PATH,
  LOCAL_PREEMPTION_READ_MODEL_PATH,
  LOCAL_PREEMPTION_RECEIPT_PATH,
  LOCAL_PREEMPTION_FRONTEND_VERSION,
  resolveLocalPreemptionFrontendRequest
} from './local-preemption-frontend-shell.mjs';
import {
  LEGISLATIVE_IMPACT_SURFACE_PATH,
  LEGISLATIVE_IMPACT_RECEIPT_PATH,
  resolveLegislativeImpactRequest
} from './legislative-impact-api.mjs';
import {
  KALEIDOSCOPE_APP_PATH,
  KALEIDOSCOPE_APP_READ_MODEL_PATH,
  KALEIDOSCOPE_APP_FRONTEND_VERSION,
  kaleidoscopePlatformReadModel,
  resolveKaleidoscopePlatformFrontendRequest
} from './platform-frontend-shell.mjs';
import { stateResponseFixtures } from '../fixtures/state-response-guidance-rescission-partial.v1.mjs';
import { STATE_RESPONSE_RESULT_PATH, resolveStateResponse } from './state-response-resolver.mjs';
import { STATE_RESPONSE_FRONTEND_PATH, resolveStateResponseFrontendRequest } from './state-response-frontend-shell.mjs';

const PORT = Number.parseInt(process.env.PORT ?? '10000', 10);
const ENGINE_VERSION = '0.1.4';
const PROJECT2025_FRONTEND_SHELL_VERSION = '1.0.0';
const RUNTIME_REVISION = 'kaleidoscope_legislative_consequence_stage3.v1';
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

function boundedScenarioState(platform) {
  return platform.scenarios.map((scenario) => ({
    scenario_id: scenario.scenario_id,
    policy_family_id: scenario.policy_family_id,
    state: scenario.state,
    inspection_state: scenario.inspection_state
  }));
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

      const stateResponsePage = await resolveStateResponseFrontendRequest(pathname);
      if (stateResponsePage) return sendRaw(res, stateResponsePage);

      const impactResponse = resolveLegislativeImpactRequest(pathname);
      if (impactResponse) return sendRaw(res, impactResponse);

      const localPreemptionResponse = await resolveLocalPreemptionFrontendRequest(pathname);
      if (localPreemptionResponse) return sendRaw(res, localPreemptionResponse);

      const project2025Response = await resolveProject2025FrontendRequest(pathname);
      if (project2025Response) return sendRaw(res, project2025Response);
    }

    if (req.method === 'GET' && pathname === '/') {
      const platform = platformStatus();
      const database = platform.database_substrate;
      const consequence = platform.legislative_consequence;
      const impact = consequence.impact_surface;
      const persistence = platform.persistence_preflight;
      return send(res, 200, {
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        source_manifest_id: SOURCE_MANIFEST_ID,
        source_entry_count: platform.summary.active_source_artifacts,
        projection_capability: 'bounded_source_controlled_test_fixtures_only',
        bounded_scenario_count: platform.summary.scenario_count,
        bounded_scenarios: boundedScenarioState(platform),
        citizen_detail_surface_count: 2,
        legislative_consequence_state: consequence.state,
        legislative_consequence_structural_delta_count: consequence.structural_delta_count,
        legislative_consequence_edge_count: consequence.consequence_edge_count,
        legislative_consequence_stage_3_executed: true,
        legislative_consequence_stage_3_impact_item_count: impact.impact_item_count,
        legislative_consequence_stage_3_touched_actor_count: impact.touched_actor_count,
        legislative_consequence_stages_4_6_executed: false,
        persistence_preflight_state: persistence.state,
        persistence_live_write_authorized: persistence.live_write_authorized,
        civic_genome_delivery_contract_version: CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
        civic_genome_binding_contract: 'mapped_transient_acceptance_available_no_persistence',
        civic_genome_source_validation: 'contract_tamper_and_declared_verification_mapping_available',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_and_mapping_ready'
          : 'not_configured',
        frontend_state: 'citizen_first_workspace_stage3_visible',
        platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
        project2025_frontend_shell_version: PROJECT2025_FRONTEND_SHELL_VERSION,
        local_preemption_frontend_version: LOCAL_PREEMPTION_FRONTEND_VERSION,
        database_state: database.canonical_persistence_state,
        database_schema: database.schema_name,
        database_table_count: database.table_count,
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
          PROJECT2025_FRONTEND_RECEIPT_PATH,
          LOCAL_PREEMPTION_FRONTEND_PATH,
          LOCAL_PREEMPTION_READ_MODEL_PATH,
          LOCAL_PREEMPTION_RECEIPT_PATH,
          LEGISLATIVE_IMPACT_SURFACE_PATH,
          LEGISLATIVE_IMPACT_RECEIPT_PATH,
          STATE_RESPONSE_FRONTEND_PATH,
          STATE_RESPONSE_RESULT_PATH
        ]
      });
    }
    if (req.method === 'GET' && pathname === STATE_RESPONSE_RESULT_PATH) {
      const jurisdiction = new URL(req.url ?? '/', 'http://localhost').searchParams.get('jurisdiction') ?? 'US-CA';
      const fixture = stateResponseFixtures[jurisdiction];
      if (!fixture) return send(res, 404, {error:'jurisdiction_not_available',available_jurisdictions:Object.keys(stateResponseFixtures)});
      return send(res, 200, resolveStateResponse(fixture));
    }
    if (req.method === 'GET' && pathname === '/health') {
      const platform = platformStatus();
      const database = platform.database_substrate;
      const consequence = platform.legislative_consequence;
      const impact = consequence.impact_surface;
      const persistence = platform.persistence_preflight;
      return send(res, 200, {
        status: 'ok',
        platform: 'kaleidoscope',
        environment: 'staging',
        engine_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        deterministic: true,
        projection_capability: 'bounded_source_controlled_test_fixtures_only',
        bounded_scenario_count: platform.summary.scenario_count,
        citizen_detail_surface_count: 2,
        legislative_consequence_state: consequence.state,
        legislative_consequence_stage_3_executed: true,
        legislative_consequence_stage_3_impact_item_count: impact.impact_item_count,
        legislative_consequence_stages_4_6_executed: false,
        persistence_preflight_state: persistence.state,
        persistence_live_write_authorized: persistence.live_write_authorized,
        frontend_state: 'citizen_first_workspace_stage3_visible',
        platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
        civic_genome_delivery_contract_version: CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
        civic_genome_binding_contract: 'mapped_transient_acceptance_available_no_persistence',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_and_mapping_ready'
          : 'not_configured',
        database_state: database.canonical_persistence_state,
        database_schema: database.schema_name,
        database_table_count: database.table_count,
        database_row_count: database.exact_total_rows
      });
    }
    if (req.method === 'GET' && pathname === '/v1/status') {
      const platform = platformStatus();
      const database = platform.database_substrate;
      const consequence = platform.legislative_consequence;
      const impact = consequence.impact_surface;
      const persistence = platform.persistence_preflight;
      return send(res, 200, {
        platform: 'kaleidoscope',
        foundation_version: ENGINE_VERSION,
        runtime_revision: RUNTIME_REVISION,
        environment: 'staging',
        kernel_state: 'typed_diff_hashing_source_tamper_validation_authenticated_handoff_two_bounded_scenario_classes_legislative_consequence_stage3_persistence_preflight_and_two_citizen_detail_surfaces',
        source_manifest_id: SOURCE_MANIFEST_ID,
        source_entry_count: platform.summary.active_source_artifacts,
        source_corpus_state: 'all_uploaded_documents_active',
        bounded_scenario_count: platform.summary.scenario_count,
        bounded_scenarios: boundedScenarioState(platform),
        citizen_detail_surface_count: 2,
        citizen_detail_routes: [PROJECT2025_FRONTEND_PATH, LOCAL_PREEMPTION_FRONTEND_PATH],
        governed_lens_count: platform.summary.lens_count,
        preserved_collision_count: platform.summary.preserved_collision_count,
        civic_genome_source_schema_id: 'https://luminari.org/civic-genome/contracts/external-snapshot.v1.schema.json',
        civic_genome_delivery_contract_version: CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
        civic_genome_binding_contract: 'mapped_transient_acceptance_available_no_persistence',
        civic_genome_validation_state: 'component_snapshot_replay_receipt_hmac_and_declared_verification_mapping_available',
        civic_genome_handoff_state: handshakeConfiguration().ready
          ? 'authenticated_validation_and_mapping_ready_no_persistence'
          : 'not_configured',
        civic_genome_live_binding_state: 'transient_acceptance_only_not_persisted',
        projection_state: 'executed_test_fixtures_not_canonical_fact',
        legislative_consequence_state: consequence.state,
        legislative_consequence_structural_delta_count: consequence.structural_delta_count,
        legislative_consequence_edge_count: consequence.consequence_edge_count,
        legislative_consequence_platform_binding_count: consequence.platform_binding_count,
        legislative_consequence_preserved_conflict_count: consequence.preserved_conflict_count,
        legislative_consequence_stage_3_executed: true,
        legislative_consequence_stage_3_impact_item_count: impact.impact_item_count,
        legislative_consequence_stage_3_touched_actor_count: impact.touched_actor_count,
        legislative_consequence_stage_3_effect_class_counts: impact.effect_class_counts,
        legislative_consequence_stage_3_deferred_reference_count: impact.deferred_reference_count,
        legislative_consequence_stage_3_impact_surface_hash: impact.impact_surface_hash,
        legislative_consequence_stage_3_run_id: impact.run_id,
        legislative_consequence_stage_3_receipt_hash: impact.receipt_hash,
        legislative_consequence_stage_4_atlas_executed: impact.atlas_historical_comparison_executed,
        legislative_consequence_stage_5_lighthouse_executed: impact.lighthouse_accountability_executed,
        legislative_consequence_stage_6_checklist_instantiated: impact.checklist_instantiated,
        legislative_consequence_projection_executed: consequence.projection_executed,
        legislative_consequence_stages_4_6_executed: false,
        persistence_preflight_state: persistence.state,
        persistence_preflight_scenario_count: persistence.scenario_plans.length,
        persistence_live_write_authorized: persistence.live_write_authorized,
        persistence_credentials_required: persistence.credentials_required,
        persistence_sql_emitted: persistence.sql_emitted,
        frontend_state: 'citizen_first_workspace_stage3_visible',
        platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
        layperson_comprehension_contract: 'v1',
        project2025_frontend_shell_version: PROJECT2025_FRONTEND_SHELL_VERSION,
        local_preemption_frontend_version: LOCAL_PREEMPTION_FRONTEND_VERSION,
        supabase_state: database.canonical_persistence_state,
        supabase_schema: database.schema_name,
        supabase_table_count: database.table_count,
        supabase_function_count: database.function_count,
        supabase_trigger_count: database.trigger_count,
        supabase_row_count: database.exact_total_rows,
        supabase_migration_count: database.migration_history.length,
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
        event: receipt.binding_state === 'accepted'
          ? 'civic_genome_snapshot_validated_bound_transient'
          : 'civic_genome_snapshot_validated_unbound',
        delivery_contract_version: receipt.delivery_contract_version,
        delivery_receipt_id: receipt.delivery_receipt_id,
        delivery_receipt_hash: receipt.delivery_receipt_hash,
        source_snapshot_id: receipt.source_snapshot_id,
        source_snapshot_hash: receipt.source_snapshot_hash,
        source_component_count: receipt.source_component_count,
        binding_state: receipt.binding_state,
        verification_mapping_state: receipt.verification_mapping_state,
        verification_mapping_rule_id: receipt.verification_mapping_rule_id,
        verification_mapping_rule_version: receipt.verification_mapping_rule_version,
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
  const impact = consequence.impact_surface;
  const persistence = platform.persistence_preflight;
  console.log(JSON.stringify({
    event: 'kaleidoscope_started',
    port: PORT,
    engine_version: ENGINE_VERSION,
    runtime_revision: RUNTIME_REVISION,
    platform_frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
    bounded_scenario_count: platform.summary.scenario_count,
    citizen_detail_surface_count: 2,
    governed_lens_count: platform.summary.lens_count,
    project2025_frontend_shell_version: PROJECT2025_FRONTEND_SHELL_VERSION,
    local_preemption_frontend_version: LOCAL_PREEMPTION_FRONTEND_VERSION,
    legislative_consequence_state: consequence.state,
    legislative_consequence_stage_3_executed: true,
    legislative_consequence_stage_3_impact_item_count: impact.impact_item_count,
    legislative_consequence_stages_4_6_executed: false,
    persistence_preflight_state: persistence.state,
    persistence_live_write_authorized: persistence.live_write_authorized,
    civic_genome_delivery_contract_version: CIVIC_GENOME_DELIVERY_CONTRACT_VERSION,
    civic_genome_handoff_state: handshakeConfiguration().ready
      ? 'authenticated_validation_and_mapping_ready_no_persistence'
      : 'not_configured',
    database_state: database.canonical_persistence_state,
    database_table_count: database.table_count,
    database_row_count: database.exact_total_rows,
    environment: 'staging'
  }));
});
