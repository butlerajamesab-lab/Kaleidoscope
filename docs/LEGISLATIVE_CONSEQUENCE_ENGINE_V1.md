# Legislative Consequence Engine v1

## Placement

The Legislative Consequence Engine is a governed Kaleidoscope workflow, not a new platform.

- Docket Room owns official legislation retrieval, source identity, status, last action, and source-change receipts.
- Rosetta owns structural legal decomposition.
- Civic Genome owns persistent legislation identity, traits, events, lineage, momentum, unresolved state, and immutable baseline snapshots.
- Atlas owns governed observations and historical comparison inputs.
- Kaleidoscope owns declared state deltas, typed consequence edges, independent lenses, collisions, and projection receipts.
- Lighthouse presents the result and its chain of custody.

Official documents remain evidence. Legislation does not bypass Docket Room and Civic Genome when those platforms already contain a canonical source identity or persistent legislation record.

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

## Legislation source bindings

The `legislation-source-platform-binding.v1` contract binds the external source bundle to the canonical legislation platforms without collapsing ownership.

For Colorado HB1207, the current live bindings are:

- Docket Room source bill `2115794`, last action `Governor Signed`, source-change hash `a24ab7657fe6bed492118ab0f0885f0e`;
- Civic Genome bill `ea189395-af71-4d61-907a-508220d6d410`;
- Civic Genome event `a8b3889c-9bb0-4c02-8d88-242bebe0eba8`;
- Civic Genome family `09098633-f2fb-418f-8354-c3b1a9991dac`.

The live source records currently disagree:

- Docket Room: `Governor Signed`;
- Civic Genome bill: `introduced`;
- Civic Genome event: `enacted`;
- Civic Genome family: `enacted_state_count = 0`.

That conflict is preserved as `unresolved_preserved`. Kaleidoscope is prohibited from choosing, averaging, or overwriting those source states.

HB1207 also has no Rosetta source binding, completed assembly, or structural traits. Kaleidoscope may use its Docket identity and enacted-source evidence as a declared state-law input, but it may not represent the Civic Genome record as a completed Rosetta structural baseline.

The federal EEOC NPRM remains an official regulatory source in this specimen because no Docket Room or Civic Genome identity for it has been established.

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

The validator enforces allowed relationship and causal-state combinations.

## First bounded specimen

`eeoc_demographics_reporting_rollback_2026.complete.v1` compares the July 31, 2026 point-in-time 29 CFR Part 1602 baseline with the EEOC's July 21, 2026 proposed rule, RIN 3046-AB37.

The specimen also binds Colorado HB26-1207 as an enacted state-law fragmentation input through the Docket Room and Civic Genome source contracts above.

The fixture currently instantiates:

- 12 structural deltas;
- 6 consequence edges;
- 4 Docket/Civic Genome platform bindings;
- 1 preserved cross-record lifecycle conflict;
- preserved general recordkeeping and charge-specific investigatory invariants;
- an explicit unresolved PWFA-reference state;
- a hypothesis-only downstream enforcement-capacity edge with causation not asserted.

Stages 3 through 6 remain `null`. No projection has executed and nothing is persisted.

## Source custody

The repository binds the exact official URLs and point-in-time identifiers. The dedicated CI job fetches the source bytes, calculates byte lengths and SHA-256 identities, and uploads the complete source-custody package as a workflow artifact.

Until those hashes are reconciled into the source bundle, the fixture truthfully reports external byte custody as pending.
