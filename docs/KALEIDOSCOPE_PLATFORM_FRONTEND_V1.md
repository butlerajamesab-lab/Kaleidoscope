# Kaleidoscope Platform Frontend v1

## Purpose

This is Kaleidoscope's platform-level inspection workspace. It presents the governed source-controlled state that exists without manufacturing missing execution, accepted bindings, or persistence.

> Do not trust a conclusion that cannot be inspected.

## Browser entry points

- `GET /app` — explicit Kaleidoscope workspace.
- `GET /` with `Accept: text/html` — browser front door.
- non-HTML `GET /` — machine-readable JSON root.
- `GET /app.css` — source-controlled presentation rules.
- `GET /app.js` — source-controlled renderer.
- `GET /v1/platform/read-model` — deterministic platform read model.
- `GET /project2025/title-vii` — detailed first scenario inspection.

## Workspace sections

1. **Overview** — runtime truth, capability state, scenario spotlight, and peer-platform ownership map.
2. **Scenarios** — declared scenario library.
3. **Lenses** — independent deterministic lens registry; no composite score.
4. **Sources** — complete-corpus custody and identity rules.
5. **Receipts** — Project 2025, Civic Genome handoff, and Supabase substrate receipts.
6. **System** — database, persistence-preflight, projection, upstream-mutation, and runtime boundaries.

## Read-model inputs

`src/platform-frontend-shell.mjs` derives its state from governed source-controlled artifacts:

- `source_manifests/source_pack_2026_08_03_v3.json`;
- `fixtures/project2025-title-vii-read-model.v1.json`;
- `fixtures/project2025-title-vii-receipt.v1.json`;
- `fixtures/project2025-title-vii-vertical-slice.v1.mjs`;
- `fixtures/eeoc_demographics_reporting_rollback_2026.complete.v1.mjs`;
- `receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json`;
- `docs/receipts/CIVIC_GENOME_KALEIDOSCOPE_AUTHENTICATED_HANDOFF_HB2487_2026-08-04.json`;
- the four source-controlled Project 2025 lens manifests;
- `src/persistence-plan.mjs`.

Before serving the workspace, the adapter verifies the source manifest, Project 2025 read-model/receipt continuity, Legislative Consequence Stage 1/2 shape, governed Supabase receipt, deterministic persistence preflight, and authenticated Civic Genome handoff boundary. Any mismatch fails closed.

## Legislative Consequence boundary

The current EEOC specimen is represented exactly as implemented:

- 12 structural deltas;
- 6 typed consequence edges;
- 6 Docket/Rosetta/Civic Genome bindings;
- 1 preserved lifecycle conflict;
- Rosetta transition recorded as `user_initiated_rosetta_run`;
- Stage 3 impact surface: `null`;
- Stage 4 Atlas historical comparison: `null`;
- Stage 5 Lighthouse accountability view: `null`;
- Stage 6 checklist: `null`;
- projection executed: `false`;
- database persisted: `false`.

The prior Rosetta `not_run` state remains valid chronology and is not treated as a decomposition error.

## Governed Supabase substrate

The canonical receipt `receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json` records:

- Supabase project `iwmytuwofniybsmidtki`;
- schema `kaleidoscope`;
- 16 truth-bearing tables;
- 3 governed functions;
- 17 non-internal append-only triggers;
- RLS enabled on all truth-bearing tables;
- no table privileges for `public`, `anon`, or `authenticated`;
- `service_role` select/insert only;
- update/delete trigger-enforced rejection;
- 2 applied migrations;
- exact total rows: `0`;
- runtime database adapter not proven.

The schema being present does not mean canonical persistence is enabled.

## Deterministic persistence preflight

PR #14 added a deterministic no-write mapping boundary through `src/persistence-plan.mjs`. The platform workspace now surfaces that preflight directly.

The preflight:

- maps against all 16 substrate tables;
- has `adapter_state = deterministic_dry_run_mapping_only`;
- preserves 5 explicit blockers;
- produces a deterministic `persistence_plan_hash`;
- sets `live_write_authorized = false`;
- sets `database_write_count = 0`;
- sets `credentials_required = false`;
- sets `sql_emitted = false`;
- sets `upstream_mutation = false`.

The preflight is evidence that persistence mapping can be reasoned about deterministically. It is not a write adapter and does not authorize canonical persistence.

## Platform ownership boundary

The UI reflects the constitutional architecture rather than flattening peer platforms into Kaleidoscope:

- Docket Room owns official legislation identity/status/retrieval.
- Rosetta owns deterministic legal decomposition.
- Civic Genome owns persistent policy identity, traits, events, lineage, and immutable snapshots.
- Prism owns verification receipts and contradiction findings.
- Atlas owns governed observations and historical context.
- Esquire owns person-controlled procedural state when explicitly authorized.
- Kaleidoscope owns scenarios, declared transformations, lenses, collisions, assumptions, unresolved effects, and replay receipts.

Kaleidoscope does not press upstream buttons, repair upstream records, or silently promote missing upstream state.

## Truthful staging state

The workspace must continue to show:

- foundation version `0.1.4`;
- deterministic runtime;
- 41 active source artifacts;
- one executable Project 2025 test scenario;
- four Project 2025 lenses;
- three preserved Project 2025 collisions;
- Legislative Consequence Stage 1/2 source-controlled, later stages not executed;
- authenticated Civic Genome delivery validated but binding unresolved/unaccepted;
- 16 database tables / 3 functions / 17 append-only triggers / 2 migrations / 0 rows;
- deterministic persistence preflight available;
- live writes not authorized;
- runtime persistence adapter not bound;
- canonical projection execution disabled;
- no hidden composite score;
- no runtime AI dependency;
- unresolved states preserved.

## Browser security boundary

- self-only Content Security Policy;
- no inline scripts or styles;
- no `innerHTML` or `eval` rendering paths;
- dynamic source values rendered with DOM construction and `textContent`;
- no external fonts, trackers, analytics, or runtime dependencies;
- camera, microphone, geolocation, and payment permissions disabled;
- responsive layout and reduced-motion support.

## Deployment boundary

`main` auto-deploys to the Kaleidoscope Render service. A merge must therefore be followed by an exact deploy and live-route verification before the frontend is claimed live.

This frontend status reconciliation applies no Supabase migration, writes no rows, emits no persistence SQL, and mutates no upstream platform.
