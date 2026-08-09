# Kaleidoscope Platform Frontend v1

## Purpose

This is the first platform-level Kaleidoscope workspace. It does not replace the deterministic engine, create new upstream authority, or activate canonical database persistence. It presents the source-controlled system state that already exists and provides a stable front door for scenario and engine inspection.

The design principle is:

> Do not trust a conclusion that cannot be inspected.

## Browser entry points

- `GET /app` — explicit Kaleidoscope workspace.
- `GET /` with `Accept: text/html` — the same workspace for normal browsers.
- `GET /` without an HTML accept header — the existing machine-readable root JSON remains available.
- `GET /app.css` — source-controlled presentation rules.
- `GET /app.js` — source-controlled renderer.
- `GET /v1/platform/read-model` — deterministic platform read model.

The detailed Project 2025 inspection surface remains available at `/project2025/title-vii`.

## Workspace sections

The workspace exposes six bounded surfaces:

1. **Overview** — runtime truth, platform metrics, current capability state, first scenario, and peer-platform ownership map.
2. **Scenarios** — declared scenario library. The Project 2025 Title VII vertical slice is currently the only executable source-controlled scenario.
3. **Lenses** — current independent lens registry. Lens results are not averaged into a composite score.
4. **Sources** — active source-manifest count and custody rules. The UI does not claim all 41 sources were read line by line.
5. **Receipts** — deterministic Project 2025 run receipt, authenticated Civic Genome handoff proof, and live Supabase substrate receipt.
6. **System** — explicit enabled/disabled boundaries, current Legislative Consequence stage boundary, governed empty projection substrate, and inspectable runtime routes.

## Read-model construction

`src/platform-frontend-shell.mjs` derives its state from existing source-controlled artifacts:

- `source_manifests/source_pack_2026_08_03_v3.json`;
- `fixtures/project2025-title-vii-read-model.v1.json`;
- `fixtures/project2025-title-vii-receipt.v1.json`;
- `fixtures/eeoc_demographics_reporting_rollback_2026.complete.v1.mjs`;
- `receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json`;
- `docs/receipts/CIVIC_GENOME_KALEIDOSCOPE_AUTHENTICATED_HANDOFF_HB2487_2026-08-04.json`.

The earlier `fixtures/kaleidoscope-substrate-state-2026-08-09.v1.json` remains preserved as the frontend-build observation that first identified the live non-`public` schema. The stronger canonical runtime source is now the governed receipt under `receipts/`.

Before serving the workspace, the adapter verifies:

- source-manifest count and complete-corpus policy;
- Project 2025 read-model hash;
- Project 2025 receipt-to-read-model continuity;
- zero-write and no-mutation declarations for the source-controlled Project 2025 run;
- Legislative Consequence Stage 1/2 shape: 12 structural deltas, 6 typed consequence edges, 6 Docket/Rosetta/Civic Genome bindings, and 1 preserved lifecycle conflict;
- the source-controlled user-triggered Rosetta transition rather than treating the prior `not_run` state as an error;
- Legislative Consequence stages 3 through 6 remain null with no projection or persistence;
- the governed projection-substrate receipt: schema `kaleidoscope`, 16 truth-bearing tables, 3 governed functions, 17 append-only triggers, 2 applied migrations, zero rows, RLS enabled, and no proven runtime persistence adapter;
- completed Civic Genome handoff proof;
- `validated_unbound` delivery state;
- unresolved Civic Genome binding state;
- no Kaleidoscope persistence, projection execution, or upstream mutation in the Civic Genome handoff receipt.

Any mismatch fails closed.

## Current Supabase substrate

The Kaleidoscope Supabase project contains a dedicated governed `kaleidoscope` schema. This is materially different from the earlier state where only the empty `public` schema had been inspected.

Current observed substrate:

- Supabase project: `iwmytuwofniybsmidtki`;
- schema: `kaleidoscope`;
- migration `20260809144200_kaleidoscope_projection_substrate` applied;
- migration `20260809144457_kaleidoscope_projection_substrate_indexes` applied;
- 16 truth-bearing projection-substrate tables;
- 3 governed functions;
- 17 non-internal append-only triggers;
- row-level security enabled on all truth-bearing tables;
- no table privileges for `public`, `anon`, or `authenticated`;
- `service_role` limited to `select` and `insert`;
- update/delete rejected by append-only triggers;
- exact total canonical rows across all 16 tables: `0`;
- no runtime database adapter has been proven or enabled.

The correct staging description is therefore:

```text
projection_substrate_applied_empty_runtime_adapter_not_bound
```

This frontend reconciliation applies no new Supabase migration and writes no database rows.

## Legislative Consequence boundary

The workspace reports the merged EEOC workforce-demographics specimen as a bounded engine capability, not as a completed projection:

- Stage 1: 12 deterministic structural deltas;
- Stage 2: 6 typed consequence edges with explicit causal states;
- Docket/Rosetta/Civic Genome bindings: 6;
- preserved lifecycle conflict: 1;
- Rosetta transition trigger: `user_initiated_rosetta_run`;
- Prism: `not_observed` for the specimen;
- Stage 3 impact surface: `null`;
- Stage 4 Atlas historical comparison: `null`;
- Stage 5 Lighthouse accountability view: `null`;
- Stage 6 instantiated checklist: `null`;
- projection executed: `false`;
- database persisted: `false`.

The prior pre-run Rosetta state is preserved as chronology, not treated as a missing integration or failure.

## Platform ownership boundary

The UI reflects the constitutional architecture rather than flattening all peer platforms into Kaleidoscope.

- Docket Room owns official legislation identity, status, and retrieval.
- Rosetta owns deterministic legal decomposition.
- Civic Genome owns persistent policy identity, traits, events, lineage, and immutable snapshots.
- Prism owns verification receipts and contradiction findings.
- Atlas owns governed observations and historical context.
- Esquire owns person-controlled procedural state when explicitly authorized.
- Kaleidoscope owns scenarios, declared transformations, lenses, collisions, assumptions, unresolved effects, and replay receipts.

Kaleidoscope does not press upstream buttons, repair upstream records, or silently promote missing upstream state.

## Truthful staging state

The frontend must continue to show the current staging boundary:

- foundation version `0.1.4`;
- deterministic runtime;
- one executable source-controlled Project 2025 test scenario;
- Legislative Consequence Stage 1/2 source-controlled, stages 3–6 not executed;
- four current Project 2025 lenses;
- three preserved Project 2025 collisions;
- 41 active source artifacts;
- zero accepted Civic Genome bindings;
- 16 RLS-enabled Kaleidoscope projection-substrate tables;
- 3 governed database functions;
- 17 append-only triggers;
- zero canonical rows in those tables;
- two recorded projection-substrate migrations;
- runtime persistence adapter not bound;
- canonical projection execution disabled;
- no runtime AI dependency;
- no hidden composite score.

## Browser security boundary

The frontend uses:

- self-only Content Security Policy;
- no inline scripts or styles;
- no `innerHTML` or `eval` rendering paths;
- `textContent` and DOM node construction for dynamic source values;
- no external fonts, trackers, analytics, or runtime dependencies;
- disabled camera, microphone, geolocation, and payment permissions;
- responsive layout and reduced-motion support.

## Deployment boundary

The repository auto-deploys `main` to the Kaleidoscope Render service. A merge may therefore trigger a deployment automatically. Deployment must be verified after merge; source-control state alone is never represented as a live runtime proof.

The platform frontend changes presentation and truthful runtime status only. It does not apply, alter, or populate the existing projection substrate.
