const PLATFORM_MODEL_URL = '/v1/platform/read-model';

const VIEW_TITLES = new Map([
  ['overview', 'Overview'],
  ['scenarios', 'What changes'],
  ['lenses', 'Ways to examine it'],
  ['sources', 'Evidence'],
  ['receipts', 'Proof & history'],
  ['system', 'System details']
]);

const STATUS_LABELS = new Map([
  ['available', 'Available'],
  ['available_no_write', 'Check available — no live writes'],
  ['executed_test_fixture', 'Tested example'],
  ['source_controlled_test_fixture', 'Tested example'],
  ['source_controlled_no_projection', 'Structured analysis — not a live projection'],
  ['stage_1_2_source_controlled', 'First two analysis stages available'],
  ['live_proven_unbound', 'Connection tested — not accepted as official input'],
  ['validated_unbound', 'Validated — not accepted as official input'],
  ['mapped_by_declared_rule', 'Mapped by declared rule'],
  ['accepted_durable_no_projection', 'Durably bound — no projection'],
  ['durable_intake_active', 'Durable intake active'],
  ['available_no_durable_intake', 'No durable input yet'],
  ['applied_empty_unbound', 'Storage ready — runtime not connected'],
  ['schema_present_empty', 'Storage ready — empty'],
  ['runtime_not_bound', 'Not connected'],
  ['not_queried_from_runtime', 'Live intake not queried'],
  ['live_read_unavailable', 'Live intake unavailable'],
  ['disabled_no_read', 'Live intake disabled'],
  ['enabled_missing_database_credentials', 'Live intake unavailable'],
  ['external_owner', 'Separate source system'],
  ['contract_not_established', 'Not connected'],
  ['disabled', 'Off']
]);

const CAPABILITY_PRESENTATION = new Map([
  ['typed_state_diff', {
    label: 'Compare a before state with an after state',
    detail: 'Shows exactly what was added, removed, changed, kept, replaced, blocked, or left unresolved.',
    technical: 'Typed state diff'
  }],
  ['project2025_vertical_slice', {
    label: 'Examine workplace discrimination and gender-identity protections',
    detail: 'Compares several layers of federal, state, court, agency, and local protection without collapsing them into one conclusion.',
    technical: 'Project 2025 Title VII vertical slice'
  }],
  ['local_preemption_family_vertical_slice', {
    label: 'Compare when states limit local nondiscrimination protections',
    detail: 'Shows how related state-local restrictions differ across jurisdictions and over time without treating similarity as proof of coordination.',
    technical: 'Local preemption family vertical slice'
  }],
  ['legislative_consequence_stage_1_2', {
    label: 'See what a proposed legal change actually changes',
    detail: 'Separates the direct change in legal duties from possible downstream effects, and keeps unproven effects marked as unresolved.',
    technical: 'Legislative Consequence Engine · Stages 1–2'
  }],
  ['legislative_consequence_stage_3', {
    label: 'See who or what is directly touched by the legal change',
    detail: 'Groups only already-established consequences by legal, operational, administrative, or economic impact. It does not add new causation, and this example reports zero economic impact items because none is declared.',
    technical: 'Legislative Consequence Stage 3 · Impact Surface'
  }],
  ['deterministic_persistence_preflight', {
    label: 'Check what could be saved safely before saving anything',
    detail: 'Maps an analysis to the governed record system, lists every blocker, and authorizes zero live writes until the missing rules are declared.',
    technical: 'Deterministic persistence preflight'
  }],
  ['civic_genome_snapshot_validation', {
    label: 'Verify incoming Civic Genome records without silently accepting them',
    detail: 'Rechecks identity and hashes before Kaleidoscope can rely on an incoming snapshot; validation is kept separate from acceptance.',
    technical: 'Civic Genome snapshot validation'
  }],
  ['projection_substrate', {
    label: 'Keep governed Kaleidoscope records in an append-only store',
    detail: 'The storage structure exists and is protected, but it remains empty until an authorized runtime write path is proven.',
    technical: 'Projection substrate'
  }],
  ['canonical_projection_persistence', {
    label: 'Save an analysis as an official Kaleidoscope record',
    detail: 'Not enabled yet. The storage exists, but Kaleidoscope will not write an official analysis until the remaining ownership and authorization rules are satisfied.',
    technical: 'Canonical projection persistence'
  }]
]);

const LENS_PRESENTATION = new Map([
  ['civil_rights.v1', {
    label: 'What legal protections remain or change?',
    description: 'Looks only at formal rights and protected-class coverage.'
  }],
  ['enforcement_pathways.v1', {
    label: 'What ways to enforce the right remain?',
    description: 'Separates agency, court, private-action, and administrative pathways instead of treating them as the same thing.'
  }],
  ['local_government_preemption.v1', {
    label: 'What can local governments still do?',
    description: 'Looks at whether state law restricts a city or county from maintaining broader local protections.'
  }],
  ['affected_populations.v1', {
    label: 'Who is structurally affected?',
    description: 'Identifies source-declared populations connected to a change without predicting how many people will experience a particular outcome.'
  }],
  ['preemption_operability.v1', {
    label: 'Is the restriction in force now?',
    description: 'Separates a currently operative restriction from a historical, expired, contested, or unresolved one.'
  }],
  ['preemption_temporal_history.v1', {
    label: 'How has the rule changed over time?',
    description: 'Keeps earlier and current legal states separate instead of flattening them into one present-day description.'
  }],
  ['preemption_jurisdictional_variation.v1', {
    label: 'How does it differ from state to state?',
    description: 'Compares related mechanisms while preserving the different legal vehicle, scope, timing, and unresolved state of each jurisdiction.'
  }]
]);

const SCENARIO_PRESENTATION = new Map([
  ['gender_identity_title_vii_redefinition.v1', {
    category: 'Workplace rights',
    title: 'Employment discrimination and gender identity',
    subtitle: 'See how federal enforcement changes and Iowa law changes can affect different layers of workplace protection.',
    whatChanged: 'The represented federal court protection remains while federal agency guidance or enforcement pathways change. Iowa removes the represented state protection and also limits local governments from restoring broader protected categories.',
    whyItMatters: 'A legal right, an agency enforcement path, a private court path, a state protection, and a local protection are different layers. One can remain while another becomes narrower or disappears.',
    terms: [
      ['Title VII', 'A federal employment-discrimination law.'],
      ['EEOC', 'U.S. Equal Employment Opportunity Commission — the federal agency responsible for enforcing federal workplace-discrimination laws.'],
      ['Preemption', 'A state rule that limits what local governments are allowed to regulate or protect.']
    ]
  }],
  ['local_lgbtq_ordinance_preemption.v1', {
    category: 'State and local authority',
    title: 'When states limit local nondiscrimination protections',
    subtitle: 'Compare related restrictions on local authority across Tennessee, Arkansas, North Carolina, Texas, and Iowa — including where their current status differs.',
    whatChanged: 'The governed source pack records related state-local restriction mechanisms in five jurisdictions. Some are represented as currently operative, North Carolina’s represented mechanism is historical and expired, and the Texas application remains partly unresolved.',
    whyItMatters: 'Similar legal techniques can exist in different places and times without having the same current effect. Similarity also does not establish that the states acted together or for the same reason.',
    terms: [
      ['Preemption', 'A state rule that limits what local governments are allowed to regulate or protect.'],
      ['Operative', 'Currently in force in the represented source state.'],
      ['Unresolved', 'The available source material does not support a final answer yet.']
    ]
  }]
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
  if ([
    'available',
    'live_proven_unbound',
    'validated_unbound',
    'mapped_by_declared_rule',
    'accepted_durable_no_projection',
    'durable_intake_active'
  ].includes(state)) return 'positive';
  if ([
    'available_no_write',
    'executed_test_fixture',
    'source_controlled_test_fixture',
    'source_controlled_no_projection',
    'stage_1_2_source_controlled',
    'external_owner',
    'schema_present_empty',
    'applied_empty_unbound',
    'runtime_not_bound',
    'available_no_durable_intake',
    'not_queried_from_runtime',
    'live_read_unavailable',
    'disabled_no_read',
    'enabled_missing_database_credentials'
  ].includes(state)) return 'warning';
  if (['disabled', 'contract_not_established'].includes(state)) return 'restricted';
  return '';
}

function statusLabel(state) {
  return STATUS_LABELS.get(state) ?? humanize(state);
}

function statusChip(state) {
  return element('span', `status-chip ${statusTone(state)}`.trim(), statusLabel(state));
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
    ['Evidence files', summary.active_source_artifacts, 'preserved in the current source record'],
    ['Examples', summary.scenario_count, 'before-and-after civic change examples'],
    ['Ways examined', summary.lens_count, 'separate questions asked of the same change'],
    ['Conflicts shown', summary.preserved_collision_count, 'kept visible instead of averaged away'],
    ['Open questions', summary.unresolved_condition_count, 'information the sources do not settle yet'],
    ['Civic Genome bindings', summary.accepted_civic_genome_bindings ?? '—', 'accepted source inputs, separate from Kaleidoscope outputs'],
    ['Civic Genome snapshots', summary.civic_genome_durable_snapshots ?? '—', 'immutable source states retained append-only'],
    ['Official saved results', summary.database_rows, 'currently stored as canonical Kaleidoscope records']
  ];

  const grid = document.querySelector('#metric-grid');
  grid.replaceChildren(...metrics.map(([label, value, note]) => metricCard(label, value, note)));
}

function technicalDetails(rows) {
  const details = element('details', 'technical-details');
  details.append(element('summary', '', 'Technical details'));
  const list = element('dl', 'receipt-meta');
  for (const [term, value] of rows.filter(([, value]) => value !== undefined && value !== null)) {
    const row = element('div');
    row.append(element('dt', '', term), element('dd', '', String(value)));
    list.append(row);
  }
  details.append(list);
  return details;
}

function renderCapabilities(model) {
  const container = document.querySelector('#capability-list');
  const rows = model.capabilities.map((capability) => {
    const presentation = CAPABILITY_PRESENTATION.get(capability.capability_id) ?? {
      label: capability.label,
      detail: capability.detail,
      technical: capability.label
    };
    const detail = ['accepted_durable_no_projection', 'durable_intake_active'].includes(capability.state)
      ? capability.detail
      : presentation.detail;
    const row = element('article', 'capability-row');
    row.append(
      element('strong', 'capability-label', presentation.label),
      statusChip(capability.state),
      element('span', 'capability-detail', detail),
      technicalDetails([
        ['Technical name', presentation.technical],
        ['Capability ID', capability.capability_id],
        ['Engine state', capability.state]
      ])
    );
    return row;
  });
  container.replaceChildren(...rows);
}

function abbreviatedHash(value) {
  const text = String(value ?? '');
  return text.length > 18 ? `${text.slice(0, 12)}…${text.slice(-8)}` : text;
}

function formattedDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? '—');
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

function intakeCount(value) {
  return Number.isInteger(value) && value >= 0 ? value : '—';
}

function renderCivicGenomeDurableIntake(model) {
  const intake = model.civic_genome_durable_intake ?? {};
  const state = document.querySelector('#civic-genome-intake-state');
  const summary = document.querySelector('#civic-genome-intake-summary');
  const list = document.querySelector('#civic-genome-intake-list');
  const records = Array.isArray(intake.records) ? intake.records : [];

  state.textContent = statusLabel(intake.state ?? 'live_read_unavailable');
  if (intake.available !== true) {
    summary.textContent = 'The live durable-intake read is unavailable right now. The historical staging fixtures remain separate, and Kaleidoscope does not infer an accepted source input when the live record cannot be read.';
    list.replaceChildren();
    return;
  }

  summary.textContent = `${intakeCount(intake.binding_count)} accepted Civic Genome source binding${intake.binding_count === 1 ? '' : 's'} and ${intakeCount(intake.snapshot_count)} immutable snapshot${intake.snapshot_count === 1 ? '' : 's'} are retained append-only. These are source inputs, not official Kaleidoscope outputs: ${intakeCount(intake.projection_run_count)} projection runs, ${intakeCount(intake.projection_result_count)} results, and ${intakeCount(intake.replay_receipt_count)} replay receipts.`;

  if (records.length === 0) {
    list.replaceChildren(element('p', 'intake-empty', 'No accepted durable Civic Genome source input is currently present.'));
    return;
  }

  const cards = records.map((record) => {
    const card = element('article', 'intake-record');
    const header = element('div', 'intake-record-header');
    const identity = element('div');
    identity.append(
      element('span', 'intake-record-kicker', 'Immutable Civic Genome snapshot'),
      element('code', 'intake-record-id', record.external_snapshot_id)
    );
    header.append(identity, statusChip(record.verification_state));
    const details = element('dl', 'intake-record-details');
    const rows = [
      ['As of', record.as_of_date],
      ['Bound', formattedDateTime(record.bound_at)],
      ['Stored components', record.component_count],
      ['Snapshot hash', abbreviatedHash(record.snapshot_hash)],
      ['Projection', 'Not executed']
    ];
    for (const [label, value] of rows) {
      const row = element('div');
      row.append(element('dt', '', label), element('dd', '', value));
      details.append(row);
    }
    card.append(header, details);
    return card;
  });
  list.replaceChildren(...cards);
}

function scenarioPresentation(scenario) {
  return SCENARIO_PRESENTATION.get(scenario.policy_family_id) ?? {
    category: 'Civic change',
    title: scenario.title,
    subtitle: scenario.subtitle,
    whatChanged: 'This example compares a declared before state with a declared changed state.',
    whyItMatters: 'Kaleidoscope keeps different legal and practical effects separate so one summary does not hide disagreement.',
    terms: []
  };
}

function scenarioStats(scenario) {
  return [
    ['Paths compared', scenario.mechanism_count],
    ['Changes found', scenario.operation_count],
    ['Ways examined', scenario.lens_count],
    ['Conflicts kept visible', scenario.collision_count]
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

function createScenarioExplanation(scenario) {
  const presentation = scenarioPresentation(scenario);
  const wrapper = element('div', 'scenario-explanation');
  const changed = element('div', 'scenario-explanation-block');
  changed.append(element('strong', '', 'What changed?'), element('p', '', presentation.whatChanged));
  const matters = element('div', 'scenario-explanation-block');
  matters.append(element('strong', '', 'Why does it matter?'), element('p', '', presentation.whyItMatters));
  wrapper.append(changed, matters);
  return wrapper;
}

function createTerms(scenario) {
  const presentation = scenarioPresentation(scenario);
  if (presentation.terms.length === 0) return null;
  const details = element('details', 'term-details');
  details.append(element('summary', '', 'Terms used on this page'));
  const list = element('dl', 'definition-grid');
  for (const [term, definition] of presentation.terms) {
    const row = element('div', 'definition-row');
    row.append(element('dt', '', term), element('dd', '', definition));
    list.append(row);
  }
  details.append(list);
  return details;
}

function createScenarioActions(scenario) {
  const actions = element('div', 'scenario-actions');
  if (scenario.href) {
    const inspect = element('a', '', 'Explore the evidence and changes');
    inspect.href = scenario.href;
    actions.append(inspect);
  } else {
    actions.append(element('span', 'scenario-action-unavailable', 'Detailed evidence page not published yet'));
  }
  if (scenario.receipt_href) {
    const receipt = element('a', '', 'View technical replay proof');
    receipt.href = scenario.receipt_href;
    actions.append(receipt);
  }
  return actions;
}

function createScenarioTechnicalDetails(scenario) {
  return technicalDetails([
    ['Scenario ID', scenario.scenario_id],
    ['Policy family ID', scenario.policy_family_id],
    ['Technical title', scenario.title],
    ['Engineering state', scenario.state],
    ['Inspection state', scenario.inspection_state],
    ['Read-model hash', scenario.read_model_hash]
  ]);
}

function renderScenarioSpotlight(model) {
  const scenario = model.scenarios[0];
  const container = document.querySelector('#scenario-spotlight');
  if (!scenario) {
    container.replaceChildren(element('p', 'scenario-subtitle', 'No source-controlled example is currently available.'));
    return;
  }

  const presentation = scenarioPresentation(scenario);
  const inner = element('div', 'scenario-card-inner');
  inner.append(
    element('div', 'scenario-family', presentation.category),
    element('h3', 'scenario-title', presentation.title),
    element('p', 'scenario-subtitle', presentation.subtitle),
    statusChip(scenario.state),
    createScenarioExplanation(scenario),
    createScenarioStats(scenario),
    createScenarioActions(scenario)
  );
  const terms = createTerms(scenario);
  if (terms) inner.append(terms);
  inner.append(createScenarioTechnicalDetails(scenario));
  container.replaceChildren(inner);
}

function renderPlatformContracts(model) {
  const container = document.querySelector('#upstream-contracts');
  const roleLabels = new Map([
    ['docket_room', 'Finds and preserves official legislation, bill identity, and bill status.'],
    ['rosetta', 'Breaks law and policy text into deterministic, traceable parts.'],
    ['civic_genome', 'Keeps persistent policy identities, traits, events, lineage, and source snapshots.'],
    ['prism', 'Checks evidence and records contradictions without silently resolving them.'],
    ['atlas', 'Provides governed observations, entity resolution, and historical context.'],
    ['esquire', 'Keeps a person’s authorized procedural or case state when that connection is explicitly allowed.']
  ]);
  const cards = model.platform_contracts.map((contract) => {
    const card = element('article', 'upstream-card');
    card.append(
      element('strong', '', contract.label),
      element('span', 'upstream-role', roleLabels.get(contract.platform_id) ?? contract.role),
      element('span', 'upstream-state', `${statusLabel(contract.state)} · Kaleidoscope cannot rewrite it`)
    );
    return card;
  });
  container.replaceChildren(...cards);
}

function renderScenarios(model) {
  const count = document.querySelector('#scenario-count-badge');
  count.textContent = `${model.scenarios.length} ${model.scenarios.length === 1 ? 'example' : 'examples'}`;

  const cards = model.scenarios.map((scenario) => {
    const presentation = scenarioPresentation(scenario);
    const card = element('article', 'scenario-library-card');
    const header = element('div', 'scenario-card-header');
    const identity = element('div');
    identity.append(
      element('span', 'scenario-id', presentation.category),
      element('h2', '', presentation.title)
    );
    header.append(identity, statusChip(scenario.state));

    card.append(
      header,
      element('p', '', presentation.subtitle),
      createScenarioExplanation(scenario),
      createScenarioStats(scenario),
      createScenarioActions(scenario)
    );
    const terms = createTerms(scenario);
    if (terms) card.append(terms);
    card.append(createScenarioTechnicalDetails(scenario));
    return card;
  });

  document.querySelector('#scenario-grid').replaceChildren(...cards);
}

function renderLenses(model) {
  const cards = model.lens_registry.map((lens) => {
    const presentation = LENS_PRESENTATION.get(lens.lens_id) ?? {
      label: 'Another declared way to examine the change',
      description: 'A deterministic question asked separately of the same before-and-after state.'
    };
    const card = element('article', 'lens-card');
    const topline = element('div', 'lens-card-topline');
    topline.append(
      statusChip(lens.state),
      element('strong', 'lens-effect-count', `${lens.effect_count} findings`)
    );

    card.append(
      topline,
      element('h2', '', presentation.label),
      element('p', '', presentation.description)
    );
    if (lens.href) {
      const link = element('a', 'quiet-link', 'Explore the current findings →');
      link.href = lens.href;
      card.append(link);
    } else {
      card.append(element('span', 'scenario-action-unavailable', 'Detailed findings page not published yet'));
    }
    card.append(technicalDetails([
      ['Technical term', 'Lens'],
      ['Lens ID', lens.lens_id],
      ['Examples using this lens', lens.scenario_count],
      ['Engine state', lens.state]
    ]));
    return card;
  });
  document.querySelector('#lens-registry').replaceChildren(...cards);
}

function renderSources(model) {
  const source = model.source_corpus;
  document.querySelector('#source-count').textContent = source.entry_count;
  document.querySelector('#source-subset').textContent = source.selected_subset ? 'Yes' : 'None';
  document.querySelector('#source-embedding').textContent = source.embedded_in_runtime ? 'Embedded' : 'Kept separate';

  const definitions = [
    ['Evidence record', source.manifest_id],
    ['What is kept', source.corpus_policy],
    ['How exact file identity is checked', source.identity_rule],
    ['Silent source selection', source.selected_subset ? 'A preferred subset is active.' : 'None. Files are not silently dropped because they conflict, duplicate, revise, or complicate the story.'],
    ['Where the source files live', source.embedded_in_runtime ? 'Source bytes are embedded in the runtime.' : 'Source custody is kept separate from the running application.']
  ];

  const fragment = document.createDocumentFragment();
  for (const [term, description] of definitions) {
    const row = element('div', 'definition-row');
    row.append(element('dt', '', term), element('dd', '', description));
    fragment.append(row);
  }
  document.querySelector('#source-contract').replaceChildren(fragment);
}

function receiptPublicLabel(receipt) {
  if (receipt.receipt_id === 'project2025_title_vii_vertical_slice.v1') {
    return 'Replay proof for the workplace-rights example';
  }
  if (String(receipt.receipt_id).startsWith('preempt-run-')) {
    return 'Replay proof for the state/local-authority example';
  }
  if (String(receipt.receipt_id).startsWith('impact-run-')) {
    return 'Replay proof for who or what is directly touched by the legal change';
  }
  if (receipt.receipt_id === 'civic_genome_kaleidoscope_authenticated_handoff_hb2487_2026_08_04') {
    return 'Proof of a validated Civic Genome handoff';
  }
  if (receipt.receipt_id === 'kaleidoscope_supabase_projection_substrate_2026_08_09.v1') {
    return 'Proof of the current Kaleidoscope storage boundary';
  }
  if (receipt.receipt_id === 'civic_genome_durable_intake.live.v1') {
    return 'Live proof of accepted Civic Genome source intake';
  }
  return receipt.label;
}

function renderReceipts(model) {
  const cards = model.receipts.map((receipt) => {
    const card = element('article', 'receipt-card');
    card.append(statusChip(receipt.state), element('h2', '', receiptPublicLabel(receipt)));

    const plain = element('p', '', 'This record makes the underlying technical state inspectable and replayable instead of asking you to trust a hidden conclusion.');
    card.append(plain);
    card.append(technicalDetails([
      ['Technical label', receipt.label],
      ['Receipt ID', receipt.receipt_id],
      ['Receipt hash', receipt.receipt_hash],
      ['Run ID', receipt.run_id],
      ['Snapshot hash', receipt.source_snapshot_hash],
      ['Binding state', receipt.binding_state],
      ['Persisted', receipt.persisted],
      ['Projection executed', receipt.projection_executed],
      ['Accepted source bindings', receipt.binding_count],
      ['Immutable snapshots', receipt.snapshot_count],
      ['Stored components', receipt.component_count],
      ['Projection runs', receipt.projection_run_count],
      ['Projection results', receipt.projection_result_count],
      ['Replay receipts', receipt.replay_receipt_count],
      ['Tables', receipt.table_count],
      ['Functions', receipt.function_count],
      ['Triggers', receipt.trigger_count],
      ['Rows', receipt.row_count]
    ]));

    if (receipt.href) {
      const link = element('a', '', 'Open raw technical record →');
      link.href = receipt.href;
      card.append(link);
    }
    return card;
  });
  document.querySelector('#receipt-list').replaceChildren(...cards);
}

function boundaryDisplay(key, value) {
  const labels = {
    database_schema: ['Database area', value, 'Kaleidoscope keeps its own governed record area separate from upstream systems.'],
    database_tables: ['Record structures', value, 'The current Kaleidoscope record structures are access-controlled.'],
    database_functions: ['Governed database functions', value, 'Database-side functions are part of the inspectable storage boundary.'],
    database_triggers: ['Append-only protections', value, 'Database triggers reject update/delete attempts on truth-bearing records.'],
    database_rows: ['Official saved results', value, 'No canonical Kaleidoscope analysis has been saved yet.'],
    database_migrations: ['Storage versions applied', value, 'The storage structure and its indexing change are both recorded.'],
    database_persistence: ['Saving official results', value ? 'Enabled' : 'Not enabled', 'The storage exists, but the runtime has no proven authorized write path.'],
    canonical_projection_execution: ['Live official projections', value ? 'Enabled' : 'Not enabled', 'Current executions are bounded tested examples, not canonical civic truth.'],
    civic_genome_durable_intake_state: ['Civic Genome durable intake', statusLabel(value), 'Accepted Civic Genome source snapshots are shown separately from official Kaleidoscope projections.'],
    civic_genome_durable_binding_count: ['Accepted Civic Genome bindings', value ?? '—', 'Append-only source bindings; not a Kaleidoscope projection result.'],
    civic_genome_durable_snapshot_count: ['Immutable Civic Genome snapshots', value ?? '—', 'Persisted source states retained without altering their upstream owner.'],
    civic_genome_durable_component_count: ['Stored source components', value ?? '—', 'Source components retained within the bounded snapshots.'],
    civic_genome_projection_run_count: ['Civic Genome projection runs', value ?? '—', 'A durable input does not authorize a canonical Kaleidoscope projection.'],
    civic_genome_projection_result_count: ['Civic Genome projection results', value ?? '—', 'No output is claimed merely because a source snapshot was retained.'],
    civic_genome_replay_receipt_count: ['Civic Genome replay receipts', value ?? '—', 'Replay remains a separate governed stage.'],
    legislative_consequence_stage_1_2: ['Legal-change analysis', value ? 'First two stages available' : 'Unavailable', 'Direct structural change and governed consequence relationships are available.'],
    legislative_consequence_stage_3: ['Who or what is directly touched?', value ? 'Available' : 'Unavailable', 'The current Stage 3 classification groups already-governed consequences without adding causation, actors, or unsupported economic effects.'],
    legislative_consequence_stages_4_6: ['Historical comparison and later stages', value ? 'Available' : 'Not run', 'Atlas historical comparison, Lighthouse accountability presentation, and the later checklist are not executed.'],
    persistence_preflight_available: ['Safe-save check', value ? 'Available' : 'Unavailable', 'Kaleidoscope can identify what could map into storage and what still blocks a live write.'],
    persistence_live_write_authorized: ['Live database write', value ? 'Authorized' : 'Not authorized', 'A mapping check is not permission to save an official record.'],
    upstream_mutation: ['Changing source systems', value ? 'Enabled' : 'Prohibited', 'Kaleidoscope reads governed outputs but does not rewrite Docket Room, Rosetta, Civic Genome, Prism, Atlas, or Esquire.'],
    hidden_composite_score: ['Hidden all-in-one score', value ? 'Present' : 'None', 'Different findings and conflicts stay separate instead of being averaged into one number.'],
    runtime_ai_dependency: ['AI in the runtime decision path', value ? 'Present' : 'None', 'The execution contract is deterministic code and declared math only.'],
    unresolved_states_preserved: ['Open questions', value ? 'Preserved' : 'Not preserved', 'Unknown, mixed, contradictory, and incomplete states remain visible.'],
    source_identity_rule: ['Exact source identity', humanize(value), 'File identity is governed by exact bytes and SHA-256, not filename similarity.']
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
  document.querySelector('#platform-mission').textContent = 'See what changes, why it matters, what the evidence supports, and what is still unknown — without hiding disagreement behind a score.';
  document.querySelector('#truth-label').textContent = model.truth_label;
  document.querySelector('#hero-environment').textContent = model.environment === 'staging' ? 'Testing / staging' : humanize(model.environment);
  document.querySelector('#hero-determinism').textContent = model.deterministic ? 'Same inputs → same result' : 'Unverified';
  const intake = model.civic_genome_durable_intake ?? {};
  document.querySelector('#hero-persistence').textContent = intake.available === true && intake.binding_count > 0
    ? `${intake.binding_count} source binding${intake.binding_count === 1 ? '' : 's'} retained; official saving disabled`
    : model.system_boundary.database_persistence
      ? 'Official saving enabled'
      : model.summary.database_tables > 0
        ? 'Storage ready; saving not enabled'
        : 'Not available';
  document.querySelector('#hero-projection').textContent = model.system_boundary.canonical_projection_execution
    ? 'Official projections enabled'
    : 'Examples only';
  document.querySelector('#sidebar-foundation').textContent = `v${model.foundation_version}`;
  document.querySelector('#footer-model-hash').textContent = `Technical read-model hash · ${model.read_model_hash}`;
  document.title = `${model.platform_label} · Luminari`;
}

function render(model) {
  renderHeaderState(model);
  renderMetrics(model);
  renderCivicGenomeDurableIntake(model);
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
