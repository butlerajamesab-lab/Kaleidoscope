# Kaleidoscope

**Status:** Staging foundation and deterministic scaffold v0.1.4. Typed diff, canonical hashing, complete source custody, authenticated Civic Genome snapshot validation, two bounded executable civic-change examples with citizen-first detail surfaces, Legislative Consequence Stages 1–3, deterministic no-write persistence preflight, and the read-only Kaleidoscope platform workspace are source-controlled. The append-only Kaleidoscope Supabase projection substrate is applied and empty. A governed runtime persistence adapter, production projection capability, Legislative Consequence Stages 4–6, and a live accepted Civic Genome binding are not yet claimed.

Kaleidoscope is Luminari's independent deterministic policy-scenario projection platform.

```text
S0 = immutable verified baseline
S1 = immutable declared changed state
ΔS = diff(S0, S1)
Πj = Lj(ΔS), with n ≥ 3 declared lenses
```

It produces governed projections—not predictions, canonical facts, legal conclusions, or hidden policy judgments.

## Current executable boundary

The v0.1.4 source-controlled scaffold implements:

- deterministic canonical JSON;
- SHA-256 input/output hashing;
- typed `added`, `removed`, `modified`, `preserved`, `superseded`, `preempted`, and `unresolved` state operations;
- truthful `/`, `/health`, `/v1/status`, and `/v1/diff` machine routes;
- a citizen-first platform workspace at `/app`, also served at `/` for normal browser HTML requests;
- a deterministic platform read model at `/v1/platform/read-model`;
- exact Civic Genome source schema/contract identity validation;
- complete Civic Genome component, snapshot, replay-key, and export-receipt rehashing;
- rejection of modified source content and stale binding identities;
- an executable workplace-rights example covering Title VII, federal enforcement pathways, Iowa state protection, and local-government authority;
- an executable five-jurisdiction state/local nondiscrimination-preemption example;
- citizen detail surfaces for both current examples;
- a bounded Legislative Consequence Stage 1 Structural Delta with 12 typed deltas;
- a bounded Legislative Consequence Stage 2 Consequence Graph with 6 typed edges and preserved causal/evidence ceilings;
- a bounded Legislative Consequence Stage 3 Impact Surface with 5 declared impact items, 14 source-declared actor identifiers, one historical reference deferred to Stage 4, and no manufactured economic impact where none is declared;
- deterministic no-write persistence preflight for both bounded examples;
- direct read-only technical endpoints for Stage 3 impact-surface and receipt inspection;
- explicit capability reporting that distinguishes tested/source-controlled analysis from canonical or production projection.

The Civic Genome contract remains `defined_unbound`. An authenticated snapshot has been validated without persistence, but no live baseline binding has been accepted.

The Legislative Consequence workflow now has source-controlled executable Stages 1–3. The original Stage 1/2 fixture remains immutable with `impact_surface = null`; Stage 3 is a separate hashed composition artifact. Atlas historical comparison (Stage 4), Lighthouse accountability presentation (Stage 5), and the instantiated checklist (Stage 6) remain unexecuted. No production projection or canonical persistence is implied by the presence of Stages 1–3.

## Citizen comprehension boundary

The public surface follows the contract in `docs/LAYPERSON_COMPREHENSION_CONTRACT_V1.md`.

People encounter ordinary-language questions before internal engineering or legal terms:

```text
What is happening?
→ What changed?
→ Why does it matter?
→ Who or what may be affected?
→ What does the evidence support?
→ What is still unknown?
→ Show the evidence
→ Show the technical proof
```

Technical terms such as vertical slice, lens, collision, impact surface, engine IDs, hashes, and receipts remain inspectable but are not required for basic comprehension. Acronyms necessary to understand a page are expanded when first introduced.

## Persistence boundary

The Kaleidoscope Supabase project contains the source-controlled append-only projection substrate:

- project ref: `iwmytuwofniybsmidtki`;
- schema: `kaleidoscope`;
- canonical persistence state: `schema_present_empty_runtime_not_bound`;
- 16 truth-bearing tables;
- 3 governed functions;
- 17 non-internal triggers;
- RLS enabled on all truth-bearing tables;
- no `public`, `anon`, or `authenticated` table privileges;
- `service_role` limited to `select` and `insert` on the substrate;
- update/delete blocked by append-only triggers;
- covering indexes present for the substrate foreign-key paths.

All 16 Kaleidoscope tables contained **0 rows** immediately after application and verification on 2026-08-09, and the row-empty state was rechecked during the source/runtime convergence work. Applying the substrate did not persist a source binding, scenario, projection run, lens result, collision, or replay receipt, and did not enable projection.

Live migration history:

- `20260809144200` — `kaleidoscope_projection_substrate`;
- `20260809144457` — `kaleidoscope_projection_substrate_indexes`.

The exact live database state is recorded in `receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json`.

The deterministic persistence preflight can map both bounded examples against all 16 substrate tables, but it explicitly authorizes zero live writes. It preserves blockers including undeclared upstream source ownership mapping, lack of authorization to persist tested-example projection claims as canonical state, undeclared collision-link/event semantics, and an unbound runtime database transport.

A governed runtime persistence adapter is still required before engine outputs may be written to this substrate.

## Source corpus

Every document in the uploaded Kaleidoscope source sequence is active source material. The manifest does not select a preferred subset and does not discard drafts, contradictions, revisions, or superseded documents.

- manifest: `source_manifests/source_pack_2026_08_03_v3.json`
- active source entries: **41**
- identity rule: filename is metadata; byte length and SHA-256 determine artifact identity
- preservation rule: exact duplicates, same-name collisions, revisions, and superseded files remain recorded

The current source state includes:

- `P25-IA-01_mechanism_dossier-4.md` as the current Iowa dossier while all earlier versions remain preserved;
- `P25-DOL-01_state_inventory_chunk2-1.md` as the corrected state inventory while the prior chunk remains preserved;
- `P25-PREEMPT-FAMILY-01_dossier.md` as an active cross-cutting mechanism-family source.

## Platform boundary

Kaleidoscope binds governed outputs from Docket Room, Rosetta, Atlas, Prism, Lighthouse/Civic Genome, and authorized Esquire state by immutable identifiers, hashes, and receipts. It does not overwrite upstream canonical records.

The EEOC consequence specimen demonstrates this boundary with Docket Room, Rosetta, and Civic Genome bindings while preserving the unresolved lifecycle disagreement among Docket `Governor Signed`, Civic Genome bill `introduced`, Civic Genome event `enacted`, and Civic Genome family enacted count `0`. Prism remains explicitly `not_observed` for that specimen.

Stage 3 does not weaken those ownership rules. It derives touched actors only from Stage 1 actor IDs and copies Stage 2 relationship type, causal state, evidence ceiling, source bindings, explanation, and unresolved conditions without strengthening them.

## Bounded demonstrations

1. `gender_identity_title_vii_redefinition.v1`
2. `local_lgbtq_ordinance_preemption.v1`

Both now have executable deterministic test fixtures and citizen-first detail surfaces. Both remain labeled `executed_test_fixture_not_canonical_fact` and do not constitute production projection.

The workplace-rights detail surface is `/project2025/title-vii`.

The state/local-authority detail surface is `/state-local-protections`.

A separate bounded EEOC workforce-demographics rollback specimen exercises Legislative Consequence Stages 1–3. It is a structural/consequence/impact-classification specimen, not a completed production projection. Its Stage 3 read-only technical endpoints are:

- `/v1/legislative-consequence/eeoc/impact-surface`;
- `/v1/legislative-consequence/eeoc/impact-surface/receipt`.

## Infrastructure

- GitHub: `butlerajamesab-lab/Kaleidoscope`
- Supabase: `iwmytuwofniybsmidtki`—append-only projection substrate applied; all Kaleidoscope tables empty at the 2026-08-09 receipt boundary
- Render: `srv-d9ob6re417fc73euovag`—current source has advanced beyond the last independently verified deployment receipt; the workspace and current runtime revision require deliberate Render verification before being represented as live
