const READ_MODEL_URL = '/v1/project2025/title-vii/read-model';
const RECEIPT_URL = '/v1/project2025/title-vii/receipt';

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

function badge(value, tone = 'neutral') {
  return element('span', `badge ${tone}`, humanize(value));
}

function appendList(container, values) {
  container.replaceChildren();
  for (const value of values) {
    container.append(element('li', '', value));
  }
}

function renderSummary(model) {
  const summary = model.summary;
  const values = [
    ['Mechanisms', summary.mechanism_count],
    ['State operations', summary.operation_count],
    ['Independent lenses', summary.lens_count],
    ['Preserved collisions', summary.collision_count],
    ['Unresolved items', summary.unresolved_count]
  ];
  const container = document.querySelector('#summary-grid');
  container.replaceChildren();

  for (const [label, value] of values) {
    const card = element('article', 'summary-card');
    card.append(
      element('span', 'summary-value', value),
      element('span', 'summary-label', label)
    );
    container.append(card);
  }

  const operations = document.querySelector('#operation-counts');
  operations.replaceChildren();
  for (const [operation, count] of Object.entries(summary.operation_counts).sort()) {
    const pill = element('span', 'operation-pill');
    pill.append(element('strong', '', count), document.createTextNode(humanize(operation)));
    operations.append(pill);
  }
}

function renderMechanisms(model) {
  const container = document.querySelector('#mechanism-paths');
  container.replaceChildren();

  for (const mechanism of model.mechanism_paths) {
    const card = element('article', 'mechanism-card');
    const header = element('div', 'card-header');
    const titleBlock = element('div');
    titleBlock.append(
      element('p', 'card-kicker', 'Governed mechanism'),
      element('h3', '', mechanism.mechanism_id)
    );
    header.append(titleBlock, badge(mechanism.implementation_state));

    const meta = element('div', 'card-meta');
    meta.append(badge(mechanism.implementation_match));
    for (const routeType of mechanism.implementation_route_types) {
      meta.append(badge(routeType));
    }

    const chain = element('ol', 'chain-list');
    for (const step of mechanism.implementation_chain) {
      const item = element('li');
      item.append(
        element('span', 'chain-actor', `${step.step}. ${step.actor}`),
        element('span', 'chain-event', step.event),
        badge(step.route_type)
      );
      chain.append(item);
    }

    card.append(header, meta, chain);
    container.append(card);
  }
}

function renderLenses(model) {
  const container = document.querySelector('#lens-panels');
  container.replaceChildren();

  for (const lens of model.lens_panels) {
    const card = element('article', 'lens-card');
    const summary = element('div', 'lens-summary');
    summary.append(
      element('p', 'card-kicker', 'Declared lens'),
      element('h3', '', lens.lens_id),
      element('p', 'effect-meta', `${lens.effect_count} independently emitted effect${lens.effect_count === 1 ? '' : 's'}`)
    );

    const effects = element('ul', 'effect-list');
    for (const effect of lens.effects) {
      const item = element('li', 'effect-item');
      const topline = element('div', 'effect-topline');
      topline.append(
        badge(effect.direction),
        badge(effect.jurisdiction),
        badge(effect.evidence_ceiling, effect.evidence_ceiling === 'primary_verified' ? '' : 'warning')
      );
      item.append(
        topline,
        element('p', 'effect-title', effect.statement),
        element('p', 'effect-meta', `${humanize(effect.effect_type)} · verification ${humanize(effect.verification_state)}`)
      );
      if (effect.unresolved_conditions.length > 0) {
        item.append(element('p', 'effect-meta', `Unresolved: ${effect.unresolved_conditions.map(humanize).join(' · ')}`));
      }
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
      element('p', 'card-kicker', humanize(collision.collision_type)),
      element('h3', '', collision.collision_id),
      element('p', '', collision.statement),
      element('p', 'collision-state', humanize(collision.resolution_state))
    );
    if (collision.unresolved_conditions.length > 0) {
      card.append(element('p', 'effect-meta', `Unresolved: ${collision.unresolved_conditions.map(humanize).join(' · ')}`));
    }
    container.append(card);
  }
}

function hashRow(label, value) {
  const row = element('div', 'hash-row');
  row.append(element('dt', '', label), element('dd', '', value));
  return row;
}

function renderInspection(model, receipt) {
  const container = document.querySelector('#inspection-hashes');
  container.replaceChildren();
  const values = [
    ['Run ID', receipt.run_id],
    ['Deterministic replay key', receipt.deterministic_replay_key],
    ['Input hash', model.inspection.input_hash],
    ['Diff hash', model.inspection.diff_hash],
    ['Projection bundle hash', model.inspection.projection_bundle_hash],
    ['Read model hash', model.read_model_hash],
    ['Receipt hash', receipt.receipt_hash],
    ['Mutation boundary', receipt.no_mutation && receipt.database_write_count === 0 ? 'no mutation · 0 database writes' : 'boundary mismatch']
  ];
  for (const [label, value] of values) container.append(hashRow(label, value));
}

function render(model, receipt) {
  document.querySelector('#page-title').textContent = model.title;
  document.querySelector('#page-subtitle').textContent = model.subtitle;
  document.querySelector('#truth-label').textContent = humanize(model.status);

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
      fetch(READ_MODEL_URL, { headers: { accept: 'application/json' } }),
      fetch(RECEIPT_URL, { headers: { accept: 'application/json' } })
    ]);
    if (!modelResponse.ok || !receiptResponse.ok) {
      throw new Error(`fixture_request_failed:${modelResponse.status}:${receiptResponse.status}`);
    }
    const [model, receipt] = await Promise.all([modelResponse.json(), receiptResponse.json()]);
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
