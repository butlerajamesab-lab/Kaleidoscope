# Project 2025 Title VII Vertical Slice v1

## Purpose

This is the first executable, deterministic Kaleidoscope vertical slice built from the Project 2025 source corpus.

It is a bounded test fixture. It is not a prediction, a canonical legal conclusion, or a claim that every source item has been fully verified.

## Policy family

```text
gender_identity_title_vii_redefinition.v1
```

## Mechanisms

- `P25-DOL-01` — federal Title VII / EEOC guidance and enforcement-posture mechanism.
- `P25-IA-01` — Iowa protected-class removal and state-local preemption mechanism.

The relationship between the Iowa and federal mechanisms is represented as:

```text
relationship_type = produces_similar_effect
causal_claim_state = not_asserted
```

Temporal sequence, similar terminology, and similar practical direction do not establish coordination or causation.

## Upstream boundary

The fixture records the current upstream states explicitly:

```text
Docket Room   not_applicable      required false
Rosetta       not_run             required false
Civic Genome  not_applicable      required false
Prism         not_observed        required false
Atlas         not_run             required false
```

`Rosetta = not_run` is a valid neutral state in this slice. The fixture does not require or trigger Rosetta because its inputs are governed source-pack mechanism records rather than a bill awaiting decomposition.

The engine rejects an upstream state only when the fixture declares that platform required and the required state has not reached `completed` or `available_unbound`.

## State model

The slice defines an immutable baseline and changed state for seven components:

1. federal Title VII/*Bostock* termination protection;
2. EEOC 2024 harassment guidance;
3. EEOC gender-identity enforcement posture;
4. private Title VII litigation path;
5. Iowa gender-identity protected-class coverage;
6. Iowa state-commission enforcement path;
7. Iowa local authority to maintain broader nondiscrimination categories.

The kernel calculates a typed diff using the existing Kaleidoscope operations:

- `preserved`
- `modified`
- `removed`
- `superseded`
- `preempted`
- `unresolved`

## Mechanism model

Each mechanism is represented through the governed structure:

```text
M = (P, A, B, I, C, E, J, R, T, U)
```

The implementation chain distinguishes direct executive or agency action from judicial action, third-party litigation, state legislation, and state-local preemption. Similar outcomes reached through different routes remain different mechanisms.

## Lens execution

Four independent, versioned lens manifests execute over the same typed diff:

- `civil_rights.v1`
- `enforcement_pathways.v1`
- `local_government_preemption.v1`
- `affected_populations.v1`

Each rule declares its accepted operation, dimension, component type, and jurisdiction. Lens results preserve:

- the rule ID and lens version;
- source artifact identities;
- the weakest supporting verification ceiling;
- unresolved conditions;
- a deterministic effect hash;
- a no-mutation declaration.

## Collisions

The slice intentionally preserves three cross-lens collisions rather than averaging them into one score:

1. federal judicial protection preserved / agency-facing path narrowed;
2. federal private action preserved / Iowa state protection removed;
3. Iowa protected-class coverage removed / local substitute authority preempted.

Every collision has the state:

```text
preserved_not_averaged
```

## Deterministic receipt

Current fixture identities:

```text
run_id                   p25-run-a5397b21d22a372ab1f1863ea6a08bf9
input_hash               5f16cd10ff9506ccd789b7f0f1542df2a368fd32d17850fd5de4d2a9c5afbf9a
diff_hash                df38ebb1c70ff0ee76e9ba8876b9722a524911a6210f4f4ba746e45f550f372e
projection_bundle_hash   b017237183329ec4fb534bc84e3433ccfb31a00fd541290dbad4c647c8d3249e
read_model_hash          cc423179b97bccddb6e114843d77d32fea032d781966e7439e8065c5d8070b2a
receipt_hash             a5397b21d22a372ab1f1863ea6a08bf9dd9aebaf33012087a6337feb718b8284
```

Identical fixture, lens manifests, engine version, and rules must reproduce the same complete output and hashes.

## Frontend boundary

`fixtures/project2025-title-vii-read-model.v1.json` is a frontend-ready, read-only model. It contains:

- summary counts;
- mechanism paths;
- four lens panels;
- preserved collisions;
- assumptions and excluded factors;
- unresolved conditions;
- source artifact IDs;
- inspection hashes.

It is deliberately labeled:

```text
executed_test_fixture_not_canonical_fact
```

A frontend may render this model, but it may not relabel the output as a live legal conclusion or remove its evidence ceilings and unresolved states.

## Explicit non-claims

This slice does not:

- claim coordination between Project 2025, federal actors, and Iowa;
- forecast discrimination rates or population outcomes;
- assign a composite political or moral score;
- replace Rosetta decomposition;
- mutate Docket Room, Civic Genome, Rosetta, Prism, Atlas, or Lighthouse;
- write to Kaleidoscope Supabase;
- establish a production lens registry;
- establish a public frontend.
