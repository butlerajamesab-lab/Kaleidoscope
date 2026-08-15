import { sha256Hex } from './hash.mjs';

export const STATE_RESPONSE_ENGINE_ID = 'kaleidoscope_state_response_resolver';
export const STATE_RESPONSE_ENGINE_VERSION = '1.0.0';
export const STATE_RESPONSE_RESULT_PATH = '/v1/state-response/result';

const VERIFICATION = new Set(['primary_verified','primary_adjacent','secondary_verified','locator_only','unresolved','contradicted','superseded']);
const OUTCOMES = new Set(['prevent','enjoin','delay','preserve','insulate','backfill','mitigate','route_around','lawfully_decline_participation','monitor_and_prepare','no_viable_state_block_identified','unknown']);
const ACTORS = new Set(['governor','attorney_general','legislature','state_agency','state_court','local_government','public_university','state_contractor','interstate_compact','tribal_government','other']);
const SCORE_FIELDS = ['legal_viability','expected_effect','durability','population_coverage','institutional_feasibility','temporal_urgency','evidentiary_confidence','preemption_risk','adverse_precedent_risk','fiscal_burden'];

function fail(code, detail = '') {
  throw new Error(`invalid_state_response_projection:${code}${detail ? `:${detail}` : ''}`);
}

function required(value, code) {
  if (value === null || value === undefined || value === '') fail(code);
  return value;
}

function score(pathway) {
  const values = {};
  for (const field of SCORE_FIELDS) {
    const value = pathway.ranking?.[field];
    if (!Number.isInteger(value) || value < 0 || value > 5) fail('ranking_dimension_invalid', `${pathway.pathway_id}.${field}`);
    values[field] = value;
  }
  return {
    ...values,
    priority_score: values.legal_viability + values.expected_effect + values.durability
      + values.population_coverage + values.institutional_feasibility + values.temporal_urgency
      + values.evidentiary_confidence - values.preemption_risk
      - values.adverse_precedent_risk - values.fiscal_burden
  };
}

function validateMechanism(mechanism) {
  required(mechanism?.mechanism_id, 'mechanism_id_required');
  required(mechanism?.proposal_source, 'proposal_source_required');
  if (!mechanism.observed_implementation?.events?.length) fail('operative_instrument_not_identified');
  const operative = mechanism.observed_implementation.events.filter((event) => event.operative === true);
  if (operative.length === 0) fail('operative_instrument_not_identified');
  if (operative.length > 1) fail('single_operative_instrument_required');
  required(mechanism.implementation_path?.path_type, 'implementation_path_required');
  return operative[0];
}

function validateBaseline(state) {
  required(state?.jurisdiction_id, 'jurisdiction_id_required');
  required(state?.as_of_date, 'baseline_as_of_date_required');
  if (state.source_coverage?.completeness === 'unknown') fail('state_baseline_unknown');
  if (!Array.isArray(state.source_coverage?.missing_primary_sources)) fail('missing_primary_sources_required');
}

function validatePathway(pathway, asOfDate) {
  required(pathway.pathway_id, 'pathway_id_required');
  if (!OUTCOMES.has(pathway.outcome_class)) fail('outcome_invalid', pathway.pathway_id);
  if (!ACTORS.has(pathway.state_actor)) fail('state_actor_invalid', pathway.pathway_id);
  if (!pathway.authority_basis?.length) fail('authority_basis_unconfirmed', pathway.pathway_id);
  if (!pathway.constraints?.length) fail('constraint_test_required', pathway.pathway_id);
  if (!pathway.timing?.phase) fail('response_window_required', pathway.pathway_id);
  if (pathway.timing.closes_on && pathway.timing.closes_on < asOfDate) fail('response_window_expired', pathway.pathway_id);
  if (!VERIFICATION.has(pathway.verification_state)) fail('verification_state_invalid', pathway.pathway_id);
  const decisiveUnknown = pathway.constraints.find((constraint) => constraint.outcome_determinative && constraint.effect === 'uncertain');
  if (decisiveUnknown) fail('outcome_determinative_constraint_unresolved', pathway.pathway_id);
  return {...pathway, ranking: score(pathway)};
}

export function resolveStateResponse({mechanism, state, as_of_date, candidates = [], no_go_paths = [], watch_events = []}) {
  required(as_of_date, 'as_of_date_required');
  const operative = validateMechanism(mechanism);
  validateBaseline(state);
  const pathways = candidates.map((candidate) => validatePathway(candidate, as_of_date))
    .sort((a, b) => b.ranking.priority_score - a.ranking.priority_score || a.pathway_id.localeCompare(b.pathway_id));
  const evidenceLimited = state.source_coverage.completeness !== 'complete' || state.source_coverage.missing_primary_sources.length > 0;
  const result = {
    run_id: `ksr-${sha256Hex({mechanism_id: mechanism.mechanism_id, jurisdiction_id: state.jurisdiction_id, as_of_date, pathways}).slice(0, 32)}`,
    generated_at: null,
    as_of_date,
    mechanism_id: mechanism.mechanism_id,
    mechanism: {
      title: mechanism.title,
      policy_family: mechanism.policy_family,
      proposal_summary: mechanism.proposal_summary,
      proposal_source: mechanism.proposal_source,
      asserted_authority: mechanism.asserted_authority ?? [],
      required_instrument: mechanism.required_instrument ?? [],
      implementation_events: mechanism.observed_implementation.events,
      implementation_edges: mechanism.implementation_path.chain_edges ?? [],
      match_classification: mechanism.match_classification,
      affected_federal_systems: mechanism.affected_federal_systems ?? [],
      affected_state_local_systems: mechanism.affected_state_local_systems ?? []
    },
    jurisdiction_id: state.jurisdiction_id,
    current_status: {
      proposal_status: mechanism.proposal_source.verification_state,
      implementation_status: mechanism.observed_implementation.status,
      operative_instrument: operative.title,
      procedural_posture: operative.procedural_posture
    },
    state_baseline_summary: state.summary,
    pathways,
    no_go_paths,
    watch_events,
    affected_populations: mechanism.affected_populations ?? [],
    evidence_summary: state.evidence_summary,
    unresolved_questions: [...(mechanism.unresolved_questions ?? []), ...(state.unresolved_questions ?? [])],
    acceptance_state: evidenceLimited ? 'fail_closed_missing_primary_sources' : 'accepted_evidence_bound_projection',
    disclaimer: 'Research and civic-analysis output; not legal advice.'
  };
  return {...result, result_hash: sha256Hex(result)};
}
