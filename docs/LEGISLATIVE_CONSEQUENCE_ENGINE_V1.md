# Legislative Consequence Engine v1

## Placement

The Legislative Consequence Engine is a governed Kaleidoscope workflow, not a new platform.

- Docket Room owns official legislation retrieval, source identity, status, last action, and source-change receipts.
- Rosetta owns deterministic structural legal decomposition.
- Civic Genome owns persistent legislation identity, traits, events, lineage, momentum, unresolved state, and immutable baseline snapshots.
- Prism owns verification receipts and contradiction findings when a verification mapping exists.
- Atlas owns governed observations and historical-comparison inputs.
- Kaleidoscope owns declared state deltas, typed consequence relationships, impact classification, independent lenses, collisions, assumptions, unresolved projected effects, and replay receipts.
- Lighthouse presents inspectable accountability views when that downstream stage is instantiated.

Official documents remain evidence. Legislation does not bypass Docket Room, Rosetta, Civic Genome, Prism, or Atlas ownership merely because Kaleidoscope has direct access to an official source.

The workflow preserves a six-stage sequence:

1. Structural Delta
2. Consequence Graph
3. Impact Surface
4. Atlas Historical Comparison
5. Lighthouse Accountability View
6. Instantiated Checklist

Each stage has its own contract and may remain uninstantiated. Completion of an earlier stage does not authorize fabrication of a later one.

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

The `legislation-source-platform-binding.v1` contract binds the external source bundle to canonical platform records without collapsing ownership.

For Colorado HB1207, the current source-controlled binding bundle contains six bindings:

1. Docket Room source bill `2115794`, last action `Governor Signed`, source-change hash `a24ab7657fe6bed492118ab0f0885f0e`;
2. Rosetta source document `25` / extraction run `26`, completed;
3. Civic Genome bill `ea189395-af71-4d61-907a-508220d6d410`;
4. Civic Genome assembly run `6c5b1326-3c96-41d3-8950-ddc46cb5ebf5`, completed;
5. Civic Genome event `a8b3889c-9bb0-4c02-8d88-242bebe0eba8`;
6. Civic Genome family `09098633-f2fb-418f-8354-c3b1a9991dac`.

The recorded transition is explicit:

```text
pre-run: identity_bound_rosetta_not_yet_run
trigger: user_initiated_rosetta_run
post-run: rosetta_extracted_civic_genome_assembled
```

The post-run state preserves:

- one Rosetta source binding;
- one completed Civic Genome assembly;
- seven Rosetta-derived Civic Genome traits;
- zero Prism bindings;
- Prism observation state `not_observed`.

The source records still disagree on lifecycle state:

- Docket Room: `Governor Signed`;
- Civic Genome bill: `introduced`;
- Civic Genome event: `enacted`;
- Civic Genome family: `enacted_state_count = 0`.

That conflict remains `unresolved_preserved`. Kaleidoscope is prohibited from choosing, averaging, or overwriting those source states.

The federal EEOC proposed rule remains an official regulatory source in this specimen because no Docket Room or Civic Genome identity for that federal regulatory instrument is established here.

## Stage 2: Consequence Graph

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

The validator enforces allowed relationship/causal-state combinations and preserves every source binding, evidence ceiling, and unresolved condition.

## Stage 3: Impact Surface

Stage 3 answers a narrower question than prediction:

> Which source-declared actors are touched by the Stage 2 graph, and which declared impact classes do those already-governed edges occupy?

The allowed impact classes in v1 are:

- `legal`
- `operational`
- `economic`
- `administrative`

Stage 3 is a deterministic classification and grouping operation. It may not manufacture a new causal edge, strengthen an existing causal state, strengthen an evidence ceiling, infer an affected actor not present in Stage 1, or assign a numeric weight/score/probability.

### Declarative classification

The engine does not infer impact class from an edge name or from prose. A versioned classification manifest must explicitly classify every Stage 2 edge as either:

- `include` with one or more declared impact classes; or
- `defer` with an explicit reason.

The manifest is hashed into the Stage 3 output and receipt.

### Actor derivation

Touched actors are derived only from the Stage 1 `actor_ids` attached to the structural deltas referenced by a Stage 2 edge. Stage 3 does not create new people, organizations, populations, or institutions by interpretation.

### Evidence and causation

For every included impact item, Stage 3 copies the Stage 2 edge's:

- relationship type;
- causal state;
- evidence ceiling;
- source bindings;
- explanation;
- unresolved conditions.

The copied fields are checked deterministically. A rehashed attempt to promote `hypothesis_only` to `directly_prescribed`, for example, is rejected because the generated impact surface no longer matches its Stage 2 source graph and classification manifest.

### Stage boundary

A Stage 2 `historical_analogue` may be preserved as a deferred reference rather than treated as a current impact. In the first bounded Stage 3 specimen, the Component 2 historical analogue is deferred with:

```text
historical_comparison_reserved_for_stage_4_atlas
```

This does **not** claim that Stage 4 has executed.

Stage 3 explicitly records:

```text
atlas_historical_comparison_executed = false
lighthouse_accountability_executed = false
checklist_instantiated = false
no_mutation = true
database_write_count = 0
```

## First bounded specimen

The Stage 1/2 fixture `eeoc_demographics_reporting_rollback_2026.complete.v1` compares the July 31, 2026 point-in-time 29 CFR Part 1602 baseline with the EEOC's July 21, 2026 proposed rule, RIN 3046-AB37.

It also binds Colorado HB26-1207 as an enacted state-law fragmentation input through the source-platform contracts above.

The Stage 1/2 fixture contains:

- 12 structural deltas;
- 6 consequence edges;
- 6 Docket/Rosetta/Civic Genome platform bindings;
- 1 preserved cross-record lifecycle conflict;
- preserved general recordkeeping and charge-specific investigatory invariants;
- an explicit unresolved PWFA-reference state;
- a hypothesis-only downstream enforcement-capacity edge with causation not asserted.

The original Stage 1/2 fixture intentionally retains:

```text
impact_surface = null
atlas_historical_compare = null
lighthouse_accountability_view = null
instantiated_checklist = null
```

That immutable receipt is not rewritten when a later stage becomes available.

The separate Stage 3 composition fixture is:

```text
legislative_consequence_eeoc_demographics_reporting_rollback_2026.impact_surface.v1
```

It consumes the verified Stage 1/2 fixture plus the versioned classification manifest and produces a separately hashed impact surface and replay receipt.

The first manifest declares:

- 5 included Stage 3 impact items;
- 1 historical reference deferred to Stage 4;
- legal, operational, and administrative impact classes where explicitly declared;
- 0 economic impact items because no economic classification is declared;
- no Atlas comparison;
- no Lighthouse accountability output;
- no checklist;
- no database write.

## Stage 4: Atlas Historical Comparison

Stage 4 remains uninstantiated in this specimen.

Its architectural purpose is historical comparison using governed Atlas observations: prior mechanisms, jurisdictions, variants, downstream outcomes, corrections, repeal, and amendment. Comparison is not prediction.

A Stage 2 historical analogue or Stage 3 deferred historical reference is not equivalent to an executed Stage 4 Atlas comparison.

## Stage 5: Lighthouse Accountability View

Stage 5 remains uninstantiated in this specimen.

Its architectural purpose is inspectable presentation of accountability-relevant changes without allowing Lighthouse to become the owner of Kaleidoscope's transformation logic or upstream source truth.

## Stage 6: Instantiated Checklist

Stage 6 remains uninstantiated in this specimen.

Its architectural purpose is an inspectable review checklist derived from the prior governed stages. The checklist may not invent an answer where the earlier stages preserve uncertainty or contradiction.

## Source custody

The source bundle is currently recorded as:

```text
custody_state = official_sources_bound_raw_bytes_hashed
```

The dedicated source-custody workflow captured exact bytes, byte lengths, and SHA-256 identities for four official sources:

- EEOC proposed rule RIN 3046-AB37;
- point-in-time 29 CFR Part 1602 XML as of July 31, 2026;
- Colorado HB26-1207 signed act;
- EEOC July 21, 2026 agency summary.

The raw source bytes are not embedded in the repository. Their captured identities and workflow custody receipt are preserved in the source bundle.

## Persistence and projection boundary

Stages 1–3 in these bounded specimens are source-controlled deterministic analysis artifacts. They do not, by themselves, authorize canonical persistence or a live policy projection.

Current boundaries remain:

- no Kaleidoscope canonical scenario persisted;
- no canonical projection run persisted;
- no Stage 3 database write;
- no Atlas Stage 4 execution;
- no Lighthouse Stage 5 execution;
- no Stage 6 checklist;
- no upstream platform mutation.
