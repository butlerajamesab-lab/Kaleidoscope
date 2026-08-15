const RESULT_URL = '/v1/state-response/result';

const JURISDICTION_LABELS = new Map([
  ['US-CA', 'California'],
  ['US-TX', 'Texas']
]);

const IMPLEMENTATION_LABELS = new Map([
  ['operative', 'Currently in effect'],
  ['proposed', 'Proposed, not currently in effect'],
  ['pending', 'Pending'],
  ['partially_implemented', 'Partly in effect'],
  ['contested', 'In effect but legally contested'],
  ['not_implemented_as_proposed', 'Implemented differently from the original proposal'],
  ['unresolved', 'Current status is not settled by the available evidence']
]);

const INSTRUMENT_LABELS = new Map([
  ['executive_order', 'Executive order'],
  ['guidance_rescission', 'Agency guidance withdrawal'],
  ['enforcement_policy', 'Agency enforcement policy'],
  ['court_order', 'Court order'],
  ['agency_rule', 'Agency rule'],
  ['proposed_rule', 'Proposed agency rule'],
  ['statute', 'Law passed by a legislature']
]);

const MATCH_LABELS = new Map([
  ['exact_structural_match', 'The implemented action closely matches the proposal'],
  ['partial_structural_match', 'Some parts match, but the implementation differs in important ways'],
  ['similar_effect_different_mechanism', 'The effect is similar, but the legal mechanism is different'],
  ['no_verified_match', 'No verified match has been established'],
  ['unresolved', 'The available evidence does not settle the comparison']
]);

const RELATIONSHIP_LABELS = new Map([
  ['directs', 'directly instructs'],
  ['implements', 'puts into effect'],
  ['authorizes', 'authorizes'],
  ['precedes', 'came before'],
  ['produces_similar_effect', 'has a similar effect'],
  ['depends_on', 'depends on']
]);

const OUTCOME_LABELS = new Map([
  ['prevent', 'Prevent the federal effect where state law allows'],
  ['enjoin', 'Ask a court to stop the action'],
  ['delay', 'Delay the effect'],
  ['preserve', 'Keep existing state protection working'],
  ['insulate', 'Create or strengthen independent state protection'],
  ['backfill', 'Fill part of the gap left by the federal change'],
  ['mitigate', 'Reduce the practical harm'],
  ['route_around', 'Use another lawful state route'],
  ['lawfully_decline_participation', 'Decline participation where the law permits'],
  ['monitor_and_prepare', 'Prepare while the law remains unsettled'],
  ['no_viable_state_block_identified', 'No viable state block identified'],
  ['unknown', 'Still unresolved']
]);

const ACTOR_LABELS = new Map([
  ['state_agency', 'State agency'],
  ['legislature', 'State legislature'],
  ['attorney_general', 'State attorney general'],
  ['governor', 'Governor'],
  ['state_court', 'State court'],
  ['local_government', 'Local government']
]);

const TARGET_LABELS = new Map([
  ['enforcement_gap', 'Gap in enforcement'],
  ['local_implementation', 'Local rule or program'],
  ['federal_instrument', 'Federal action'],
  ['state_program', 'State program'],
  ['funding_condition', 'Federal funding condition']
]);

const TIMING_LABELS = new Map([
  ['continuing', 'Available now and ongoing'],
  ['litigation', 'While litigation is pending'],
  ['pre_implementation', 'Before the federal action takes effect'],
  ['post_implementation', 'After the federal action takes effect'],
  ['emergency', 'Immediate or emergency window'],
  ['closed', 'Window has closed']
]);

const CONFIDENCE_LABELS = new Map([
  ['high', 'Strong evidence'],
  ['medium', 'Moderate evidence'],
  ['low', 'Limited evidence'],
  ['unknown', 'Evidence strength unresolved'],
  ['unresolved', 'Evidence strength unresolved']
]);

const SCORE_LABELS = new Map([
  ['legal_viability', 'Legal footing'],
  ['expected_effect', 'Likely practical effect'],
  ['durability', 'How long the effect may last'],
  ['population_coverage', 'How broadly it could help'],
  ['institutional_feasibility', 'Can the institution realistically do it'],
  ['temporal_urgency', 'How quickly action matters'],
  ['evidentiary_confidence', 'Strength of the evidence'],
  ['preemption_risk', 'Risk that higher-level law blocks it'],
  ['adverse_precedent_risk', 'Risk of harmful court precedent'],
  ['fiscal_burden', 'Cost burden']
]);

const CONSTRAINT_LABELS = new Map([
  ['federal_preemption_conflict', 'Possible conflict with federal law'],
  ['jurisdiction', 'Limits on legal authority'],
  ['appropriations', 'Funding limits'],
  ['state_constitution', 'State constitutional requirements'],
  ['home_rule_preemption', 'State limits on local authority']
]);

const EFFECT_LABELS = new Map([
  ['permits', 'does not currently block this option'],
  ['limits', 'limits this option'],
  ['uncertain', 'remains legally uncertain'],
  ['forecloses', 'blocks this option']
]);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function humanize(value) {
  return String(value ?? 'unknown').replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function label(map, value) {
  return map.get(value) ?? humanize(value);
}

function list(target, values, empty = 'None identified') {
  const rows = values?.length ? values : [empty];
  document.querySelector(target).replaceChildren(...rows.map(value => el('li', '', typeof value === 'string' ? value : JSON.stringify(value))));
}

function renderSources(values) {
  const rows = values?.length ? values : [{citation:'No official primary sources verified',proves:'This analysis remains evidence-limited.',does_not_prove:''}];
  document.querySelector('#primary').replaceChildren(...rows.map(row => {
    const card = el('article', 'source-card');
    const title = row.url ? el('a', '', row.citation) : el('strong', '', row.citation);
    if (row.url) {
      title.href = row.url;
      title.target = '_blank';
      title.rel = 'noreferrer';
    }
    card.append(title, el('p', '', row.proves));
    if (row.does_not_prove) card.append(el('small', '', `This source does not prove: ${row.does_not_prove}`));
    return card;
  }));
}

function renderChain(mechanism) {
  const names = new Map(mechanism.implementation_events.map(event => [event.event_id, event.title]));
  document.querySelector('#chain').replaceChildren(...mechanism.implementation_edges.map(edge => {
    const row = el('div', `chain-row ${edge.causal ? '' : 'noncausal'}`);
    const relationship = label(RELATIONSHIP_LABELS, edge.relationship_type);
    const explanation = edge.causal ? relationship : `${relationship} · does not establish causation`;
    row.append(
      el('span', '', names.get(edge.from) ?? edge.from),
      el('span', 'relation', explanation),
      el('span', '', names.get(edge.to) ?? edge.to)
    );
    return row;
  }));
}

function scoreGrid(ranking) {
  const positive = ['legal_viability','expected_effect','durability','population_coverage','institutional_feasibility','temporal_urgency','evidentiary_confidence'];
  const risk = ['preemption_risk','adverse_precedent_risk','fiscal_burden'];
  const grid = el('div', 'scores');
  for (const key of [...positive, ...risk]) {
    const item = el('div', risk.includes(key) ? 'score risk' : 'score');
    item.append(el('span', '', label(SCORE_LABELS, key)), el('strong', '', `${ranking[key]} / 5`));
    const track = el('span', 'track');
    const fill = el('span', 'fill');
    fill.style.width = `${ranking[key] * 20}%`;
    track.append(fill);
    item.append(track);
    grid.append(item);
  }
  return grid;
}

function pathwayCard(pathway, rank) {
  const card = el('article', 'pathway-card');
  const heading = el('div', 'pathway-heading');
  const title = el('div');
  title.append(
    el('span', 'rank', `#${rank}`),
    el('span', 'outcome', label(OUTCOME_LABELS, pathway.outcome_class)),
    el('h3', '', pathway.action)
  );
  const total = el('div', 'priority');
  total.append(el('span', '', 'Relative priority'), el('strong', '', pathway.ranking.priority_score));
  heading.append(title, total);

  const meta = el('div', 'meta');
  [
    ['Who can act', label(ACTOR_LABELS, pathway.state_actor)],
    ['What it acts on', label(TARGET_LABELS, pathway.target)],
    ['When action is possible', label(TIMING_LABELS, pathway.timing.phase)],
    ['Evidence confidence', label(CONFIDENCE_LABELS, pathway.confidence)]
  ].forEach(([term, value]) => {
    const item = el('div');
    item.append(el('span', '', term), el('strong', '', value));
    meta.append(item);
  });

  const explanation = el('p', 'explanation', pathway.explanation);
  const details = el('details');
  details.append(el('summary', '', 'Why this option may be available, what limits it, and how it was ranked'));

  const authority = el('div', 'detail-block');
  authority.append(el('strong', '', 'Why this actor may have legal authority'), el('p', '', pathway.authority_basis.join(' · ')));

  const constraints = el('div', 'detail-block');
  constraints.append(el('strong', '', 'Legal and practical limits'));
  for (const row of pathway.constraints) {
    constraints.append(el('p', '', `${label(CONSTRAINT_LABELS, row.type)} — ${label(EFFECT_LABELS, row.effect)}. ${row.reasoning ?? ''}`));
  }

  const effect = el('div', 'detail-block');
  effect.append(
    el('strong', '', 'What this action could realistically change'),
    el('p', '', `${humanize(pathway.expected_effect.legal_effect)} legal effect · ${pathway.expected_effect.population_coverage} · Duration: ${humanize(pathway.expected_effect.duration)}`)
  );

  details.append(authority, constraints, effect, scoreGrid(pathway.ranking));
  card.append(heading, meta, explanation, details);
  return card;
}

function render(result) {
  const accepted = result.acceptance_state === 'accepted_evidence_bound_projection';
  const acceptance = document.querySelector('#acceptance');
  acceptance.className = `acceptance ${accepted ? 'accepted' : 'limited'}`;
  acceptance.textContent = accepted
    ? 'Enough official evidence is available to show these options'
    : 'Evidence incomplete · some official sources are still missing';

  document.querySelector('#mechanism').textContent = result.mechanism?.title ?? result.mechanism_id;
  document.querySelector('#jurisdiction').textContent = label(JURISDICTION_LABELS, result.jurisdiction_id);
  document.querySelector('#instrument').textContent = label(INSTRUMENT_LABELS, result.current_status.operative_instrument);
  document.querySelector('#as-of').textContent = result.as_of_date;
  document.querySelector('#implementation').textContent = label(IMPLEMENTATION_LABELS, result.current_status.implementation_status);
  document.querySelector('#posture').textContent = result.current_status.procedural_posture;
  document.querySelector('#proposal').textContent = result.mechanism.proposal_summary;
  document.querySelector('#match').textContent = `How closely the actual action matches the proposal · ${label(MATCH_LABELS, result.mechanism.match_classification)}`;
  renderChain(result.mechanism);
  document.querySelector('#baseline').textContent = result.state_baseline_summary;
  document.querySelector('#pathway-count').textContent = `${result.pathways.length} option${result.pathways.length === 1 ? '' : 's'}`;
  document.querySelector('#pathways').replaceChildren(...result.pathways.map((pathway, index) => pathwayCard(pathway, index + 1)));

  document.querySelector('#no-go').replaceChildren(...result.no_go_paths.map(row => {
    const item = el('article', 'limit-item');
    item.append(el('strong', '', row.proposed_action), el('p', '', row.reason_foreclosed), el('span', 'authority-note', row.authority.join(' · ')));
    return item;
  }));

  document.querySelector('#watch-events').replaceChildren(...result.watch_events.map(row => {
    const item = el('article', 'watch-item');
    item.append(el('strong', '', row.event), el('p', '', row.consequence));
    return item;
  }));

  document.querySelector('#populations').replaceChildren(...result.affected_populations.map(row => el('span', 'chip', row)));
  renderSources(result.evidence_summary.primary_sources);
  list('#secondary', result.evidence_summary.secondary_sources);
  list('#missing', result.evidence_summary.missing_sources);
  list('#unknowns', result.unresolved_questions);

  document.querySelector('#technical-mechanism-id').textContent = result.mechanism_id;
  document.querySelector('#technical-jurisdiction-id').textContent = result.jurisdiction_id;
  document.querySelector('#technical-implementation-status').textContent = result.current_status.implementation_status;
  document.querySelector('#technical-match-classification').textContent = result.mechanism.match_classification;
  document.querySelector('#technical-result-hash').textContent = result.result_hash;

  document.querySelector('#disclaimer').textContent = result.disclaimer;
  document.querySelector('#result-hash').textContent = `Technical result hash · ${result.result_hash}`;
  document.querySelector('#workspace').hidden = false;
}

async function load(jurisdiction = 'US-CA') {
  try {
    const response = await fetch(`${RESULT_URL}?jurisdiction=${encodeURIComponent(jurisdiction)}`, {headers:{accept:'application/json'}, cache:'no-store'});
    if (!response.ok) throw new Error(`State-response endpoint returned HTTP ${response.status}.`);
    const result = await response.json();
    if (!result.result_hash || !result.current_status || !Array.isArray(result.pathways)) throw new Error('State-response result failed the frontend truth boundary.');
    render(result);
  } catch (error) {
    document.querySelector('#acceptance').hidden = true;
    document.querySelector('#error').hidden = false;
    document.querySelector('#error-message').textContent = error.message;
  }
}

for (const button of document.querySelectorAll('[data-jurisdiction]')) {
  button.addEventListener('click', () => {
    for (const peer of document.querySelectorAll('[data-jurisdiction]')) peer.classList.toggle('selected', peer === button);
    document.querySelector('#error').hidden = true;
    load(button.dataset.jurisdiction);
  });
}

load();
