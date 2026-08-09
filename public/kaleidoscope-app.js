const PLATFORM_MODEL_URL = '/v1/platform/read-model';

const VIEW_TITLES = new Map([
  ['overview', 'Overview'],
  ['scenarios', 'Scenarios'],
  ['lenses', 'Lenses'],
  ['sources', 'Sources'],
  ['receipts', 'Receipts'],
  ['system', 'System']
]);

const LENS_DESCRIPTIONS = new Map([
  ['civil_rights.v1', 'Tracks formal rights, protected-class coverage, and preserved or removed legal protections.'],
  ['enforcement_pathways.v1', 'Tracks practical routes through agencies, courts, and administrative enforcement systems.'],
  ['local_government_preemption.v1', 'Tracks when state rules restrict or displace local protective authority.'],
  ['affected_populations.v1', 'Tracks which source-declared populations are structurally exposed to a change without forecasting outcomes.']
]);

let platformModel = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function humanize(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusTone(state) {
  if (['available', 'live_proven_unbound', 'validated_unbound'].includes(state)) return 'positive';
  if (['executed_test_fixture', 'source_controlled_test_fixture', 'external_owner'].includes(state)) return 'warning';
  if (['disabled', 'contract_not_established'].includes(state)) return 'restricted';
  return '';
}

function statusChip(state) {
  return element('span', `status-chip ${statusTone(state)}`.trim(), humanize(state));
}

function metricCard(label, value, note) {
  const card = element('article', 'metric-card');
  card.append(
    element('span', 'metric-label', label),
    element('strong', 'metric-value', value),
    element('span', 'metric-note', note)
  );
  return card;
}

function renderMetrics(model) {
  const summary = model.summary;
  const metrics = [
    ['Source artifacts', summary.active_source_artifacts, 'active manifest entries'],
    ['Scenarios', summary.scenario_count, 'bounded scenario library'],
    ['Lenses', summary.lens_count, 'independent transformations'],
    ['Collisions', summary.preserved_collision_count, 'preserved, not averaged'],
    ['Unresolved', summary.unresolved_condition_count, 'visible open conditions'],
    ['Accepted bindings', summary.accepted_civic_genome_bindings, 'Civic Genome → Kaleidoscope']
  ];

  const grid = document.querySelector('#metric-grid');
  grid.replaceChildren(...metrics.map(([label, value, note]) => metricCard(label, value, note)));
}

function renderCapabilities(model) {
  const container = document.querySelector('#capability-list');
  const rows = model.capabilities.map((capability) => {
    const row = element('article', 'capability-row');
    row.append(
      element('strong', 'capability-label', capability.label),
      statusChip(capability.state),
      element('span', 'capability-detail', capability.detail)
    );
    return row;
  });
  container.replaceChildren(...rows);
}

function scenarioStats(scenario) {
  return [
    ['Mechanisms', scenario.mechanism_count],
    ['Operations', scenario.operation_count],
    ['Lenses', scenario.lens_count],
    ['Collisions', scenario.collision_count]
  ];
}

function createScenarioStats(scenario) {
  const stats = element('div', 'scenario-stats');
  for (const [label, value] of scenarioStats(scenario)) {
    const stat = element('div', 'scenario-stat');
    stat.append(element('strong', '', value), element('span', '', label));
    stats.append(stat);
  }
  return stats;
}

function createScenarioActions(scenario) {
  const actions = element('div', 'scenario-actions');
  const inspect = element('a', '', 'Inspect scenario');
  inspect.href = scenario.href;
  const receipt = element('a', '', 'Open receipt');
  receipt.href = scenario.receipt_href;
  actions.append(inspect, receipt);
  return actions;
}

function renderScenarioSpotlight(model) {
  const scenario = model.scenarios[0];
  const container = document.querySelector('#scenario-spotlight');
  if (!scenario) {
    container.replaceChildren(element('p', 'scenario-subtitle', 'No source-controlled scenario is currently available.'));
    return;
  }

  const inner = element('div', 'scenario-card-inner');
  inner.append(
    element('div', 'scenario-family', scenario.policy_family_id),
    element('h3', 'scenario-title', scenario.title),
    element('p', 'scenario-subtitle', scenario.subtitle),
    statusChip(scenario.state),
    createScenarioStats(scenario),
    createScenarioActions(scenario)
  );
  container.replaceChildren(inner);
}

function renderPlatformContracts(model) {
  const container = document.querySelector('#upstream-contracts');
  const cards = model.platform_contracts.map((contract) => {
    const card = element('article', 'upstream-card');
    card.append(
      element('strong', '', contract.label),
      element('span', 'upstream-role', contract.role),
      element('span', 'upstream-state', `${humanize(contract.state)} · ${humanize(contract.mutation)}`)
    );
    return card;
  });
  container.replaceChildren(...cards);
}

function renderScenarios(model) {
  const count = document.querySelector('#scenario-count-badge');
  count.textContent = `${model.scenarios.length} ${model.scenarios.length === 1 ? 'scenario' : 'scenarios'}`;

  const cards = model.scenarios.map((scenario) => {
    const card = element('article', 'scenario-library-card');
    const header = element('div', 'scenario-card-header');
    const identity = element('div');
    identity.append(
      element('span', 'scenario-id', scenario.scenario_id),
      element('h2', '', scenario.title)
    );
    header.append(identity, statusChip(scenario.state));

    card.append(
      header,
      element('p', '', scenario.subtitle),
      createScenarioStats(scenario),
      createScenarioActions(scenario)
    );

    const hashLine = element('div', 'hash-line');
    hashLine.append(
      element('span', '', 'Read model hash'),
      element('code', '', scenario.read_model_hash)
    );
    card.append(hashLine);
    return card;
  });

  document.querySelector('#scenario-grid').replaceChildren(...cards);
}

function renderLenses(model) {
  const cards = model.lens_registry.map((lens) => {
    const card = element('article', 'lens-card');
    const topline = element('div', 'lens-card-topline');
    topline.append(
      statusChip(lens.state),
      element('strong', 'lens-effect-count', lens.effect_count)
    );

    const title = element('h2', '', lens.lens_id);
    const description = element(
      'p',
      '',
      LENS_DESCRIPTIONS.get(lens.lens_id) ?? 'Declared deterministic lens with source-bound output.'
    );
    const link = element('a', 'quiet-link', 'Inspect current effects →');
    link.href = lens.href;

    card.append(topline, title, description, link);
    return card;
  });
  document.querySelector('#lens-registry').replaceChildren(...cards);
}

function renderSources(model) {
  const source = model.source_corpus;
  document.querySelector('#source-count').textContent = source.entry_count;
  document.querySelector('#source-subset').textContent = source.selected_subset ? 'Yes' : 'None';
  document.querySelector('#source-embedding').textContent = source.embedded_in_runtime ? 'Embedded' : 'External';

  const definitions = [
    ['Manifest', source.manifest_id],
    ['Corpus policy', source.corpus_policy],
    ['Identity rule', source.identity_rule],
    ['Subset selection', source.selected_subset ? 'A preferred subset is active.' : 'No silent preferred subset. All manifest entries remain active source artifacts.'],
    ['Runtime payload', source.embedded_in_runtime ? 'Source bytes are embedded.' : 'Source custody is preserved separately from runtime payload.']
  ];

  const fragment = document.createDocumentFragment();
  for (const [term, description] of definitions) {
    const row = element('div', 'definition-row');
    row.append(element('dt', '', term), element('dd', '', description));
    fragment.append(row);
  }
  document.querySelector('#source-contract').replaceChildren(fragment);
}

function renderReceipts(model) {
  const cards = model.receipts.map((receipt) => {
    const card = element('article', 'receipt-card');
    card.append(statusChip(receipt.state), element('h2', '', receipt.label));

    const meta = element('dl', 'receipt-meta');
    const values = [
      ['Receipt ID', receipt.receipt_id],
      ['Receipt hash', receipt.receipt_hash],
      ['Run ID', receipt.run_id],
      ['Snapshot hash', receipt.source_snapshot_hash],
      ['Binding state', receipt.binding_state],
      ['Persisted', receipt.persisted],
      ['Projection', receipt.projection_executed]
    ].filter(([, value]) => value !== undefined && value !== null);

    for (const [term, value] of values) {
      const row = element('div');
      row.append(element('dt', '', term), element('dd', '', typeof value === 'boolean' ? String(value) : value));
      meta.append(row);
    }
    card.append(meta);

    if (receipt.href) {
      const link = element('a', '', 'Open raw receipt →');
      link.href = receipt.href;
      card.append(link);
    }
    return card;
  });
  document.querySelector('#receipt-list').replaceChildren(...cards);
}

function boundaryDisplay(key, value) {
  const labels = {
    database_persistence: ['Database persistence', value ? 'Enabled' : 'Disabled', 'Kaleidoscope Supabase has not been promoted into canonical projection storage.'],
    canonical_projection_execution: ['Canonical projection execution', value ? 'Enabled' : 'Disabled', 'Current execution remains a source-controlled test fixture, not canonical civic truth.'],
    upstream_mutation: ['Upstream mutation', value ? 'Enabled' : 'Prohibited', 'Docket, Rosetta, Civic Genome, Prism, Atlas, and Esquire remain authoritative owners.'],
    hidden_composite_score: ['Hidden composite score', value ? 'Present' : 'None', 'Independent lens effects and collisions remain separate.'],
    runtime_ai_dependency: ['Runtime AI dependency', value ? 'Present' : 'None', 'The execution contract is deterministic code and declared math only.'],
    unresolved_states_preserved: ['Unresolved state', value ? 'Preserved' : 'Not preserved', 'Unknown, mixed, contradictory, and incomplete states remain visible.'],
    source_identity_rule: ['Source identity', humanize(value), 'Artifact identity is governed by exact bytes and SHA-256, not filename similarity.']
  };
  return labels[key] ?? [humanize(key), String(value), ''];
}

function renderSystem(model) {
  const cards = Object.entries(model.system_boundary).map(([key, value]) => {
    const [label, state, detail] = boundaryDisplay(key, value);
    const card = element('article', 'system-card');
    card.append(
      element('span', 'eyebrow', label),
      element('strong', 'system-state', state),
      element('p', '', detail)
    );
    return card;
  });
  document.querySelector('#system-boundary-grid').replaceChildren(...cards);
}

function renderHeaderState(model) {
  document.querySelector('#platform-mission').textContent = model.mission;
  document.querySelector('#truth-label').textContent = model.truth_label;
  document.querySelector('#hero-environment').textContent = humanize(model.environment);
  document.querySelector('#hero-determinism').textContent = model.deterministic ? 'Deterministic' : 'Unverified';
  document.querySelector('#hero-persistence').textContent = model.system_boundary.database_persistence ? 'Enabled' : 'Disabled';
  document.querySelector('#hero-projection').textContent = model.system_boundary.canonical_projection_execution ? 'Enabled' : 'Disabled';
  document.querySelector('#sidebar-foundation').textContent = `v${model.foundation_version}`;
  document.querySelector('#footer-model-hash').textContent = `Platform read model · ${model.read_model_hash}`;
  document.title = `${model.platform_label} · Luminari`;
}

function render(model) {
  renderHeaderState(model);
  renderMetrics(model);
  renderCapabilities(model);
  renderScenarioSpotlight(model);
  renderPlatformContracts(model);
  renderScenarios(model);
  renderLenses(model);
  renderSources(model);
  renderReceipts(model);
  renderSystem(model);
}

function setView(name, updateHash = true) {
  const resolved = VIEW_TITLES.has(name) ? name : 'overview';
  for (const view of document.querySelectorAll('[data-view]')) {
    const active = view.dataset.view === resolved;
    view.hidden = !active;
    view.classList.toggle('is-active', active);
  }
  for (const button of document.querySelectorAll('[data-view-target]')) {
    const active = button.dataset.viewTarget === resolved;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  document.querySelector('#current-view-title').textContent = VIEW_TITLES.get(resolved);
  if (updateHash && location.hash !== `#${resolved}`) history.replaceState(null, '', `#${resolved}`);
  document.querySelector('#workspace-content').focus({ preventScroll: true });
}

function bindNavigation() {
  for (const button of document.querySelectorAll('[data-view-target]')) {
    button.addEventListener('click', () => setView(button.dataset.viewTarget));
  }
  window.addEventListener('hashchange', () => setView(location.hash.slice(1), false));
}

function showError(error) {
  for (const view of document.querySelectorAll('[data-view]')) {
    view.hidden = true;
    view.classList.remove('is-active');
  }
  const panel = document.querySelector('#workspace-error');
  panel.hidden = false;
  document.querySelector('#workspace-error-message').textContent = error?.message ?? 'Unknown platform read-model error.';
}

async function load() {
  try {
    const response = await fetch(PLATFORM_MODEL_URL, {
      headers: { accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Platform read model returned HTTP ${response.status}.`);
    const model = await response.json();
    if (model.platform !== 'kaleidoscope' || model.deterministic !== true || !model.read_model_hash) {
      throw new Error('Platform read model failed the browser truth boundary.');
    }
    platformModel = model;
    render(platformModel);
    setView(location.hash.slice(1), false);
  } catch (error) {
    showError(error);
  }
}

bindNavigation();
load();
