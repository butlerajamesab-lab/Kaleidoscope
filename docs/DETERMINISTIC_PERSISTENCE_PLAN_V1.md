# Deterministic Persistence Plan v1

## Purpose

This boundary answers one question before Kaleidoscope is allowed to acquire database credentials or write a projection record:

> Given a deterministic source-controlled execution, which parts of the result are structurally mappable to the append-only Kaleidoscope substrate, and which persistence contracts are still unresolved?

The planner is deliberately **not** a database adapter. It emits no SQL, requests no credentials, performs no writes, and cannot authorize canonical persistence.

## Input boundary

The first executable proof uses the existing Project 2025 Title VII bounded fixture, its four governed lens manifests, and the 41-entry source manifest.

The planner first executes the existing deterministic vertical-slice engine. It then binds every fixture source artifact back to its byte-length/SHA-256 identity in the governed source manifest before producing a persistence plan.

If a named source artifact is absent from the source manifest, planning fails closed.

## Why source binding remains unresolved

The live substrate contains `kaleidoscope.source_binding` with these ownership fields:

- `upstream_platform`
- `upstream_object_type`
- `upstream_object_id`
- `upstream_version`
- `upstream_hash`
- `verification_state`

The source-controlled Project 2025 fixture identifies uploaded source-pack artifacts by filename and manifest hash. It does **not** declare that those artifacts are canonical objects owned by Docket Room, Rosetta, Atlas, Prism, Civic Genome, Esquire, or another governed upstream owner.

The planner therefore refuses to invent peer-platform identities. Every candidate source artifact is preserved with:

```text
mapping_state = unresolved
unresolved_condition = upstream_platform_object_type_and_object_id_mapping_not_declared
```

This blocks the source-binding junctions from being represented as ready for persistence.

## Table-plan result

All 16 tables in the live `kaleidoscope` schema are represented exactly once.

Structurally mappable but unpersisted:

- `state_snapshot`
- `state_component`
- `change_set`
- `change_operation`
- `lens_manifest`
- `scenario`
- `scenario_lens`

Blocked by unresolved dependency or authorization:

- `source_binding`
- `state_snapshot_source`
- `state_component_source`
- `projection_run`
- `lens_result`
- `cross_lens_collision`
- `collision_lens_result`
- `replay_receipt`
- `projection_run_event`

The planner specifically preserves two schema/engine contract gaps rather than silently inventing them:

1. collision effects do not yet have a declared deterministic mapping to `collision_lens_result` foreign keys;
2. projection-run event emission semantics are not yet declared.

## Canonical-persistence gate

The current Project 2025 execution is labeled:

```text
projection_claim_state = not_prediction_not_canonical_fact
```

That claim state is not authorized for canonical persistence. The planner therefore adds:

```text
projection_claim_state_not_authorized_for_canonical_persistence
```

as an explicit blocker.

A source-controlled deterministic test may prove mapping behavior without becoming canonical data.

## Runtime transport boundary

The live Supabase schema exists, but no runtime database transport has been established or proven. The planner records:

```text
runtime_database_transport_not_bound
```

and keeps:

```text
live_write_authorized = false
database_write_count = 0
credentials_required = false
sql_emitted = false
upstream_mutation = false
```

## Determinism

The complete plan is hashed. Identical fixture, lenses, source manifest, engine versions, and planner version must yield the same `persistence_plan_hash`.

Changing only a source-manifest SHA-256 changes the persistence-plan hash even when the projection bundle itself remains unchanged. This keeps source custody inside the persistence preflight boundary.

## Next gate

The next persistence step is **not** “connect the service role and start inserting.” It is to close the declared contract gaps:

1. define which governed ownership namespace source-pack artifacts use, or replace them with immutable upstream platform bindings;
2. define deterministic collision-to-lens-result foreign-key mapping;
3. define projection-run event semantics;
4. define the authorization state that permits a projection to cross from test/specimen output into canonical persistence;
5. bind a database transport and prove transaction/replay behavior without upstream mutation.

Only after those contracts are explicit should a credential-bearing runtime adapter be introduced.
