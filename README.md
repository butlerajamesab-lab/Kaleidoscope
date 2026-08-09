# Kaleidoscope

**Status:** Staging foundation and deterministic scaffold v0.1.4. Typed diff, canonical hashing, complete source custody, authenticated Civic Genome snapshot validation, the Project 2025 Title VII executable test fixture, and its read-only inspection shell are source-controlled. The append-only Kaleidoscope Supabase projection substrate is now applied and empty. A governed runtime persistence adapter, production projection capability, and a live accepted Civic Genome binding are not yet claimed.

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
- truthful `/`, `/health`, `/v1/status`, and `/v1/diff` routes;
- exact Civic Genome source schema/contract identity validation;
- complete Civic Genome component, snapshot, replay-key, and export-receipt rehashing;
- rejection of modified source content and stale binding identities;
- a bounded executable Project 2025 Title VII vertical slice with four independent lenses and preserved cross-lens collisions;
- a read-only inspection shell over that source-controlled test fixture;
- explicit capability reporting that distinguishes a source-controlled test fixture from canonical or production projection.

The Civic Genome contract remains `defined_unbound`. Validation capability does not imply that Lighthouse has delivered or Kaleidoscope has accepted a live baseline snapshot.

## Persistence boundary

The Kaleidoscope Supabase project now contains the source-controlled append-only projection substrate:

- project ref: `iwmytuwofniybsmidtki`;
- schema: `kaleidoscope`;
- 16 truth-bearing tables;
- 3 governed functions;
- 17 non-internal triggers;
- RLS enabled on all truth-bearing tables;
- no `public`, `anon`, or `authenticated` table privileges;
- `service_role` limited to `select` and `insert` on the substrate;
- update/delete blocked by append-only triggers;
- covering indexes present for the substrate foreign-key paths.

All 16 Kaleidoscope tables contained **0 rows** immediately after application and verification on 2026-08-09. Applying the substrate did not persist a source binding, scenario, projection run, lens result, collision, or replay receipt, and did not enable projection.

The exact live database state is recorded in `receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json`.

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

## Bounded demonstrations

1. `gender_identity_title_vii_redefinition.v1`
2. `local_lgbtq_ordinance_preemption.v1`

The first now has an executable source-controlled deterministic vertical-slice test fixture and read-only inspection surface. It remains labeled `executed_test_fixture_not_canonical_fact` and does not constitute production projection.

The second remains a source-defined mechanism family and is not yet promoted to the same executable vertical-slice boundary.

## Infrastructure

- GitHub: `butlerajamesab-lab/Kaleidoscope`
- Supabase: `iwmytuwofniybsmidtki`—append-only projection substrate applied; all Kaleidoscope tables empty at the 2026-08-09 receipt boundary
- Render: `srv-d9ob6re417fc73euovag`—last source-controlled deployment receipt is v0.1.4; current post-Project-2025 source changes require deliberate runtime verification before being represented as live
