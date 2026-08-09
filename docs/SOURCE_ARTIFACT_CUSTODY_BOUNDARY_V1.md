# Source Artifact Custody Boundary v1

## Problem

The initial Kaleidoscope persistence substrate contains `kaleidoscope.source_binding`, whose contract is explicitly an upstream canonical-object reference:

```text
upstream_platform
upstream_object_type
upstream_object_id
upstream_version
upstream_hash
verification_state
```

The Project 2025 source-pack manifest does not declare those upstream object identities for its uploaded artifacts. It declares file-level custody facts such as filename metadata, exact byte length, SHA-256, source role, and source-use state.

Treating a custody artifact as a Docket Room, Rosetta, Atlas, Prism, Civic Genome, or Esquire object merely because its content relates to one of those domains would manufacture ownership.

## Governing distinction

Kaleidoscope therefore preserves two different provenance concepts:

### Upstream canonical binding

Use `kaleidoscope.source_binding` only when a canonical upstream object identity is actually declared and can be verified.

Examples of the required shape include an actual Docket bill identity, Rosetta extraction run, Prism receipt, Atlas governed bundle, Civic Genome checkpoint, or authorized Esquire state object.

### Direct source-artifact custody

Use the source-artifact custody contract when Kaleidoscope has an exact artifact identity but no declared canonical upstream object identity.

A custody record proves:

- which source manifest listed the artifact;
- filename metadata;
- byte length;
- SHA-256 identity;
- source role;
- source-use state;
- a deterministic custody hash.

It explicitly states:

```text
content_owner_state = not_asserted
upstream_binding_state = not_declared
upstream_platform = null
upstream_object_type = null
upstream_object_id = null
no_upstream_ownership_inference = true
```

This means Kaleidoscope owns the custody record, not the underlying content and not an invented upstream identity.

## Substrate extension

The source-controlled migration draft adds three tables:

1. `kaleidoscope.source_artifact`
2. `kaleidoscope.state_snapshot_artifact`
3. `kaleidoscope.state_component_artifact`

The tables mirror the provenance role currently served by upstream `source_binding` links while keeping direct artifact custody semantically separate.

The extension:

- uses the existing append-only `kaleidoscope.deny_mutation()` trigger;
- enables RLS on all three tables;
- grants no access to `public`, `anon`, or `authenticated`;
- grants `service_role` only `select` and `insert`;
- includes reverse foreign-key indexes;
- has a bounded rollback that removes only the three extension tables.

## Current source-pack state

The current 41-entry Kaleidoscope source manifest is classified as direct custody only for this contract because the manifest itself does not carry verified upstream object IDs.

That classification does **not** claim that none of the source material originated from official agencies, legislation, or peer-platform workflows. It states only that the artifact record currently available to this persistence boundary is a file-custody identity rather than a verified canonical peer-platform object binding.

Where a separate governed contract already proves an upstream identity—such as the Docket/Rosetta/Civic Genome bindings in the EEOC Legislative Consequence specimen—that upstream object remains eligible for `source_binding` under its own contract. The file-custody artifact and the upstream canonical object are not silently collapsed into one identity.

## Persistence effect

This boundary resolves the semantic ambiguity behind the persistence-preflight blocker:

```text
source_binding_upstream_ownership_mapping_not_declared
```

It does not, by itself, authorize persistence. The live database remains unchanged until the migration is deliberately applied and verified.

After a live substrate extension is proven, the persistence planner can map direct source-pack provenance through `source_artifact` links while retaining `source_binding` exclusively for verified upstream objects.

Remaining independent blockers—projection claim authorization, collision link semantics, projection event semantics, and runtime database transport—must remain separate.

## No mutation in this source-only stage

The contract, deterministic custody builder, migration draft, rollback, and tests perform:

- no Supabase mutation;
- no Render deployment;
- no source binding creation;
- no upstream mutation;
- no canonical projection or persistence.
