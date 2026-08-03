# Kaleidoscope Foundation v0.1.2

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

## Source and evidence discipline

The platform preserves strict separation among:

```text
source observation
legal interpretation
projected consequence
current implementation status
claim about motive or coordination
```

Verification states currently governed are:

- `primary_verified`
- `secondary_verified`
- `secondary_pending`
- `primary_source_not_obtained`
- `quoted_in_verified_secondary`
- `unresolved`
- `mixed` for a governed aggregate whose component states are preserved individually

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

Applied definitions:

- A **dead end** includes an effect reported without sources, assumptions, unresolved conditions, or a challenge/replay path.
- **Verified** means grounded in a source the system can identify, trace, and stand behind at output time. It does not mean remembered or assumed.
- A **gap** is a real absence, contradiction, or unverified area; it remains explicit data.
- A **contradiction** is a traceable misalignment between governing or declared expectation and observed or declared state.
- A Kaleidoscope **verified foothold** is an inspectable projection bundle, challenge record, replay receipt, or explicit logged gap—not a vague recommendation.

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

## First bounded demonstration

Policy family:

```text
gender_identity_title_vii_redefinition.v1
```

Bound mechanisms:

- `P25-DOL-01`: Title VII statutory baseline, *Bostock*, EO 14168, *Texas v. EEOC*, EEOC guidance-rescission chain, and open federal-process questions.
- `P25-IA-01`: Iowa's removal of gender-identity protection and later preemption of broader local nondiscrimination categories.

Relationship:

```json
{
  "relationship_type": "produces_similar_effect",
  "causal_claim_state": "not_asserted"
}
```

The enriched Iowa source establishes SF 418 at `primary_verified`; SF 579's outcome/history remains `secondary_verified`, while enrolled text, signature date, and effective date remain `primary_source_not_obtained`.

Initial candidate lenses:

1. `civil_rights.v1`
2. `enforcement_pathways.v1`
3. `local_government_preemption.v1`
4. `affected_populations.v1`

The demonstration must prove immutable source binding, typed diff, minimum-lens enforcement, unresolved preservation, collision preservation, deterministic replay, and no unsupported causal claim. It must not predeclare a policy result.

## Acceptance gates

Kaleidoscope is not operational until source, schema, kernel, determinism, provenance, boundary, unresolved-state, bridge, presentation, challenge/replay, rollback, and security proofs pass.

Current v0.1.2 proves only source custody, canonicalization, hashing, and typed diff behavior. Production lens execution, applied Supabase state, bridge proof, successful Render deployment, and UI remain unproven.
