import sourceBundle from '../source_bundles/eeoc_demographics_reporting_rollback_2026.v1.json' with { type: 'json' };
import { sha256Hex } from '../src/hash.mjs';

const NPRM = 'eeoc_nprm_rin_3046_ab37_2026_07_21';
const ECFR = 'ecfr_title_29_part_1602_2026_07_31';
const COLORADO = 'colorado_hb26_1207_signed_act_2026_06_04';

function citation(source_id, legal_citation, locator, quote_basis) {
  return { source_id, legal_citation, locator, quote_basis };
}
function delta(input) {
  const row = { ...input };
  row.delta_hash = sha256Hex(row);
  return row;
}

const filings = [
  ['eeo1', '29 CFR § 1602.7', 'private employers and covered federal contractors', 'annual', 'EEO-1'],
  ['eeo2', '29 CFR § 1602.15', 'covered apprenticeship committees', 'annual', 'EEO-2'],
  ['eeo3', '29 CFR § 1602.22', 'covered labor organizations', 'biennial', 'EEO-3'],
  ['eeo4', '29 CFR § 1602.32', 'covered state and local governments', 'biennial', 'EEO-4'],
  ['eeo5', '29 CFR § 1602.41', 'covered public elementary and secondary school systems and districts', 'biennial', 'EEO-5'],
  ['eeo6', '29 CFR § 1602.50', 'covered institutions of higher education', 'biennial', 'EEO-6']
];

const deltas = filings.map(([key, section, actor, frequency, report]) => delta({
  delta_id: `lcd-eeoc-2026-${key}-filing-removed`,
  delta_type: 'removed',
  subject_type: 'legal_obligation',
  obligation_type: 'file_report',
  reporting_vector: 'federal_periodic_mass_reporting',
  baseline_component_id: `ecfr:${section.replaceAll(' ', '_')}`,
  proposed_component_id: null,
  actor_ids: [actor],
  baseline_state: { status: 'operative', text: `${actor} must file the ${report} report on the codified schedule (${frequency}).` },
  proposed_state: { status: 'removed', text: `The proposed republication omits the ${report} filing requirement.` },
  legal_citations: [
    citation(ECFR, section, section, `Codified ${report} filing requirement.`),
    citation(NPRM, section, 'PDF pp. 31-34 and proposed republication pp. 53-63', 'Section-by-section removal and omission from the republished part.')
  ],
  evidence_class: 'codified_baseline_and_primary_proposed_rule',
  evidence_ceiling: 'direct_text',
  verification_state: 'source_text_confirmed',
  unresolved_conditions: []
}));

deltas.push(
  delta({
    delta_id: 'lcd-eeoc-2026-report-specific-recordkeeping-removed',
    delta_type: 'removed', subject_type: 'legal_obligation', obligation_type: 'make_records',
    reporting_vector: 'report_specific_internal_recordkeeping',
    baseline_component_id: 'ecfr:29_cfr_part_1602_report_specific_recordkeeping', proposed_component_id: null,
    actor_ids: ['covered employers', 'labor organizations', 'state and local governments', 'public schools', 'higher education institutions'],
    baseline_state: { status: 'operative', text: 'Covered entities must make or keep records needed to complete designated EEO reports.' },
    proposed_state: { status: 'removed', text: 'The proposal removes report-linked making, keeping, and preservation duties while retaining specified general preservation provisions.' },
    legal_citations: [
      citation(ECFR, '29 CFR Part 1602', '29 CFR §§ 1602.12, 1602.30, 1602.39, 1602.48', 'Report-linked recordkeeping baseline.'),
      citation(NPRM, '29 CFR Part 1602', 'PDF pp. 1, 7 n.5, 31-34', 'Proposal removes report-related recordkeeping while distinguishing preserved general provisions.')
    ],
    evidence_class: 'codified_baseline_and_primary_proposed_rule', evidence_ceiling: 'direct_text',
    verification_state: 'source_text_confirmed', unresolved_conditions: []
  }),
  delta({
    delta_id: 'lcd-eeoc-2026-general-record-preservation-preserved',
    delta_type: 'preserved', subject_type: 'legal_obligation', obligation_type: 'preserve_records',
    reporting_vector: 'general_internal_record_preservation',
    baseline_component_id: 'ecfr:29_cfr_1602_general_preservation',
    proposed_component_id: 'proposed:29_cfr_1602_republished_preservation',
    actor_ids: ['covered employers', 'labor organizations', 'state and local governments', 'public schools', 'higher education institutions'],
    baseline_state: { status: 'operative', text: 'General personnel and employment record-preservation duties apply independently of EEO report completion.' },
    proposed_state: { status: 'operative', text: 'The proposal republishes general preservation provisions and states they are not being rescinded.' },
    legal_citations: [
      citation(ECFR, '29 CFR §§ 1602.14, 1602.31, 1602.40', 'codified sections', 'General record-preservation baseline.'),
      citation(NPRM, '29 CFR §§ 1602.14, 1602.31, 1602.40', 'PDF p. 7 n.5 and pp. 53-63', 'Express invariant and republished provisions.')
    ],
    evidence_class: 'codified_baseline_and_primary_proposed_rule', evidence_ceiling: 'direct_text',
    verification_state: 'source_text_confirmed', unresolved_conditions: []
  }),
  delta({
    delta_id: 'lcd-eeoc-2026-charge-specific-record-request-preserved',
    delta_type: 'preserved', subject_type: 'enforcement_authority', obligation_type: 'provide_charge_specific_records',
    reporting_vector: 'charge_specific_request',
    baseline_component_id: 'statute:42_usc_2000e_8_c', proposed_component_id: 'statute:42_usc_2000e_8_c',
    actor_ids: ['EEOC', 'particular respondent employer'],
    baseline_state: { status: 'operative', text: 'The EEOC may request records relevant to determining whether unlawful employment practices occurred in a particular investigation.' },
    proposed_state: { status: 'operative', text: 'The proposal expressly states that tailored charge-investigation authority remains unchanged.' },
    legal_citations: [citation(NPRM, '42 U.S.C. § 2000e-8(c)', 'PDF pp. 10-11', 'Proposal distinguishes routine mass reports from tailored records requests in a charge investigation.')],
    evidence_class: 'primary_proposed_rule', evidence_ceiling: 'direct_text',
    verification_state: 'source_text_confirmed', unresolved_conditions: []
  }),
  delta({
    delta_id: 'lcd-eeoc-2026-apprenticeship-recordkeeping-modified',
    delta_type: 'modified', subject_type: 'legal_obligation', obligation_type: 'make_records',
    reporting_vector: 'apprenticeship_recordkeeping',
    baseline_component_id: 'ecfr:29_cfr_1602_20', proposed_component_id: 'proposed:29_cfr_1602_20_republished',
    actor_ids: ['covered apprenticeship program controllers'],
    baseline_state: { status: 'operative', text: 'Section 1602.20 includes apprenticeship recordkeeping categories extending beyond the statutory minimum.' },
    proposed_state: { status: 'narrowed', text: 'The proposal conforms apprenticeship recordkeeping to the minimum requirement imposed by Title VII section 709(c), removing race and sex categorizations.' },
    legal_citations: [
      citation(ECFR, '29 CFR § 1602.20', 'codified section', 'Baseline apprenticeship recordkeeping.'),
      citation(NPRM, '29 CFR § 1602.20', 'PDF pp. 10-11, 31, 54-56', 'Proposed narrowing and republished text.')
    ],
    evidence_class: 'codified_baseline_and_primary_proposed_rule', evidence_ceiling: 'direct_text',
    verification_state: 'source_text_confirmed', unresolved_conditions: []
  }),
  delta({
    delta_id: 'lcd-eeoc-2026-pwfa-reference-intent-unresolved',
    delta_type: 'unresolved', subject_type: 'authority_reference', obligation_type: 'none', reporting_vector: 'none',
    baseline_component_id: 'nprm:2024_pwfa_part_1602_proposal',
    proposed_component_id: 'nprm:2026_intended_final_incorporation', actor_ids: ['EEOC'],
    baseline_state: { status: 'previously_proposed', text: 'A November 2024 NPRM proposed adding PWFA references to selected Part 1602 provisions.' },
    proposed_state: { status: 'not_in_current_final_state', text: 'The July 2026 NPRM states an intent to incorporate those references in a later final rule; no final text exists in this specimen.' },
    legal_citations: [citation(NPRM, '29 CFR Part 1602 / PWFA', 'PDF pp. 1, 29-30', 'Stated future intent rather than completed operative change.')],
    evidence_class: 'primary_proposed_rule', evidence_ceiling: 'hypothesis_only',
    verification_state: 'explicitly_unresolved',
    unresolved_conditions: ['final_rule_text_not_issued', 'no_current_operational_delta_should_be_inferred']
  }),
  delta({
    delta_id: 'lcd-eeoc-2026-colorado-eeo1-state-duty-added',
    delta_type: 'added', subject_type: 'legal_obligation', obligation_type: 'file_report',
    reporting_vector: 'state_periodic_reporting', baseline_component_id: null,
    proposed_component_id: 'colorado:hb26_1207',
    actor_ids: ['private entities doing business in Colorado with 100 or more workers'],
    baseline_state: { status: 'absent', text: 'No Colorado-specific EEO-1 demographic reporting duty under this enacted act was operative before its effective schedule.' },
    proposed_state: { status: 'future_operative', text: 'Beginning July 1, 2027, covered employers must report EEO-1 demographic workforce data to the Colorado secretary of state even if the federal requirement is repealed or discontinued.' },
    legal_citations: [citation(COLORADO, 'Colorado HB26-1207, Chapter 378', 'Signed Act', 'Enacted state reporting duty and federal-discontinuation contingency.')],
    evidence_class: 'enacted_state_law', evidence_ceiling: 'direct_text',
    verification_state: 'source_text_confirmed', unresolved_conditions: []
  })
);

const structuralDeltaBasis = {
  bundle_id: 'lcdelta-eeoc-demographics-reporting-rollback-2026-v1', bundle_version: '1.0.0',
  engine_id: 'legislative_consequence_engine', engine_version: '0.1.0',
  scenario_id: 'eeoc_demographics_reporting_rollback_2026',
  baseline_state_id: '29_cfr_part_1602_as_of_2026_07_31',
  proposed_state_id: 'eeoc_rin_3046_ab37_approved_2026_07_21',
  source_bundle_id: sourceBundle.source_bundle_id, source_bundle_hash: sourceBundle.source_bundle_hash,
  delta_count: deltas.length, deltas,
  unresolved_conditions: ['federal_rule_is_proposed_not_final', 'external_primary_source_raw_byte_hashes_pending', 'no_effective_date_for_federal_rescission_exists']
};
export const structuralDeltaBundle = { ...structuralDeltaBasis, bundle_hash: sha256Hex(structuralDeltaBasis) };

function edge(input) { const row = { ...input }; row.edge_hash = sha256Hex(row); return row; }
const filingDeltaIds = filings.map(([key]) => `lcd-eeoc-2026-${key}-filing-removed`);
const edges = [
  edge({ edge_id: 'lce-eeoc-2026-federal-filing-channel-removed', from_delta_ids: filingDeltaIds,
    to_node_id: 'consequence:federal_periodic_eeo_reporting_channel_removed', relationship_type: 'direct_legal_effect',
    causal_state: 'directly_prescribed', evidence_ceiling: 'direct_text',
    explanation: 'If the proposal becomes final as written, the enumerated federal periodic filing duties are removed from Part 1602.',
    source_bindings: [{ source_id: NPRM, locator: 'PDF pp. 1, 31-34, 53-63' }], unresolved_conditions: [] }),
  edge({ edge_id: 'lce-eeoc-2026-federal-aggregate-intake-channel-unavailable', from_delta_ids: filingDeltaIds,
    to_node_id: 'consequence:routine_federal_aggregate_intake_not_generated_under_removed_rules', relationship_type: 'necessary_operational_effect',
    causal_state: 'logically_necessary', evidence_ceiling: 'logical_necessity',
    explanation: 'A reporting channel cannot continue generating submissions under duties that have been removed, absent a separate authority or replacement collection.',
    source_bindings: [{ source_id: NPRM, locator: 'PDF pp. 1, 31-34' }],
    unresolved_conditions: ['replacement_or_voluntary_data_channels_not_evaluated'] }),
  edge({ edge_id: 'lce-eeoc-2026-charge-investigation-path-preserved',
    from_delta_ids: ['lcd-eeoc-2026-charge-specific-record-request-preserved'],
    to_node_id: 'consequence:charge_specific_record_acquisition_remains_available', relationship_type: 'preserved_invariant',
    causal_state: 'directly_prescribed', evidence_ceiling: 'direct_text',
    explanation: 'The proposal expressly preserves tailored requests for records relevant to a particular charge investigation.',
    source_bindings: [{ source_id: NPRM, locator: 'PDF pp. 10-11' }], unresolved_conditions: [] }),
  edge({ edge_id: 'lce-eeoc-2026-federal-colorado-fragmentation',
    from_delta_ids: ['lcd-eeoc-2026-eeo1-filing-removed', 'lcd-eeoc-2026-colorado-eeo1-state-duty-added'],
    to_node_id: 'consequence:federal_state_reporting_duties_diverge', relationship_type: 'jurisdictional_fragmentation',
    causal_state: 'directly_prescribed', evidence_ceiling: 'direct_text',
    explanation: 'Colorado requires the EEO-1 data stream even if the federal government repeals or discontinues its EEO-1 submission requirement.',
    source_bindings: [{ source_id: NPRM, locator: 'PDF pp. 1, 31' }, { source_id: COLORADO, locator: 'Signed Act' }], unresolved_conditions: [] }),
  edge({ edge_id: 'lce-eeoc-2026-component2-historical-analogue', from_delta_ids: ['lcd-eeoc-2026-eeo1-filing-removed'],
    to_node_id: 'historical_analogue:eeo1_component2_pay_data_omitted_2020', relationship_type: 'historical_analogue',
    causal_state: 'historically_observed', evidence_ceiling: 'historical_record',
    explanation: 'The NPRM identifies the prior omission of EEO-1 Component 2 after the agency concluded its burden was not justified by practical utility.',
    source_bindings: [{ source_id: NPRM, locator: 'PDF p. 8' }], unresolved_conditions: [] }),
  edge({ edge_id: 'lce-eeoc-2026-proactive-analysis-effect-unresolved',
    from_delta_ids: ['lcd-eeoc-2026-eeo1-filing-removed', 'lcd-eeoc-2026-report-specific-recordkeeping-removed'],
    to_node_id: 'possible_consequence:federal_proactive_cross_employer_analysis_capacity_changes',
    relationship_type: 'possible_downstream_effect', causal_state: 'hypothesis_only', evidence_ceiling: 'hypothesis_only',
    explanation: 'The source text establishes removal of routine reporting and report-linked records, but it does not itself prove the magnitude or direction of downstream enforcement effects.',
    source_bindings: [{ source_id: NPRM, locator: 'PDF pp. 1, 28-31' }],
    unresolved_conditions: ['empirical_enforcement_effect_not_established', 'alternative_data_sources_not_evaluated', 'causation_not_asserted'] })
];

const consequenceGraphBasis = {
  graph_id: 'lcgraph-eeoc-demographics-reporting-rollback-2026-v1', graph_version: '1.0.0',
  engine_id: 'legislative_consequence_engine', engine_version: '0.1.0',
  scenario_id: 'eeoc_demographics_reporting_rollback_2026',
  source_delta_bundle_id: structuralDeltaBundle.bundle_id,
  source_delta_bundle_hash: structuralDeltaBundle.bundle_hash,
  edge_count: edges.length, edges,
  unresolved_conditions: ['federal_rule_is_proposed_not_final', 'no_numeric_edge_weights_declared', 'downstream_enforcement_effects_not_proven']
};
export const consequenceGraph = { ...consequenceGraphBasis, graph_hash: sha256Hex(consequenceGraphBasis) };

export default {
  fixture_id: 'legislative_consequence_eeoc_demographics_reporting_rollback_2026.v1',
  fixture_version: '1.0.0', fixture_state: 'definition_and_deterministic_contract_only',
  source_bundle: sourceBundle, structural_delta_bundle: structuralDeltaBundle, consequence_graph: consequenceGraph,
  impact_surface: null, atlas_historical_compare: null, lighthouse_accountability_view: null, instantiated_checklist: null,
  projection_executed: false, database_persisted: false,
  explicit_non_claims: [
    'The federal proposed rule is not treated as final or operative law.',
    'No claim is made that discrimination will increase or decrease.',
    'No numeric consequence weight or risk score is assigned.',
    'No Atlas comparison has executed.',
    'No Lighthouse accountability alert has been instantiated.',
    'No source document raw-byte hash is claimed where bytes were not independently fetched.'
  ]
};
