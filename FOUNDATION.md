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

The contract remains `defined_unbound` until Lighthouse produces a live immutable source snapshot and the required verification mapping is declared. Validation capability is not the same as an accepted source binding.

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

These rules govern eventual user-facing operation. During staging, incomplete routes and experimental artifacts may remain, provided they are labeled and do not masquerade as completed capability.

Hard prohibitions include false promise, fake capability, fake data, hidden uncertainty, logic outside governance, destructive erasure, multiple hidden truths, premature interpretation, unverifiable escalation, ornamental UI claims, orphaned analysis, and abandonment after a path begins without marking where it ends.

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

Implementation state must distinguish proposed, pending, partially implemented, operative, contested, not implemented as proposed, and unresolved.

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

## Bounded demonstration 2: Local nondiscrimination preemption

Policy family:

```text
local_lgbtq_ordinance_preemption.v1
```

The source-defined family presently includes:

- Tennessee: operative mechanism beginning in 2011;
- Arkansas: operative mechanism beginning in 2015;
- North Carolina: historical mechanism active during the HB2 period and expired in 2020;
- Texas: broad 2023 preemption statute with LGBTQ-ordinance litigation observed beginning in 2025;
- Iowa: operative 2026 local-preemption mechanism.

The mechanism predates Project 2025 and appears through different legislative vehicles. Similar effect does not establish centralized coordination.

## Acceptance gates

Kaleidoscope is not operational until source, schema, kernel, determinism, provenance, boundary, unresolved-state, bridge, presentation, challenge/replay, rollback, and security proofs pass.

Current v0.1.4 proves complete source custody, canonicalization, hashing, typed diff behavior, source-contract validation, and tamper rejection. Production lens execution, an applied Supabase state, a live accepted Civic Genome binding, persisted replay, and public user UI remain unproven.
