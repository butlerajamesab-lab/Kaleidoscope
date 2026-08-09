const READ_MODEL_URL = '/v1/scenarios/state-local-protections/read-model';
const RECEIPT_URL = '/v1/scenarios/state-local-protections/receipt';

const MECHANISM_PRESENTATION = new Map([
  ['PREEMPT-TN-2011', {
    place: 'Tennessee',
    status: 'Currently operative in the represented source state',
    summary: 'The source record describes a 2011 state law restricting local anti-discrimination standards that differ from or add to the state-law baseline.'
  }],
  ['PREEMPT-AR-2015', {
    place: 'Arkansas',
    status: 'Currently operative in the represented source state',
    summary: 'The source record describes a 2015 state law restricting local governments from creating protected classifications or discrimination rules beyond state law.'
  }],
  ['PREEMPT-NC-HB2-HISTORICAL', {
    place: 'North Carolina',
    status: 'Historical — the represented preemption period expired',
    summary: 'The source record treats North Carolina as a historical member of this family: the represented restriction expired in 2020 and local authority later returned.'
  }],
  ['PREEMPT-TX-2023', {
    place: 'Texas',
    status: 'Contested / unresolved application',
    summary: 'The source record describes a broad 2023 preemption law that was later invoked in litigation involving a Dallas LGBTQ anti-bias ordinance. The outcome is not established in this source pack.'
  }],
  ['P25-IA-01', {
    place: 'Iowa',
    status: 'Operative with open primary-source items',
    summary: 'The source record describes a 2026 restriction preventing Iowa local governments from maintaining civil-rights categories broader than or different from state law.'
  }]
]);

const LENS_PRESENTATION = new Map([
  ['preemption_operability.v1', ['Is the restriction in force now?', 'Separates currently operative restrictions from historical, contested, or unresolved ones.']],
  ['preemption_temporal_history.v1', ['How has the rule changed over time?', 'Keeps historical and current legal states separate instead of flattening them into one present-day description.']],
  ['preemption_jurisdictional_variation.v1', ['How does it differ from state to state?', 'Compares scope, legal vehicle, timing, and unresolved state across jurisdictions.']],
  ['affected_populations.v1', ['Who is structurally affected?', 'Identifies source-declared populations connected to a change without predicting population outcomes.']]
]);

const STATE_LABELS = new Map([
  ['operative', 'Operative'],
  ['unresolved', 'Unresolved'],
  ['contested', 'Contested'],
  ['operative_with_open_primary_source_items', 'Operative · some primary-source review still open'],
  ['executed_test_fixture_not_canonical_fact', 'Tested example · not official civic fact'],
  ['preserved_not_averaged', 'Both findings preserved — not averaged']
]);

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

function stateLabel(value) {
  return STATE_LABELS.get(value) ?? humanize(value);
}

function badge(value, tone = 'neutral') {
  return element('span', `badge ${tone}`, stateLabel(value));
}

function appendList(container, values) {
  container.replaceChildren();
  for (const value of values) container.append(element('li', '', value));
}

function technicalDetails(rows) {
  const details = element('details', 'technical-details');
  details.append(element('summary', '', 'Technical details'));
  const list = element('dl', 'hash-grid');
  for (const [label, value] of rows.filter(([, value]) => value !== undefined && value !== null)) {
    const row = element('div', 'hash-row');
    row.append(element('dt', '', label), element('dd', '', String(value)));
    list.append(row);
  }
  details.append(list);
  return details;
}

function renderSummary(model) {
  const summary = model.summary;
  const values = [
    ['Jurisdictions compared', summary.mechanism_count],
    ['Changes represented', summary.operation_count],
    ['Separate questions asked', summary.lens_count],
    ['Conflicts kept visible', summary.collision_count],
    ['Open questions', summary.unresolved_count]
  ];
  const container = document.querySelector('#summary-grid');
  container.replaceChildren();
  for (const [label, value] of values) {
    const card = element('article', 'summary-card');
    card.append(element('span', 'summary-value', value), element('span', 'summary-label', label));
    container.append(card);
  }

  const operationLabels = new Map([
    ['preempted', 'Local authority restricted'],
    ['preserved', 'Represented state kept'],
    ['modified', 'Represented state changed'],
    ['unresolved', 'Not settled by the sources'],
    ['removed', 'Represented protection or path removed'],
    ['added', 'New represented state added'],
    ['superseded', 'Replaced by a later represented state']
  ]);
  const operations = document.querySelector('#operation-counts');
  operations.replaceChildren();
  for (const [operation, count] of Object.entries(summary.operation_counts).sort()) {
    const pill = element('span', 'operation-pill');
    pill.append(element('strong', '', count), document.createTextNode(operationLabels.get(operation) ?? humanize(operation)));
    operations.append(pill);
  }
}

function renderMechanisms(model) {
  const container = document.querySelector('#mechanism-paths');
  container.replaceChildren();

  for (const mechanism of model.mechanism_paths) {
    const presentation = MECHANISM_PRESENTATION.get(mechanism.mechanism_id) ?? {
      place: mechanism.mechanism_id,
      status: stateLabel(mechanism.implementation_state),
      summary: 'A governed implementation path in this source-defined family.'
    };
    const card = element('article', 'mechanism-card');
    const header = element('div', 'card-header');
    const titleBlock = element('div');
    titleBlock.append(
      element('p', 'card-kicker', presentation.status),
      element('h3', '', presentation.place)
    );
    header.append(titleBlock, badge(mechanism.implementation_state));

    const explanation = element('p', '', presentation.summary);
    const chainHeading = element('h4', '', 'How the represented path developed');
    const chain = element('ol', 'chain-list');
    for (const step of mechanism.implementation_chain) {
      chain.append(element('li', 'chain-event', typeof step === 'string' ? step : JSON.stringify(step)));
    }

    card.append(
      header,
      explanation,
      chainHeading,
      chain,
      technicalDetails([
        ['Mechanism ID', mechanism.mechanism_id],
        ['Implementation state', mechanism.implementation_state],
        ['Structural match', mechanism.implementation_match],
        ['Route types', mechanism.implementation_route_types.join(', ')]
      ])
    );
    container.append(card);
  }
}

function renderLenses(model) {
  const container = document.querySelector('#lens-panels');
  container.replaceChildren();

  for (const lens of model.lens_panels) {
    const [title, description] = LENS_PRESENTATION.get(lens.lens_id) ?? [
      'Another way to examine the change',
      'A declared deterministic question asked separately of the same source-bound state.'
    ];
    const card = element('article', 'lens-card');
    const summary = element('div', 'lens-summary');
    summary.append(
      element('p', 'card-kicker', 'One separate question'),
      element('h3', '', title),
      element('p', 'effect-meta', description)
    );

    const effects = element('ul', 'effect-list');
    for (const effect of lens.effects) {
      const item = element('li', 'effect-item');
      const topline = element('div', 'effect-topline');
      topline.append(
        badge(effect.jurisdiction),
        badge(effect.direction),
        badge(effect.evidence_ceiling, effect.evidence_ceiling === 'primary_verified' ? '' : 'warning')
      );
      item.append(
        topline,
        element('p', 'effect-title', effect.statement)
      );
      if (effect.unresolved_conditions.length > 0) {
        item.append(element('p', 'effect-meta', `Still unresolved: ${effect.unresolved_conditions.map(humanize).join(' · ')}`));
      }
      item.append(technicalDetails([
        ['Lens ID', lens.lens_id],
        ['Effect ID', effect.effect_id],
        ['Effect type', effect.effect_type],
        ['Verification state', effect.verification_state],
        ['Evidence ceiling', effect.evidence_ceiling]
      ]));
      effects.append(item);
    }

    card.append(summary, effects);
    container.append(card);
  }
}

function renderCollisions(model) {
  const container = document.querySelector('#collision-cards');
  container.replaceChildren();

  for (const collision of model.collisions) {
    const card = element('article', 'collision-card');
    card.append(
      element('p', 'card-kicker', 'Both findings stay visible'),
      element('h3', '', collision.statement),
      element('p', 'collision-state', stateLabel(collision.resolution_state))
    );
    if (collision.unresolved_conditions.length > 0) {
      card.append(element('p', 'effect-meta', `Still unresolved: ${collision.unresolved_conditions.map(humanize).join(' · ')}`));
    }
    card.append(technicalDetails([
      ['Collision ID', collision.collision_id],
      ['Collision type', collision.collision_type],
      ['Left effect', collision.left_effect_id],
      ['Right effect', collision.right_effect_id]
    ]));
    container.append(card);
  }
}

function renderInspection(model, receipt) {
  const container = document.querySelector('#inspection-hashes');
  container.replaceChildren();
  const values = [
    ['Scenario ID', model.scenario_id],
    ['Policy family ID', model.policy_family_id],
    ['Run ID', receipt.run_id],
    ['Deterministic replay key', receipt.deterministic_replay_key],
    ['Input hash', model.inspection.input_hash],
    ['Diff hash', model.inspection.diff_hash],
    ['Projection bundle hash', model.inspection.projection_bundle_hash],
    ['Read model hash', model.read_model_hash],
    ['Receipt hash', receipt.receipt_hash],
    ['Write boundary', receipt.no_mutation && receipt.database_write_count === 0 ? 'No mutation · 0 database writes' : 'Boundary mismatch']
  ];
  for (const [label, value] of values) {
    const row = element('div', 'hash-row');
    row.append(element('dt', '', label), element('dd', '', value));
    container.append(row);
  }
}

function render(model, receipt) {
  document.querySelector('#truth-label').textContent = stateLabel(model.status);
  renderSummary(model);
  renderMechanisms(model);
  renderLenses(model);
  renderCollisions(model);
  appendList(document.querySelector('#excluded-factors'), model.excluded_factors);
  appendList(document.querySelector('#source-artifacts'), model.source_artifact_ids);
  appendList(document.querySelector('#unresolved-conditions'), model.unresolved_conditions);
  renderInspection(model, receipt);
}

async function load() {
  try {
    const [modelResponse, receiptResponse] = await Promise.all([
      fetch(READ_MODEL_URL, { headers: { accept: 'application/json' }, cache: 'no-store' }),
      fetch(RECEIPT_URL, { headers: { accept: 'application/json' }, cache: 'no-store' })
    ]);
    if (!modelResponse.ok || !receiptResponse.ok) {
      throw new Error(`example_request_failed:${modelResponse.status}:${receiptResponse.status}`);
    }
    const [model, receipt] = await Promise.all([modelResponse.json(), receiptResponse.json()]);
    if (model.status !== 'executed_test_fixture_not_canonical_fact'
        || receipt.no_mutation !== true
        || receipt.database_write_count !== 0
        || receipt.read_model_hash !== model.read_model_hash) {
      throw new Error('example_truth_boundary_failed');
    }
    render(model, receipt);
  } catch (error) {
    const panel = document.querySelector('#load-error');
    panel.hidden = false;
    document.querySelector('#load-error-message').textContent = error instanceof Error
      ? error.message
      : 'unknown_frontend_error';
  }
}

load();