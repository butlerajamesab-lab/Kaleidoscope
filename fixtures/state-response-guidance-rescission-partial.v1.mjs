export default {
  as_of_date: '2026-08-13',
  mechanism: {
    mechanism_id: 'P25-DOL-01',
    proposal_source: {document_id: 'project2025_catalog_pass1', verification_state: 'secondary_verified'},
    observed_implementation: {
      status: 'operative',
      events: [{event_id: 'eeoc-2026-rescission', title: 'EEOC guidance rescission', operative: true, procedural_posture: 'agency rescission operative; underlying Title VII and controlling precedent not treated as rescinded'}]
    },
    implementation_path: {path_type: 'mixed'},
    affected_populations: ['workers protected by state law', 'workers relying on federal enforcement', 'people outside state/local coverage'],
    unresolved_questions: ['Exact controlling state-law sources and actor authority remain incomplete for this baseline.']
  },
  state: {
    jurisdiction_id: 'US-CA-illustrative-partial',
    as_of_date: '2026-08-13',
    summary: 'Illustrative partial baseline: an explicit statewide protection and independent enforcement agency are indicated, but controlling code provisions and complete actor authorities have not been primary-verified in this corpus.',
    source_coverage: {completeness: 'partial', missing_primary_sources: ['controlling state code provisions', 'agency enforcement authority', 'relevant state precedent']},
    evidence_summary: {primary_sources: [], secondary_sources: ['P25-DOL-01 state inventory'], missing_sources: ['controlling state code provisions', 'agency enforcement authority', 'relevant state precedent']},
    unresolved_questions: ['Which exact state provisions and remedies control?']
  },
  candidates: [{
    pathway_id: 'ca-partial-preserve-enforcement',
    outcome_class: 'preserve',
    state_actor: 'state_agency',
    action: 'Continue state-law intake and enforcement to the extent confirmed by controlling state authority.',
    authority_basis: ['State civil-rights authority indicated but exact primary citation remains unresolved.'],
    target: 'enforcement_gap',
    timing: {phase: 'continuing', opens_on: null, closes_on: null, trigger_events: ['federal guidance rescission']},
    constraints: [{type: 'federal_preemption_conflict', effect: 'limits', outcome_determinative: false, reasoning: 'State action must rest on independent state law and cannot alter federal law.'}],
    expected_effect: {legal_effect: 'moderate', population_coverage: 'state-law coverage only', duration: 'statutory'},
    feasibility: {legal: 'unknown', institutional: 'medium', fiscal: 'unknown', temporal: 'high'},
    risk: {preemption: 'medium', adverse_precedent: 'unknown', loss_of_federal_funds: 'unknown', implementation_failure: 'medium'},
    confidence: 'low',
    verification_state: 'unresolved',
    explanation: 'A preservation pathway is structurally plausible, but this corpus does not contain the primary state sources required to verify it.',
    contrary_authority: [], unresolved_questions: ['Exact statutory and agency authority'],
    ranking: {legal_viability:2,expected_effect:3,durability:3,population_coverage:3,institutional_feasibility:3,temporal_urgency:2,evidentiary_confidence:1,preemption_risk:2,adverse_precedent_risk:2,fiscal_burden:2}
  }],
  no_go_paths: [{proposed_action: 'Rescind the federal executive or agency action by state order', reason_foreclosed: 'A state actor cannot rescind a federal instrument.', authority: ['Supremacy Clause boundary']}],
  watch_events: [{event: 'Primary state sources retrieved and verified', consequence: 'Baseline and pathway may be eligible for accepted status.'}]
};
