# Kaleidoscope Platform Frontend v1

## Purpose

This is the first platform-level Kaleidoscope workspace. It does not replace the deterministic engine, create new upstream authority, or activate canonical database persistence. It presents the source-controlled system state that already exists and provides a stable front door for scenario inspection.

The design principle is:

> Do not trust a conclusion that cannot be inspected.

## Browser entry points

- `GET /app` — explicit Kaleidoscope workspace.
- `GET /` with `Accept: text/html` — the same workspace for normal browsers.
- `GET /` without an HTML accept header — the existing machine-readable root JSON remains available.
- `GET /app.css` — source-controlled presentation rules.
- `GET /app.js` — source-controlled renderer.
- `GET /v1/platform/read-model` — deterministic platform read model.

The existing Project 2025 inspection surface remains available at `/project2025/title-vii`.

## Workspace sections

The workspace exposes six bounded surfaces:

1. **Overview** — runtime truth, platform metrics, capability state, first scenario, and peer-platform ownership map.
2. **Scenarios** — declared scenario library. The Project 2025 Title VII vertical slice is currently the only source-controlled scenario.
3. **Lenses** — current independent lens registry. Lens results are not averaged into a composite score.
4. **Sources** — active source-manifest count and custody rules. The UI does not claim all 41 sources were read line by line.
5. **Receipts** — deterministic Project 2025 run receipt and authenticated Civic Genome handoff proof.
6. **System** — explicit enabled/disabled boundaries, the current empty projection substrate, and inspectable runtime routes.

## Read-model construction

`src/platform-frontend-shell.mjs` derives its state from existing source-controlled artifacts:

- `source_manifests/source_pack_2026_08_03_v3.json`;
- `fixtures/project2025-title-vii-read-model.v1.json`;
- `fixtures/project2025-title-vii-receipt.v1.json`;
- `fixtures/kaleidoscope-substrate-state-2026-08-09.v1.json`;
- `docs/receipts/CIVIC_GENOME_KALEIDOSCOPE_AUTHENTICATED_HANDOFF_HB2487_2026-08-04.json`.

Before serving the workspace, the adapter verifies:

- source-manifest count and complete-corpus policy;
- Project 2025 read-model hash;
- Project 2025 receipt-to-read-model continuity;
- zero-write and no-mutation declarations for the source-controlled Project 2025 run;
- the current projection-substrate shape: schema `kaleidoscope`, 16 tables, 2 recorded migrations, zero rows, RLS enabled on all 16 tables, and no proven runtime write path;
- completed Civic Genome handoff proof;
- `validated_unbound` delivery state;
- unresolved Civic Genome binding state;
- no Kaleidoscope persistence, projection execution, or upstream mutation in the Civic Genome handoff receipt.

Any mismatch fails closed.

## Current Supabase substrate

The Kaleidoscope Supabase project now contains a dedicated `kaleidoscope` schema. This is materially different from the earlier state where only the empty `public` schema had been inspected.

Current observed substrate:

- Supabase project: `iwmytuwofniybsmidtki`;
- schema: `kaleidoscope`;
- migration `20260809144200_kaleidoscope_projection_substrate` recorded;
- migration `20260809144457_kaleidoscope_projection_substrate_indexes` recorded;
- 16 owned projection-substrate tables;
- all 16 tables have row-level security enabled;
- exact total canonical rows across all 16 tables: `0`;
- `public` contains no Kaleidoscope-owned tables;
- no runtime database write path has been proven or enabled by this frontend.

The correct staging description is therefore:

```text
schema_present_empty_runtime_not_bound
```

This frontend applies no new Supabase migration and writes no database rows.

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
- one source-controlled Project 2025 test scenario;
- four current lenses;
- three preserved collisions;
- 41 active source artifacts;
- zero accepted Civic Genome bindings;
- 16 RLS-enabled Kaleidoscope projection-substrate tables;
- zero canonical rows in those tables;
- two recorded projection-substrate migrations;
- runtime persistence not bound;
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

The repository currently auto-deploys `main` to the Kaleidoscope Render service. A merge of this frontend therefore may trigger a deployment automatically. Deployment must be verified after merge; it must never be described as source-only unless Render confirms no deployment occurred.

This frontend changes presentation and truthful runtime status only. It does not apply, alter, or populate the existing projection substrate.
