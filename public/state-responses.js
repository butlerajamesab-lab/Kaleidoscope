const RESULT_URL = '/v1/state-response/result';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function humanize(value) { return String(value ?? 'unknown').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }

function list(target, values, empty = 'None identified') {
  const rows = values?.length ? values : [empty];
  document.querySelector(target).replaceChildren(...rows.map(value => el('li', '', typeof value === 'string' ? value : JSON.stringify(value))));
}

function renderSources(values) {
  const rows = values?.length ? values : [{citation:'No primary sources verified',proves:'This projection remains evidence-limited.',does_not_prove:''}];
  document.querySelector('#primary').replaceChildren(...rows.map(row => {
    const card=el('article','source-card');
    const title=row.url ? el('a','',row.citation) : el('strong','',row.citation);
    if(row.url){title.href=row.url;title.target='_blank';title.rel='noreferrer';}
    card.append(title,el('p','',row.proves));
    if(row.does_not_prove) card.append(el('small','',`Does not prove: ${row.does_not_prove}`));
    return card;
  }));
}

function renderChain(mechanism) {
  const names=new Map(mechanism.implementation_events.map(event=>[event.event_id,event.title]));
  document.querySelector('#chain').replaceChildren(...mechanism.implementation_edges.map(edge=>{
    const row=el('div',`chain-row ${edge.causal ? '' : 'noncausal'}`);
    row.append(el('span','',names.get(edge.from)??edge.from),el('span','relation',`${humanize(edge.relationship_type)}${edge.causal?'':' · noncausal'}`),el('span','',names.get(edge.to)??edge.to));
    return row;
  }));
}

function scoreGrid(ranking) {
  const positive = ['legal_viability','expected_effect','durability','population_coverage','institutional_feasibility','temporal_urgency','evidentiary_confidence'];
  const risk = ['preemption_risk','adverse_precedent_risk','fiscal_burden'];
  const grid = el('div', 'scores');
  for (const key of [...positive, ...risk]) {
    const item = el('div', risk.includes(key) ? 'score risk' : 'score');
    item.append(el('span', '', humanize(key)), el('strong', '', `${ranking[key]} / 5`));
    const track = el('span', 'track');
    const fill = el('span', 'fill');
    fill.style.width = `${ranking[key] * 20}%`;
    track.append(fill); item.append(track); grid.append(item);
  }
  return grid;
}

function pathwayCard(pathway, rank) {
  const card = el('article', 'pathway-card');
  const heading = el('div', 'pathway-heading');
  const title = el('div');
  title.append(el('span', 'rank', `#${rank}`), el('span', 'outcome', humanize(pathway.outcome_class)), el('h3', '', pathway.action));
  const total = el('div', 'priority'); total.append(el('span', '', 'Priority'), el('strong', '', pathway.ranking.priority_score));
  heading.append(title, total);
  const meta = el('div', 'meta');
  [['Actor', humanize(pathway.state_actor)],['Target', humanize(pathway.target)],['Window', humanize(pathway.timing.phase)],['Confidence', humanize(pathway.confidence)]].forEach(([a,b]) => {const item=el('div'); item.append(el('span','',a),el('strong','',b)); meta.append(item);});
  const explanation = el('p', 'explanation', pathway.explanation);
  const details = el('details'); details.append(el('summary', '', 'Inspect authority, constraints, effect, and component scores'));
  const authority = el('div', 'detail-block'); authority.append(el('strong', '', 'Authority basis'), el('p', '', pathway.authority_basis.join(' · ')));
  const constraints = el('div', 'detail-block'); constraints.append(el('strong', '', 'Constraints'));
  for (const row of pathway.constraints) constraints.append(el('p', '', `${humanize(row.type)} — ${humanize(row.effect)}. ${row.reasoning ?? ''}`));
  const effect = el('div', 'detail-block'); effect.append(el('strong', '', 'Expected effect'), el('p', '', `${humanize(pathway.expected_effect.legal_effect)} legal effect · ${pathway.expected_effect.population_coverage} · ${humanize(pathway.expected_effect.duration)}`));
  details.append(authority, constraints, effect, scoreGrid(pathway.ranking));
  card.append(heading, meta, explanation, details);
  return card;
}

function render(result) {
  const accepted = result.acceptance_state === 'accepted_evidence_bound_projection';
  const acceptance = document.querySelector('#acceptance');
  acceptance.className = `acceptance ${accepted ? 'accepted' : 'limited'}`;
  acceptance.textContent = accepted ? 'Evidence threshold met' : 'Evidence-limited · primary sources still missing';
  document.querySelector('#mechanism').textContent = result.mechanism_id;
  document.querySelector('#jurisdiction').textContent = result.jurisdiction_id;
  document.querySelector('#instrument').textContent = result.current_status.operative_instrument;
  document.querySelector('#as-of').textContent = result.as_of_date;
  document.querySelector('#implementation').textContent = humanize(result.current_status.implementation_status);
  document.querySelector('#posture').textContent = result.current_status.procedural_posture;
  document.querySelector('#proposal').textContent = result.mechanism.proposal_summary;
  document.querySelector('#match').textContent = `Proposal/action match · ${humanize(result.mechanism.match_classification)}`;
  renderChain(result.mechanism);
  document.querySelector('#baseline').textContent = result.state_baseline_summary;
  document.querySelector('#pathway-count').textContent = `${result.pathways.length} pathway${result.pathways.length === 1 ? '' : 's'}`;
  document.querySelector('#pathways').replaceChildren(...result.pathways.map((pathway, index) => pathwayCard(pathway, index + 1)));
  document.querySelector('#no-go').replaceChildren(...result.no_go_paths.map(row => {const item=el('article','limit-item');item.append(el('strong','',row.proposed_action),el('p','',row.reason_foreclosed),el('span','authority-note',row.authority.join(' · ')));return item;}));
  document.querySelector('#watch-events').replaceChildren(...result.watch_events.map(row => {const item=el('article','watch-item');item.append(el('strong','',row.event),el('p','',row.consequence));return item;}));
  document.querySelector('#populations').replaceChildren(...result.affected_populations.map(row => el('span','chip',row)));
  renderSources(result.evidence_summary.primary_sources);
  list('#secondary', result.evidence_summary.secondary_sources);
  list('#missing', result.evidence_summary.missing_sources);
  list('#unknowns', result.unresolved_questions);
  document.querySelector('#disclaimer').textContent = result.disclaimer;
  document.querySelector('#result-hash').textContent = `Result hash · ${result.result_hash}`;
  document.querySelector('#workspace').hidden = false;
}

async function load(jurisdiction='US-CA') {
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

for(const button of document.querySelectorAll('[data-jurisdiction]')) button.addEventListener('click',()=>{
  for(const peer of document.querySelectorAll('[data-jurisdiction]')) peer.classList.toggle('selected',peer===button);
  document.querySelector('#error').hidden=true;
  load(button.dataset.jurisdiction);
});
load();
