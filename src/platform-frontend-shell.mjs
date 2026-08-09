import { readFile } from 'node:fs/promises';
import sourceManifest from '../source_manifests/source_pack_2026_08_03_v3.json' with { type: 'json' };
import project2025ReadModel from '../fixtures/project2025-title-vii-read-model.v1.json' with { type: 'json' };
import project2025Receipt from '../fixtures/project2025-title-vii-receipt.v1.json' with { type: 'json' };
import civicGenomeHandoffReceipt from '../docs/receipts/CIVIC_GENOME_KALEIDOSCOPE_AUTHENTICATED_HANDOFF_HB2487_2026-08-04.json' with { type: 'json' };
import { canonicalValue } from './canonical-json.mjs';
import { sha256Hex } from './hash.mjs';

export const KALEIDOSCOPE_APP_PATH = '/app';
export const KALEIDOSCOPE_APP_READ_MODEL_PATH = '/v1/platform/read-model';
export const KALEIDOSCOPE_APP_FRONTEND_VERSION = '1.0.0';

const HTML_ASSET = {
  file: '../public/kaleidoscope-app.html',
  contentType: 'text/html; charset=utf-8'
};

const ASSET_ROUTES = new Map([
  ['/app.css', {
    file: '../public/kaleidoscope-app.css',
    contentType: 'text/css; charset=utf-8'
  }],
  ['/app.js', {
    file: '../public/kaleidoscope-app.js',
    contentType: 'text/javascript; charset=utf-8'
  }]
]);

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

function fail(code) {
  throw new Error(`invalid_kaleidoscope_platform_frontend:${code}`);
}

function assertSourceControlledState() {
  if (!Array.isArray(sourceManifest.entries) || sourceManifest.entries.length !== 41) {
    fail('source_manifest_count_mismatch');
  }
  if (sourceManifest.corpus_policy !== 'all uploaded documents in this source sequence are active Kaleidoscope source artifacts; no selected subset') {
    fail('source_corpus_policy_mismatch');
  }

  const { read_model_hash: observedReadModelHash, ...readModelBasis } = project2025ReadModel;
  if (sha256Hex(readModelBasis) !== observedReadModelHash) {
    fail('project2025_read_model_hash_mismatch');
  }
  if (project2025Receipt.read_model_hash !== observedReadModelHash) {
    fail('project2025_receipt_binding_mismatch');
  }
  if (project2025Receipt.no_mutation !== true || project2025Receipt.database_write_count !== 0) {
    fail('project2025_write_boundary_mismatch');
  }

  if (civicGenomeHandoffReceipt.proof_state !== 'completed') {
    fail('civic_genome_handoff_proof_not_complete');
  }
  if (civicGenomeHandoffReceipt.delivery_receipt?.validation_state !== 'validated_unbound') {
    fail('civic_genome_handoff_state_mismatch');
  }
  if (civicGenomeHandoffReceipt.binding?.binding_state !== 'unresolved') {
    fail('civic_genome_binding_state_mismatch');
  }
  const boundary = civicGenomeHandoffReceipt.write_and_execution_boundary;
  if (!boundary
      || boundary.kaleidoscope_persisted !== false
      || boundary.kaleidoscope_projection_executed !== false
      || boundary.upstream_mutation !== false) {
    fail('civic_genome_handoff_boundary_mismatch');
  }
}

function platformContracts() {
  return [
    {
      platform_id: 'docket_room',
      label: 'Docket Room',
      role: 'Official legislation identity, status, and source retrieval',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'rosetta',
      label: 'Rosetta',
      role: 'Deterministic legal decomposition and source-span extraction',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'civic_genome',
      label: 'Civic Genome',
      role: 'Persistent policy identity, traits, events, lineage, and immutable snapshots',
      relationship: 'authenticated read-only source',
      state: civicGenomeHandoffReceipt.delivery_receipt.validation_state,
      mutation: 'prohibited'
    },
    {
      platform_id: 'prism',
      label: 'Prism',
      role: 'Verification receipts, contradictions, and cited evidence findings',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'atlas',
      label: 'Atlas',
      role: 'Governed observations, entity resolution, and historical context',
      relationship: 'governed upstream owner',
      state: 'external_owner',
      mutation: 'prohibited'
    },
    {
      platform_id: 'esquire',
      label: 'Esquire',
      role: 'Person-controlled procedural state when explicitly authorized',
      relationship: 'future read-only binding',
      state: 'contract_not_established',
      mutation: 'prohibited'
    }
  ];
}

function capabilities() {
  return [
    {
      capability_id: 'typed_state_diff',
      label: 'Typed state diff',
      state: 'available',
      detail: 'Added, removed, modified, preserved, superseded, preempted, and unresolved state changes.'
    },
    {
      capability_id: 'project2025_vertical_slice',
      label: 'Project 2025 vertical slice',
      state: 'executed_test_fixture',
      detail: 'Four independent lenses with deterministic replay and preserved collisions.'
    },
    {
      capability_id: 'civic_genome_snapshot_validation',
      label: 'Civic Genome snapshot validation',
      state: 'live_proven_unbound',
      detail: 'Authenticated 62-component snapshot validation proved without persistence or projection.'
    },
    {
      capability_id: 'canonical_projection_persistence',
      label: 'Canonical projection persistence',
      state: 'disabled',
      detail: 'No Kaleidoscope database substrate has been promoted.'
    }
  ];
}

export function kaleidoscopePlatformReadModel() {
  assertSourceControlledState();

  const lensRegistry = project2025ReadModel.lens_panels.map((lens) => ({
    lens_id: lens.lens_id,
    effect_count: lens.effect_count,
    state: 'source_controlled_test_fixture',
    href: '/project2025/title-vii#lenses'
  }));

  const basis = {
    read_model_version: '1.0.0',
    platform: 'kaleidoscope',
    platform_label: 'Kaleidoscope',
    environment: 'staging',
    foundation_version: '0.1.4',
    frontend_version: KALEIDOSCOPE_APP_FRONTEND_VERSION,
    deterministic: true,
    truth_label: 'Staging workspace — deterministic source-controlled evidence, not canonical projection truth',
    mission: 'Compare declared civic states through inspectable deterministic lenses while preserving provenance, uncertainty, and disagreement.',
    summary: {
      active_source_artifacts: sourceManifest.entries.length,
      scenario_count: 1,
      lens_count: lensRegistry.length,
      preserved_collision_count: project2025ReadModel.summary.collision_count,
      unresolved_condition_count: project2025ReadModel.summary.unresolved_count,
      accepted_civic_genome_bindings: 0,
      database_tables: 0
    },
    capabilities: capabilities(),
    scenarios: [
      {
        scenario_id: project2025ReadModel.scenario_id,
        policy_family_id: project2025ReadModel.policy_family_id,
        title: project2025ReadModel.title,
        subtitle: project2025ReadModel.subtitle,
        state: project2025ReadModel.status,
        mechanism_count: project2025ReadModel.summary.mechanism_count,
        operation_count: project2025ReadModel.summary.operation_count,
        lens_count: project2025ReadModel.summary.lens_count,
        collision_count: project2025ReadModel.summary.collision_count,
        unresolved_count: project2025ReadModel.summary.unresolved_count,
        href: '/project2025/title-vii',
        receipt_href: '/v1/project2025/title-vii/receipt',
        read_model_hash: project2025ReadModel.read_model_hash
      }
    ],
    lens_registry: lensRegistry,
    source_corpus: {
      manifest_id: sourceManifest.manifest_id,
      entry_count: sourceManifest.entries.length,
      corpus_policy: sourceManifest.corpus_policy,
      identity_rule: sourceManifest.identity_rule,
      embedded_in_runtime: false,
      selected_subset: false
    },
    platform_contracts: platformContracts(),
    receipts: [
      {
        receipt_id: 'project2025_title_vii_vertical_slice.v1',
        label: 'Project 2025 Title VII deterministic run',
        state: 'executed_test_fixture',
        receipt_hash: project2025Receipt.receipt_hash,
        run_id: project2025Receipt.run_id,
        href: '/v1/project2025/title-vii/receipt'
      },
      {
        receipt_id: civicGenomeHandoffReceipt.receipt_id,
        label: 'Civic Genome authenticated handoff — WA HB2487',
        state: civicGenomeHandoffReceipt.delivery_receipt.validation_state,
        receipt_hash: civicGenomeHandoffReceipt.delivery_receipt.delivery_receipt_hash,
        source_snapshot_hash: civicGenomeHandoffReceipt.source_snapshot.snapshot_hash,
        persisted: civicGenomeHandoffReceipt.write_and_execution_boundary.kaleidoscope_persisted,
        projection_executed: civicGenomeHandoffReceipt.write_and_execution_boundary.kaleidoscope_projection_executed,
        binding_state: civicGenomeHandoffReceipt.binding.binding_state
      }
    ],
    system_boundary: {
      database_persistence: false,
      canonical_projection_execution: false,
      upstream_mutation: false,
      hidden_composite_score: false,
      runtime_ai_dependency: false,
      unresolved_states_preserved: true,
      source_identity_rule: 'exact_byte_length_and_sha256'
    },
    routes: {
      app: KALEIDOSCOPE_APP_PATH,
      platform_read_model: KALEIDOSCOPE_APP_READ_MODEL_PATH,
      project2025_scenario: '/project2025/title-vii',
      health: '/health',
      status: '/v1/status'
    }
  };

  return {
    ...basis,
    read_model_hash: sha256Hex(basis)
  };
}

async function textAsset(asset) {
  const body = await readFile(new URL(asset.file, import.meta.url), 'utf8');
  return {
    statusCode: 200,
    contentType: asset.contentType,
    body,
    cacheControl: 'no-store'
  };
}

export async function resolveKaleidoscopePlatformFrontendRequest(pathname) {
  if (pathname === KALEIDOSCOPE_APP_PATH || pathname === `${KALEIDOSCOPE_APP_PATH}/`) {
    return {
      ...(await textAsset(HTML_ASSET)),
      headers: SECURITY_HEADERS
    };
  }

  const asset = ASSET_ROUTES.get(pathname);
  if (asset) {
    return {
      ...(await textAsset(asset)),
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  if (pathname === KALEIDOSCOPE_APP_READ_MODEL_PATH) {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(canonicalValue(kaleidoscopePlatformReadModel())),
      cacheControl: 'no-store',
      headers: { 'x-content-type-options': 'nosniff' }
    };
  }

  return null;
}
