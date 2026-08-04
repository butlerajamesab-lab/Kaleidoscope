# Legislative Consequence Engine v1

## Placement

The Legislative Consequence Engine is a governed Kaleidoscope workflow, not a new platform.

- Rosetta owns structural legal decomposition.
- Civic Genome owns persistent identity, traits, events, lineage, momentum, and immutable baseline snapshots.
- Atlas owns governed observations and historical comparison inputs.
- Kaleidoscope owns declared state deltas, typed consequence edges, independent lenses, collisions, and projection receipts.
- Lighthouse presents the result and its chain of custody.

## Stage 1: Structural Delta

The Stage 1 contract records only typed changes between an identified baseline and proposed state:

- `added`
- `removed`
- `modified`
- `preserved`
- `superseded`
- `preempted`
- `unresolved`

Every delta preserves exact source identities, legal citations, source locators, actors, obligation type, reporting vector, evidence ceiling, unresolved conditions, and a deterministic SHA-256 hash.

## Stage 2: Consequence Edge

The Stage 2 contract permits only typed relationships:

- `direct_legal_effect`
- `necessary_operational_effect`
- `historical_analogue`
- `jurisdictional_fragmentation`
- `possible_downstream_effect`
- `preserved_invariant`
- `unresolved_relationship`

Numeric edge weights are prohibited in v1. Each edge carries an explicit causal state:

- `directly_prescribed`
- `logically_necessary`
- `historically_observed`
- `supported_inference`
- `hypothesis_only`
- `causation_not_asserted`

The validator enforces allowed relationship/causal-state combinations.

## First bounded specimen

`eeoc_demographics_reporting_rollback_2026.v1` compares the July 31, 2026 point-in-time 29 CFR Part 1602 baseline with the EEOC's July 21, 2026 proposed rule, RIN 3046-AB37.

The specimen also binds Colorado HB26-1207 as an enacted state-law fragmentation input.

The fixture currently instantiates:

- 12 structural deltas;
- 6 consequence edges;
- preserved general recordkeeping and charge-specific investigatory invariants;
- an explicit unresolved PWFA-reference state;
- a hypothesis-only downstream enforcement-capacity edge with causation not asserted.

Stages 3 through 6 remain `null`. No projection has executed and nothing is persisted.

## Source custody

The repository binds the exact official URLs and point-in-time identifiers. The dedicated CI job fetches the source bytes, calculates byte lengths and SHA-256 identities, and uploads the complete source-custody package as a workflow artifact.

Until those hashes are reconciled into the source bundle, the fixture truthfully reports external byte custody as pending.
