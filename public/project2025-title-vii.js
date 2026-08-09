const READ_MODEL_URL = '/v1/project2025/title-vii/read-model';
const RECEIPT_URL = '/v1/project2025/title-vii/receipt';

const MECHANISM_PRESENTATION = new Map([
  ['P25-DOL-01', {
    title: 'Federal court, executive, litigation, and EEOC pathway',
    summary: 'The represented federal path keeps the Supreme Court’s Title VII protection separate from changes in executive interpretation, litigation over agency guidance, court action affecting that guidance, and later EEOC action.'
  }],
  ['P25-IA-01', {
    title: 'Iowa state-law and local-government pathway',
    summary: 'The represented Iowa path removes gender identity from the state protected-class structure and later limits local governments from maintaining broader or different discrimination categories.'
  }]
]);

const LENS_PRESENTATION = new Map([
  ['civil_rights.v1', ['What legal protections remain or change?', 'Looks only at formal rights and protected-class coverage.']],
  ['enforcement_pathways.v1', ['What ways to enforce the right remain?', 'Separates agency, court, private-action, and administrative pathways instead of treating them as one thing.']],
  ['local_government_preemption.v1', ['What can local governments still do?', 'Looks at whether state law restricts a city or county from maintaining broader local protections.']],
  ['affected_populations.v1', ['Who is structurally affected?', 'Identifies source-declared populations connected to a change without forecasting population outcomes.']]
]);

const STATE_LABELS = new Map([
  ['partially_implemented_or_contested', 'Partly implemented or contested'],
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
    ['Major paths compared', summary.mechanism_count],
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
    ['preserved', 'Represented protection or path kept'],
    ['modified', 'Represented state changed'],
    ['removed', 'Represented protection or path removed'],
    ['superseded', 'Replaced by a later represented state'],
    ['preempted', 'Local authority restricted'],
    ['unresolved', 'Not settled by the sources'],
    ['added', 'New represented state added']
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
      title: mechanism.mechanism_id,
      summary: 'A governed implementation path in this example.'
    };
    const card = element('article', 'mechanism-card');
    const header = element('div', 'card-header');
    const titleBlock = element('div');
    titleBlock.append(
      element('p', 'card-kicker', stateLabel(mechanism.implementation_state)),
      element('h3', '', presentation.title)
    );
    header.append(titleBlock, badge(mechanism.implementation_state));

    const chainHeading = element('h4', '', 'How the represented path developed');
    const chain = element('ol', 'chain-list');
    for (const step of mechanism.implementation_chain) {
      const item = element('li');
      if (typeof step === 'string') {
        item.append(element('span', 'chain-event', step));
      } else {
        item.append(
          element('span', 'chain-actor', `${step.step}. ${step.actor}`),
          element('span', 'chain-event', step.event),
          badge(step.route_type)
        );
      }
      chain.append(item);
    }

    card.append(
      header,
      element('p', '', presentation.summary),
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
      item.append(topline, element('p', 'effect-title', effect.statement));
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