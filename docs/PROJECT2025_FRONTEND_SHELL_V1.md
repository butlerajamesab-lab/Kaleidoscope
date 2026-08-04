# Project 2025 Frontend Shell v1

## Purpose

This is Kaleidoscope's first user-facing inspection surface. It renders the already-merged, deterministic Project 2025 Title VII vertical-slice read model without creating a second projection engine, copying upstream ownership, or introducing database persistence.

## Routes

- `GET /project2025/title-vii` — responsive inspection shell;
- `GET /project2025/title-vii.css` — source-controlled presentation rules;
- `GET /project2025/title-vii.js` — source-controlled renderer;
- `GET /v1/project2025/title-vii/read-model` — exact immutable frontend read model;
- `GET /v1/project2025/title-vii/receipt` — exact deterministic receipt.

The existing JSON root, health route, status route, typed-diff route, and authenticated Civic Genome validation route remain in place.

## Truth boundary

The surface prominently labels the data:

```text
executed_test_fixture_not_canonical_fact
```

It does not imply that:

- a live upstream projection has executed;
- all 41 source artifacts have been read line by line;
- Rosetta must run for this source-only fixture;
- Prism or Atlas has been invoked;
- a Civic Genome binding has been accepted;
- a Supabase migration has been applied;
- any population outcome has been forecast;
- any upstream platform has been mutated.

## Inspection structure

The shell exposes:

1. scenario summary and typed operation counts;
2. distinct mechanism timelines;
3. four independent lens panels;
4. preserved, non-averaged collisions;
5. source artifacts and unresolved conditions;
6. input, diff, projection, read-model, replay, and receipt identities.

No composite political, moral, confidence, or risk score is displayed.

## Deterministic binding

Before serving the fixture, the runtime verifies:

- the read-model hash against the canonical read-model basis;
- the receipt's read-model hash against the validated fixture;
- scenario identity continuity;
- `no_mutation = true`;
- `database_write_count = 0`.

A mismatch fails closed.

## Browser safety and accessibility

- strict self-only Content Security Policy;
- no inline scripts or styles;
- no dynamic `innerHTML` rendering;
- dynamic values use DOM `textContent`;
- responsive layout;
- reduced-motion support;
- keyboard skip link and semantic sections;
- raw read-model and receipt routes remain directly inspectable.

## Deployment boundary

This source-controlled frontend shell does not itself authorize a Render deployment. Kaleidoscope Supabase remains empty and unapplied.
