import { sha256Hex } from './hash.mjs';

export const STRUCTURAL_DELTA_CONTRACT_ID =
  'https://luminari.org/kaleidoscope/contracts/legislative-consequence-structural-delta.v1.json';
export const CONSEQUENCE_EDGE_CONTRACT_ID =
  'https://luminari.org/kaleidoscope/contracts/legislative-consequence-edge.v1.json';
export const LEGISLATION_PLATFORM_BINDING_CONTRACT_ID =
  'https://luminari.org/kaleidoscope/contracts/legislation-source-platform-binding.v1.json';

const HEX64 = /^[0-9a-f]{64}$/;
const DELTA_TYPES = new Set(['added', 'removed', 'modified', 'preserved', 'superseded', 'preempted', 'unresolved']);
const EVIDENCE_CEILINGS = new Set(['direct_text', 'logical_necessity', 'historical_record', 'supported_inference', 'hypothesis_only']);
const PLATFORM_OWNERS = new Set(['docket_room', 'rosetta', 'civic_genome']);
const EDGE_RULES = new Map([
  ['direct_legal_effect', new Set(['directly_prescribed'])],
  ['preserved_invariant', new Set(['directly_prescribed'])],
  ['necessary_operational_effect', new Set(['logically_necessary'])],
  ['historical_analogue', new Set(['historically_observed'])],
  ['jurisdictional_fragmentation', new Set(['directly_prescribed', 'logically_necessary', 'supported_inference'])],
  ['possible_downstream_effect', new Set(['supported_inference', 'hypothesis_only', 'causation_not_asserted'])],
  ['unresolved_relationship', new Set(['hypothesis_only', 'causation_not_asserted'])]
]);

function fail(code, detail = '') {
  throw new Error(`invalid_legislative_consequence:${code}${detail ? `:${detail}` : ''}`);
}
function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object_required', label);
  return value;
}
function string(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('string_required', label);
  return value;
}
function array(value, label) {
  if (!Array.isArray(value)) fail('array_required', label);
  return value;
}
function hash(value, label) {
  const candidate = string(value, label);
  if (!HEX64.test(candidate)) fail('sha256_required', label);
  return candidate;
}
function uniqueStrings(value, label) {
  const rows = array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
  if (new Set(rows).size !== rows.length) fail('unique_values_required', label);
  return rows;
}

export function structuralDeltaHashBasis(delta) {
  const row = record(delta, 'delta');
  const { delta_hash: _ignored, ...basis } = row;
  return basis;
}
export function structuralDeltaBundleHashBasis(bundle) {
  const row = record(bundle, 'bundle');
  const { bundle_hash: _ignored, ...basis } = row;
  return basis;
}
export function consequenceEdgeHashBasis(edge) {
  const row = record(edge, 'edge');
  const { edge_hash: _ignored, ...basis } = row;
  return basis;
}
export function consequenceGraphHashBasis(graph) {
  const row = record(graph, 'graph');
  const { graph_hash: _ignored, ...basis } = row;
  return basis;
}
export function legislationPlatformBindingHashBasis(bundle) {
  const row = record(bundle, 'legislation_platform_bindings');
  const { platform_binding_bundle_hash: _ignored, ...basis } = row;
  return basis;
}

export function assertLegislationPlatformBindings(bundle) {
  const row = record(bundle, 'legislation_platform_bindings');
  if (row.platform_binding_bundle_version !== '1.0.0') fail('platform_binding_version_mismatch');
  string(row.platform_binding_bundle_id, 'platform_binding_bundle_id');
  string(row.scenario_id, 'platform_binding_scenario_id');

  const bindings = array(row.bindings, 'platform_bindings.bindings');
  if (!Number.isInteger(row.binding_count) || row.binding_count !== bindings.length) {
    fail('platform_binding_count_mismatch');
  }
  const bindingIds = new Set();
  const owners = new Set();
  for (const binding of bindings) {
    const entry = record(binding, 'platform_binding');
    const bindingId = string(entry.binding_id, 'platform_binding.binding_id');
    if (bindingIds.has(bindingId)) fail('duplicate_platform_binding_id', bindingId);
    bindingIds.add(bindingId);
    const owner = string(entry.owner_platform, 'platform_binding.owner_platform');
    if (!PLATFORM_OWNERS.has(owner)) fail('platform_owner_not_governed', owner);
    owners.add(owner);
    string(entry.binding_type, 'platform_binding.binding_type');
    string(entry.verification_state, 'platform_binding.verification_state');
    uniqueStrings(entry.unresolved_conditions, 'platform_binding.unresolved_conditions');

    if (owner === 'docket_room') {
      if (!Number.isInteger(entry.source_bill_id)) fail('docket_source_bill_id_required', bindingId);
      string(entry.source_bill_number, 'docket.source_bill_number');
      string(entry.source_bill_title, 'docket.source_bill_title');
      string(entry.source_last_action, 'docket.source_last_action');
      string(entry.source_change_hash, 'docket.source_change_hash');
    }
    if (owner === 'rosetta') {
      if (!Number.isInteger(entry.source_document_id)) fail('rosetta_source_document_id_required', bindingId);
      string(entry.extraction_run_id, 'rosetta.extraction_run_id');
      hash(entry.source_identity_hash, 'rosetta.source_identity_hash');
      hash(entry.source_byte_hash, 'rosetta.source_byte_hash');
      hash(entry.source_content_hash, 'rosetta.source_content_hash');
      hash(entry.output_content_hash, 'rosetta.output_content_hash');
      string(entry.engine_version, 'rosetta.engine_version');
      string(entry.rule_set_version, 'rosetta.rule_set_version');
    }
    if (owner === 'civic_genome') {
      const hasCanonicalIdentity = typeof entry.genome_bill_id === 'string'
        || typeof entry.assembly_run_id === 'string'
        || typeof entry.event_id === 'string'
        || typeof entry.family_id === 'string';
      if (!hasCanonicalIdentity) fail('civic_genome_identity_required', bindingId);
      if (entry.binding_type === 'structural_assembly_receipt') {
        if (entry.run_status !== 'completed' || entry.verification_state !== 'complete') {
          fail('civic_genome_assembly_not_complete', bindingId);
        }
        if (!Number.isInteger(entry.trait_count)
            || !Array.isArray(entry.trait_manifest)
            || entry.trait_count !== entry.trait_manifest.length) {
          fail('civic_genome_trait_manifest_mismatch', bindingId);
        }
        for (const trait of entry.trait_manifest) {
          string(trait.trait_id, 'trait.trait_id');
          string(trait.trait_key, 'trait.trait_key');
          hash(trait.content_hash, 'trait.content_hash');
          if (trait.verification_state !== 'confirmed' || trait.confidence_score !== 1) {
            fail('civic_genome_trait_not_confirmed', trait.trait_id);
          }
        }
        if (entry.prism_binding_count === 0 && entry.prism_observation_state !== 'not_observed') {
          fail('prism_zero_binding_state_mismatch');
        }
      }
    }
  }
  if (!owners.has('docket_room') || !owners.has('civic_genome')) {
    fail('docket_and_civic_genome_bindings_required');
  }

  const conflicts = array(row.conflicts, 'platform_bindings.conflicts');
  if (!Number.isInteger(row.conflict_count) || row.conflict_count !== conflicts.length) {
    fail('platform_conflict_count_mismatch');
  }
  for (const conflict of conflicts) {
    const entry = record(conflict, 'platform_conflict');
    string(entry.conflict_id, 'platform_conflict.conflict_id');
    for (const bindingId of uniqueStrings(entry.binding_ids, 'platform_conflict.binding_ids')) {
      if (!bindingIds.has(bindingId)) fail('platform_conflict_unknown_binding', bindingId);
    }
    if (entry.resolution_state !== 'unresolved_preserved') {
      fail('platform_conflict_must_remain_unresolved');
    }
    if (entry.prohibited_resolution !== 'do_not_silently_choose_or_overwrite_any_source_record') {
      fail('platform_conflict_prohibition_missing');
    }
  }
  uniqueStrings(row.unresolved_conditions, 'platform_bindings.unresolved_conditions');
  const observedHash = hash(row.platform_binding_bundle_hash, 'platform_binding_bundle_hash');
  const expectedHash = sha256Hex(legislationPlatformBindingHashBasis(row));
  if (observedHash !== expectedHash) fail('platform_binding_bundle_hash_mismatch');
  return row;
}

export function assertStructuralDeltaBundle(bundle, sourceBundle) {
  const row = record(bundle, 'bundle');
  const source = record(sourceBundle, 'source_bundle');
  if (row.engine_id !== 'legislative_consequence_engine') fail('engine_id_mismatch');
  if (row.bundle_version !== '1.0.0') fail('bundle_version_mismatch');
  if (row.source_bundle_id !== source.source_bundle_id) fail('source_bundle_id_mismatch');
  if (row.source_bundle_hash !== source.source_bundle_hash) fail('source_bundle_hash_mismatch');
  const sourceHash = sha256Hex((({ source_bundle_hash, ...basis }) => basis)(source));
  if (source.source_bundle_hash !== sourceHash) fail('source_bundle_content_hash_mismatch');

  const sourceIds = new Set(array(source.sources, 'source_bundle.sources').map((entry) => string(entry.source_id, 'source_id')));
  const deltas = array(row.deltas, 'bundle.deltas');
  if (!Number.isInteger(row.delta_count) || row.delta_count !== deltas.length) fail('delta_count_mismatch');
  const ids = new Set();
  for (const delta of deltas) {
    const d = record(delta, 'delta');
    const id = string(d.delta_id, 'delta.delta_id');
    if (ids.has(id)) fail('duplicate_delta_id', id);
    ids.add(id);
    if (!DELTA_TYPES.has(d.delta_type)) fail('delta_type_invalid', id);
    if (!EVIDENCE_CEILINGS.has(d.evidence_ceiling)) fail('delta_evidence_ceiling_invalid', id);
    const citations = array(d.legal_citations, 'delta.legal_citations');
    if (citations.length === 0) fail('delta_citation_required', id);
    for (const citation of citations) {
      if (!sourceIds.has(citation.source_id)) fail('unknown_source_id', citation.source_id);
      string(citation.legal_citation, 'citation.legal_citation');
      string(citation.locator, 'citation.locator');
      string(citation.quote_basis, 'citation.quote_basis');
    }
    uniqueStrings(d.actor_ids, 'delta.actor_ids');
    uniqueStrings(d.unresolved_conditions, 'delta.unresolved_conditions');
    if (hash(d.delta_hash, 'delta.delta_hash') !== sha256Hex(structuralDeltaHashBasis(d))) {
      fail('delta_hash_mismatch', id);
    }
    if (d.delta_type === 'unresolved' && d.verification_state !== 'explicitly_unresolved') {
      fail('unresolved_delta_must_be_explicit', id);
    }
  }
  if (hash(row.bundle_hash, 'bundle.bundle_hash') !== sha256Hex(structuralDeltaBundleHashBasis(row))) {
    fail('bundle_hash_mismatch');
  }
  return row;
}

export function assertConsequenceGraph(graph, deltaBundle, sourceBundle) {
  const deltas = assertStructuralDeltaBundle(deltaBundle, sourceBundle);
  const row = record(graph, 'graph');
  if (row.engine_id !== 'legislative_consequence_engine') fail('graph_engine_id_mismatch');
  if (row.graph_version !== '1.0.0') fail('graph_version_mismatch');
  if (row.source_delta_bundle_id !== deltas.bundle_id) fail('graph_delta_bundle_id_mismatch');
  if (row.source_delta_bundle_hash !== deltas.bundle_hash) fail('graph_delta_bundle_hash_mismatch');

  const deltaIds = new Set(deltas.deltas.map((delta) => delta.delta_id));
  const sourceIds = new Set(sourceBundle.sources.map((source) => source.source_id));
  const edges = array(row.edges, 'graph.edges');
  if (!Number.isInteger(row.edge_count) || row.edge_count !== edges.length) fail('edge_count_mismatch');
  const edgeIds = new Set();
  for (const edge of edges) {
    const e = record(edge, 'edge');
    const id = string(e.edge_id, 'edge.edge_id');
    if (edgeIds.has(id)) fail('duplicate_edge_id', id);
    edgeIds.add(id);
    for (const deltaId of uniqueStrings(e.from_delta_ids, 'edge.from_delta_ids')) {
      if (!deltaIds.has(deltaId)) fail('edge_unknown_delta', deltaId);
    }
    const allowed = EDGE_RULES.get(e.relationship_type);
    if (!allowed || !allowed.has(e.causal_state)) fail('edge_causal_state_not_allowed', id);
    if (!EVIDENCE_CEILINGS.has(e.evidence_ceiling)) fail('edge_evidence_ceiling_invalid', id);
    for (const binding of array(e.source_bindings, 'edge.source_bindings')) {
      if (!sourceIds.has(binding.source_id)) fail('edge_unknown_source', binding.source_id);
      string(binding.locator, 'edge.source_binding.locator');
    }
    uniqueStrings(e.unresolved_conditions, 'edge.unresolved_conditions');
    if (hash(e.edge_hash, 'edge.edge_hash') !== sha256Hex(consequenceEdgeHashBasis(e))) {
      fail('edge_hash_mismatch', id);
    }
  }
  if (hash(row.graph_hash, 'graph.graph_hash') !== sha256Hex(consequenceGraphHashBasis(row))) {
    fail('graph_hash_mismatch');
  }
  return row;
}

export function assertLegislativeConsequenceFixture(fixture) {
  const row = record(fixture, 'fixture');
  if (row.fixture_state !== 'definition_and_deterministic_contract_only') fail('fixture_state_mismatch');
  if (row.projection_executed !== false || row.database_persisted !== false) {
    fail('fixture_overstates_execution');
  }
  const platformBindings = assertLegislationPlatformBindings(row.legislation_platform_bindings);
  if (platformBindings.scenario_id !== row.source_bundle.scenario_id) {
    fail('platform_binding_scenario_mismatch');
  }

  const rosetta = platformBindings.bindings.find(
    (entry) => entry.binding_id === 'rosetta:extraction_run:26'
  );
  const assembly = platformBindings.bindings.find(
    (entry) => entry.binding_id === 'civic_genome:assembly:6c5b1326-3c96-41d3-8950-ddc46cb5ebf5'
  );
  const genomeBill = platformBindings.bindings.find(
    (entry) => entry.binding_id === 'civic_genome:bill:ea189395-af71-4d61-907a-508220d6d410'
  );
  if (!genomeBill) fail('hb1207_structural_chain_incomplete');
  if (!!rosetta !== !!assembly) fail('hb1207_partial_rosetta_chain_invalid');
  if (rosetta && assembly) {
    const officialColoradoSource = row.source_bundle.sources.find(
      (source) => source.source_id === rosetta.official_source_id
    );
    if (!officialColoradoSource) fail('rosetta_official_source_missing');
    if (officialColoradoSource.raw_byte_sha256 !== rosetta.source_byte_hash) {
      fail('rosetta_source_byte_hash_mismatch');
    }
    if (assembly.extraction_run_id !== rosetta.extraction_run_id) {
      fail('rosetta_assembly_extraction_mismatch');
    }
    if (assembly.output_hash !== genomeBill.structural_dna_hash) {
      fail('assembly_bill_output_hash_mismatch');
    }
    if (assembly.trait_count !== genomeBill.trait_count) {
      fail('assembly_bill_trait_count_mismatch');
    }
  }

  assertConsequenceGraph(row.consequence_graph, row.structural_delta_bundle, row.source_bundle);
  if (row.impact_surface !== null
      || row.atlas_historical_compare !== null
      || row.lighthouse_accountability_view !== null
      || row.instantiated_checklist !== null) {
    fail('later_stages_must_remain_uninstantiated');
  }
  return row;
}
