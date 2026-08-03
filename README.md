# Kaleidoscope

**Status:** Staging foundation and deterministic scaffold v0.1.4. Typed diff, canonical hashing, complete source custody, a live staging runtime, and an explicit Civic Genome snapshot-binding contract are implemented. No live Civic Genome snapshot has been accepted, and governed lens projection remains disabled.

Kaleidoscope is Luminari's independent deterministic policy-scenario projection platform.

```text
S0 = immutable verified baseline
S1 = immutable declared changed state
ΔS = diff(S0, S1)
Πj = Lj(ΔS), with n ≥ 3 declared lenses
```

It produces governed projections—not predictions, canonical facts, legal conclusions, or hidden policy judgments.

## Current executable boundary

The v0.1.4 staging scaffold implements:

- deterministic canonical JSON;
- SHA-256 input/output hashing;
- typed `added`, `removed`, `modified`, `preserved`, `superseded`, `preempted`, and `unresolved` state operations;
- truthful `/`, `/health`, `/v1/status`, and `/v1/diff` routes;
- a versioned Civic Genome snapshot-binding contract that fails unresolved until an immutable source snapshot and declared verification mapping exist;
- explicit capability reporting: projection remains disabled until versioned lens rule manifests exist.

## Civic Genome binding

`contracts/civic-genome-snapshot-binding.v1.json` defines the consumer boundary for a future immutable Lighthouse/Civic Genome baseline export.

The contract requires:

- exact Civic Genome snapshot and export-receipt identities;
- source snapshot and receipt hashes;
- exact scope and as-of time;
- a manifest of namespaced source components;
- source-native verification states preserved without translation;
- a declared verification-mapping rule before acceptance;
- explicit unresolved or rejected binding outcomes;
- `no_mutation = true`.

`fixtures/civic_genome_snapshot_binding.v1.json` is deliberately unresolved. It does not claim a live source snapshot, accepted component mapping, or operational bridge.

The mutable Lighthouse table `civic_genome_projection_checkpoint` is an internal Docket-materialization continuation cursor. It is not a valid Kaleidoscope baseline snapshot.

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

Atlas observation bundles and Civic Genome snapshots are separate upstream inputs. An Atlas observation does not need to be rewritten as Civic Genome truth before Kaleidoscope may reference it, but each input retains its own owner, receipts, verification state, and non-causal boundary.

## Bounded demonstrations

1. `gender_identity_title_vii_redefinition.v1`
2. `local_lgbtq_ordinance_preemption.v1`

Both fixtures are source-bound definitions only. Neither contains fabricated projection results.

## Infrastructure

- GitHub: `butlerajamesab-lab/Kaleidoscope`
- Supabase: `iwmytuwofniybsmidtki`—currently empty; migration draft only
- Render: `srv-d9ob6re417fc73euovag`—live v0.1.3 staging scaffold, auto-deploy disabled; v0.1.4 is not deployed from this contract branch
