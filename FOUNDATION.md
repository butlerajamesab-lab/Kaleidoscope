# Kaleidoscope Foundation v0.1.4

## Canonical position

Kaleidoscope is one of Luminari's six first-class peer platforms:

1. Lighthouse, containing Civic Genome
2. Atlas
3. Rosetta
4. Prism
5. Kaleidoscope
6. Esquire

Kaleidoscope is independent. Projection logic is not owned by Lighthouse, Civic Genome, Atlas, Rosetta, Prism, or Esquire.

## Purpose

Kaleidoscope answers:

> Given a verified baseline state, a declared changed state, declared rules, and declared lenses, how does the observable civic state transform under the scenario?

It evaluates declared transformations. It does not predict the future.

## Mathematical contract

```text
S0 = immutable verified baseline
S1 = immutable declared changed or proposed state
ΔS = diff(S0, S1)
Πj = Lj(ΔS, A, E, C)
|L| ≥ 3
```

Where:

- `A` is the explicit assumption manifest;
- `E` is the explicit excluded-factor manifest;
- `C` is the versioned lens configuration.

Simple subtraction is valid only when subtraction is formally defined for the state representation. Otherwise `diff` produces source-bound typed operations:

- `added`
- `removed`
- `modified`
- `preserved`
- `superseded`
- `preempted`
- `unresolved`

For complete input state `X`, rule manifest `R`, configuration `C`, and engine version `v`:

```text
Y = F_v(X, R, C)
```

Identical complete inputs must produce canonically equivalent outputs, hashes, unresolved states, contradictions, and replay receipts.

## Ownership boundaries

Kaleidoscope owns:

- scenario definitions;
- immutable baseline and change-set bindings;
- transformation-space computation;
- lens manifests and execution;
- projection bundles;
- cross-lens collisions;
- assumptions and excluded factors;
- unresolved and contradictory effects;
- deterministic hashes;
- challenge and replay receipts.

Kaleidoscope consumes, but does not own:

| Source | Canonical owner | Binding |
|---|---|---|
| Official legislation and policy instruments | Docket Room / authoritative source | immutable source ID, version, hash |
| Legal decomposition | Rosetta | admissible extraction run, manifest, source spans, output hash |
| Observations and reference context | Atlas | governed bundle, entity-resolution receipt, source hash |
| Verification and contradiction findings | Prism | verification receipt and cited evidence IDs |
| Identity, traits, lineage, events, momentum | Lighthouse / Civic Genome | immutable checkpoint ID and hash |
| Person-controlled procedural state | Esquire | explicit authorized read-only binding |

Kaleidoscope must not rewrite Docket truth, perform Rosetta decomposition, manufacture Atlas observations, create Prism findings, take Civic Genome identity ownership, alter Esquire action state, mutate upstream fields, hide assumptions, or promote projections as canonical facts.

## Civic Genome baseline contract

Kaleidoscope pins the source schema:

```text
https://luminari.org/civic-genome/contracts/external-snapshot.v1.schema.json
```

and the source contract:

```text
civic_genome.external_snapshot.v1@1.0.0
```

The consumer recomputes and verifies:

- every source component hash;
- the complete source snapshot hash;
- the deterministic replay key;
- the export-receipt hash;
- the source snapshot, receipt, component, and canonical-record identities represented by the binding manifest.

The consumer rejects:

- a changed component retaining its original hashes;
- a rehashed component beneath a stale enclosing snapshot hash;
- a binding whose source snapshot or receipt identity differs from the validated source;
- incomplete source state presented as accepted;
- accepted verification without a declared mapping rule;
- any binding that permits upstream mutation.

An authenticated Civic Genome snapshot delivery has been validated by Kaleidoscope, but the delivery remained non-persistent and unresolved. The contract therefore remains `defined_unbound` until an immutable source snapshot is accepted under a declared verification mapping and governed persistence contract. Authenticated validation is not the same as an accepted source binding.

## Complete source-corpus rule

Every document in the uploaded Kaleidoscope source sequence is active source material for the current build. The platform does not select a smaller preferred subset merely because some artifacts are drafts, revisions, duplicates, contradictions, or staging material.

Artifact identity is determined by exact byte length and SHA-256. Filename similarity is not identity.

Preservation rules:

- exact duplicates remain listed and grouped;
- same-name different-byte artifacts remain separate;
- reuploads with the same name and same bytes are recorded as reupload observations;
- supersession changes substantive preference but never deletes history;
- corrections and contradictions remain visible;
- staging incompleteness is documented rather than erased;
- deletion requires an independent reason, not merely failure to meet a future user-facing completion rule.

The v3 manifest contains 41 active entries. Its newest unique additions are:

- `P25-PREEMPT-FAMILY-01_dossier.md`;
- `P25-DOL-01_state_inventory_chunk2-1.md`;
- `P25-IA-01_mechanism_dossier-4.md`.

## Source and evidence discipline

The platform preserves strict separation among:

```text
source observation
legal interpretation
projected consequence
current implementation status
claim about motive or coordination
```

Verification states currently governed include:

- `primary_verified`
- `secondary_verified`
- `secondary_verified_high_confidence`
- `secondary_pending`
- `primary_source_not_obtained`
- `quoted_in_verified_secondary`
- `unresolved`
- `mixed` for an aggregate whose component states remain individually preserved

A projection component may not carry a stronger state than its supporting source set. Alignment, temporal sequence, shared language, and similar effect do not become causation without source-bound evidence.

## Shared founding governance

Kaleidoscope is independently owned but remains bound by Luminari's founding constitution.

- **Truth law:** never present assumptions, missing sources, unbuilt capability, or smooth narrative as verified truth.
- **Determinism law:** same input, snapshot, rules, configuration, and engine version produce the same output.
- **Governance law:** every scenario, lens, rule manifest, projection, and route is registered, reviewable, and auditable.
- **Traceability law:** every meaningful operation is attributable, hashable, replayable, and explainable.
- **Immutability law:** source bindings, snapshots, rules, runs, and receipts are append-only in practice; corrections supersede rather than erase.
- **Exportability law:** important analysis must be renderable as an evidence-backed packet.
- **Structural honesty law:** output shows governing expectation, state change, contradiction or gap, projected effect, and response pathway.
- **UI truth law:** a surface may not imply a live projection, verified source, completed bridge, or supported capability that the runtime does not possess.
- **Completion law:** existence is not completion. A path is complete only when truthful, governed, replayable, and able to reach an inspectable result or honest logged gap.

These rules govern staging and eventual user-facing operation. Incomplete routes and experimental artifacts may remain only when they are labeled and do not masquerade as completed capability.

Hard prohibitions include false promise, fake capability, fake data, hidden uncertainty, logic outside governance, destructive erasure, multiple hidden truths, premature interpretation, unverifiable escalation, ornamental UI claims, orphaned analysis, and abandonment after a path begins without marking where it ends.

## Layperson comprehension contract

Citizen-facing comprehension is a governed acceptance boundary, not optional copy polish.

The public surface follows:

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

Technical vocabulary remains available but secondary. Public-facing pages explain ordinary meaning before requiring terms such as vertical slice, lens, collision, structural delta, preemption, deterministic receipt, impact surface, or canonical persistence. Acronyms required for comprehension are expanded when first introduced.

Plain-language translation may simplify wording; it may not strengthen evidentiary state, causal state, ownership, implementation status, or a tested example into canonical fact.

The full contract is `docs/LAYPERSON_COMPREHENSION_CONTRACT_V1.md`.

## Mechanism model

A mechanism is a governed implementation structure:

```text
M = (P, A, B, I, C, E, J, R, T, U)
```

- `P` — proposal or declared change
- `A` — claimed authority
- `B` — legal/administrative baseline
- `I` — required implementation instrument
- `C` — ordered implementation chain
- `E` — observed implementation evidence
- `J` — jurisdictional variation
- `R` — response pathways
- `T` — timing and dependencies
- `U` — unresolved questions and source gaps

Implementation state must distinguish proposed, pending, partially implemented, operative, contested, not implemented as proposed, and unresolved. A vocabulary gap must remain explicit rather than forcing a historical state into an inaccurate current-state label.

## Lens contract

A lens is a pure, declared, versioned deterministic transformation over `ΔS`. Every lens manifest includes a stable ID, semantic version, purpose, accepted component types, rule-manifest ID/hash, configuration, source requirements, unresolved behavior, output contract, collision dimensions, non-goals, and a no-mutation declaration.

Lens outputs are not averaged into one score. Kaleidoscope preserves collisions such as:

- right preserved formally / enforcement pathway reduced practically;
- statewide rule / local authority preempted;
- eligibility preserved / access impaired;
- fiscal reduction / administrative burden increase;
- short-term expansion / long-term backlog.

## Bounded demonstration 1: Title VII and Iowa

Policy family:

```text
gender_identity_title_vii_redefinition.v1
```

Bound mechanisms:

- `P25-DOL-01`: Title VII statutory baseline, *Bostock*, EO 14168, *Texas v. EEOC*, EEOC guidance-rescission chain, and open federal-process questions.
- `P25-IA-01`: Iowa's removal of gender-identity protection and later preemption of broader local nondiscrimination categories.

The current Iowa source state is component-specific:

- SF 418 enacted text and legislative history: `primary_verified`;
- SF 579 outcome and legislative history: `secondary_verified`;
- SF 579 exact clause and March 10, 2026 signing date: `secondary_verified_high_confidence`;
- complete enrolled SF 579 text reviewed line by line: `primary_source_not_obtained`;
- affected-locality count of 13 cities plus unincorporated Johnson County: `secondary_verified`.

Relationship:

```json
{
  "relationship_type": "produces_similar_effect",
  "causal_claim_state": "not_asserted"
}
```

The source-controlled Project 2025 Title VII vertical slice executes this bounded scenario through four declared lenses, preserves three cross-lens collisions, emits deterministic read-model and replay identities, and remains labeled `executed_test_fixture_not_canonical_fact`. Its citizen detail surface is `/project2025/title-vii`. Execution does not make the fixture a canonical fact or production projection.

## Bounded demonstration 2: Local nondiscrimination preemption

Policy family:

```text
local_lgbtq_ordinance_preemption.v1
```

The source-defined family presently includes:

- Tennessee: represented operative mechanism beginning in 2011;
- Arkansas: represented operative mechanism beginning in 2015;
- North Carolina: historical mechanism active during the HB2 period and expired in 2020; mechanism-level implementation vocabulary remains explicitly unresolved rather than inventing a `historical_expired` enum;
- Texas: broad 2023 preemption statute with later LGBTQ-ordinance application represented as contested/unresolved in the source pack;
- Iowa: operative 2026 local-preemption mechanism with open primary-source items.

The mechanism predates Project 2025 and appears through different legislative vehicles. Similar effect does not establish centralized coordination.

The source-controlled vertical slice executes the family through four declared lenses, preserves two cross-lens collisions, emits deterministic replay identities, and remains labeled `executed_test_fixture_not_canonical_fact`. Its citizen detail surface is `/state-local-protections`.

## Legislative Consequence bounded specimen

The EEOC workforce-demographics reporting rollback specimen now establishes executable Legislative Consequence Stages 1–3 while preserving the original Stage 1/2 fixture unchanged.

### Stage 1: Structural Delta

Stage 1 contains 12 deterministic structural deltas governed by the typed structural vocabulary:

- `added`
- `removed`
- `modified`
- `preserved`
- `superseded`
- `preempted`
- `unresolved`

### Stage 2: Consequence Graph

Stage 2 contains 6 typed consequence edges with explicit causal states and prohibits numeric weighting. Direct legal effects and downstream hypotheses remain distinct. The hypothesis-only downstream enforcement-capacity edge remains `hypothesis_only` with causation not asserted.

The specimen binds Colorado HB1207 through Docket Room source bill `2115794`, Rosetta extraction run `26`, and Civic Genome bill/assembly/event/family records without taking ownership of those records. It preserves the observed lifecycle conflict instead of resolving it: Docket reports `Governor Signed`, the Civic Genome bill reports `introduced`, the Civic Genome event reports `enacted`, and the Civic Genome family enacted count remains `0`. Prism remains `not_observed` for the specimen.

### Stage 3: Impact Surface

Stage 3 is a separate deterministic composition over the verified Stage 1/2 artifact. The original Stage 1/2 fixture retains `impact_surface = null` and its receipt is not rewritten.

Stage 3 has a versioned declarative classification manifest. Every Stage 2 edge must be explicitly included with one or more declared impact classes or explicitly deferred. The engine does not infer impact class from an edge name or prose.

Stage 3 may classify only:

- `legal`
- `operational`
- `economic`
- `administrative`

It may not create a new causal edge, strengthen causal state or evidence ceiling, infer an actor not declared by Stage 1, or assign a numeric weight, score, probability, or risk score.

The first Stage 3 specimen contains:

- 5 included impact items;
- 14 touched actor identifiers derived only from Stage 1 `actor_ids`;
- 3 legal impact classifications;
- 2 operational impact classifications;
- 1 administrative impact classification;
- 0 economic impact classifications because none is declared;
- 1 historical analogue deferred to Stage 4 rather than treated as an executed Atlas comparison;
- no mutation;
- 0 database writes.

For every included item, Stage 3 copies the Stage 2 relationship type, causal state, evidence ceiling, source bindings, explanation, and unresolved conditions. A rehashed attempt to strengthen a copied causal state is rejected by deterministic validation.

Read-only technical endpoints expose the exact Stage 3 artifact and receipt:

- `/v1/legislative-consequence/eeoc/impact-surface`;
- `/v1/legislative-consequence/eeoc/impact-surface/receipt`.

### Stages 4–6

Stage 4 Atlas historical comparison remains unexecuted. The Stage 2 historical analogue is preserved as a deferred Stage 3 reference, not as proof Atlas ran.

Stage 5 Lighthouse accountability presentation remains unexecuted.

Stage 6 instantiated checklist remains unexecuted.

Stages 1–3 do not enable or claim completed production projection.

## Platform workspace

The Kaleidoscope workspace is source-controlled as a citizen-first, read-only inspection surface.

It provides:

- `/app` as the explicit browser workspace;
- `/` as the workspace for normal `Accept: text/html` requests while preserving the JSON root for machine/API requests;
- `/v1/platform/read-model` as the deterministic platform-level read model;
- public navigation organized as Overview, What changes, Ways to examine it, Evidence, Proof & history, and System details;
- both current bounded scenarios as citizen-readable detail surfaces;
- Legislative Consequence Stage 3 presented publicly as “who or what is directly touched by the legal change,” with the technical Impact Surface term kept secondary;
- explicit peer-platform ownership topology;
- database state, source custody, receipts, unresolved conditions, and capability boundaries without write controls.

The platform read model fails closed if the 41-entry source corpus, bounded scenario identities/hashes, database substrate receipt, Civic Genome handoff proof, Legislative Consequence Stage 1/2 specimen, or Stage 3 composition no longer matches its declared source-controlled state.

The browser surface uses a self-only content security policy, no external runtime libraries or fonts, no inline script/style, no `innerHTML` or `eval`, and disables camera, microphone, geolocation, and payment permissions.

The workspace being present does not imply that it has been deployed and independently verified on Render.

## Persistence substrate

On 2026-08-09 the source-controlled append-only projection substrate was applied to the Kaleidoscope Supabase project `iwmytuwofniybsmidtki`.

The live substrate contains:

- schema `kaleidoscope`;
- canonical persistence state `schema_present_empty_runtime_not_bound`;
- 16 truth-bearing tables;
- 3 governed functions;
- 17 non-internal triggers;
- RLS enabled on every truth-bearing table;
- no table privileges for `public`, `anon`, or `authenticated`;
- `service_role` limited to `select` and `insert`;
- update/delete rejection through append-only triggers;
- covering indexes for all foreign-key paths reported by the Supabase performance advisor.

Live migration history:

- `20260809144200` — `kaleidoscope_projection_substrate`;
- `20260809144457` — `kaleidoscope_projection_substrate_indexes`.

All 16 Kaleidoscope tables contained zero rows at the post-migration receipt boundary and were rechecked as empty during the source/runtime convergence. No source binding, scenario, projection run, lens result, collision, or replay receipt has been persisted by this staging work. The live receipt is `receipts/kaleidoscope_supabase_projection_substrate_2026_08_09.v1.json`.

The deterministic persistence preflight maps both bounded scenarios against all 16 substrate tables while authorizing zero live writes. It preserves blockers including undeclared source ownership mapping, lack of authorization to persist tested-example claims as canonical state, undeclared collision/event persistence semantics, and an unbound runtime database transport.

The substrate being present does not prove the runtime persistence adapter. Transactional persistence, replay from persisted state, and zero-upstream-mutation behavior remain separate required proofs.

## Acceptance gates

Kaleidoscope is not operational until source, schema, kernel, determinism, provenance, boundary, unresolved-state, bridge, presentation, challenge/replay, rollback, and security proofs pass.

Current v0.1.4 source control proves complete source custody, canonicalization, hashing, typed diff behavior, Civic Genome source-contract validation and tamper rejection, authenticated non-persistent Civic Genome delivery validation, two executable bounded civic-change fixtures with citizen-readable detail surfaces, Legislative Consequence Stages 1–3 with deterministic receipts and Stage 4 deferral, deterministic no-write persistence preflight, and the citizen-first Kaleidoscope platform workspace. The append-only Supabase projection substrate and its foreign-key indexes are live and empty.

Still unproven or intentionally unexecuted are: production/canonical projection, Legislative Consequence Stages 4–6, a governed runtime persistence adapter, an accepted Civic Genome binding, persisted replay from the Kaleidoscope substrate, full peer-platform bridge proofs, and an independently verified current Render deployment.
