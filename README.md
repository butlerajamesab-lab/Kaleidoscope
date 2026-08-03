# Kaleidoscope

**Status:** Foundation and deterministic scaffold v0.1.2. Typed diff and canonical hashing are implemented; governed lens projection, an applied database substrate, and a successful production deployment are not yet claimed.

Kaleidoscope is Luminari's independent deterministic policy-scenario projection platform.

```text
S0 = immutable verified baseline
S1 = immutable declared changed state
ΔS = diff(S0, S1)
Πj = Lj(ΔS), with n ≥ 3 declared lenses
```

It produces governed projections—not predictions, canonical facts, legal conclusions, or hidden policy judgments.

## Current executable boundary

The v0.1.2 scaffold implements:

- deterministic canonical JSON;
- SHA-256 input/output hashing;
- typed `added`, `removed`, `modified`, `preserved`, `superseded`, `preempted`, and `unresolved` state operations;
- `/health`, `/v1/status`, and `/v1/diff` routes;
- explicit capability reporting: projection is not enabled until versioned lens rule manifests exist.

## Platform boundary

Kaleidoscope binds governed outputs from Docket Room, Rosetta, Atlas, Prism, Lighthouse/Civic Genome, and authorized Esquire state by immutable identifiers, hashes, and receipts. It does not overwrite upstream canonical records.

## First bounded demonstration

`gender_identity_title_vii_redefinition.v1` binds:

- `P25-DOL-01`—federal Title VII / EEOC enforcement posture;
- `P25-IA-01`—Iowa state-level parallel mechanism;
- relationship: `produces_similar_effect`;
- causal claim: `not_asserted`;
- initial lenses: civil rights, enforcement pathways, local-government preemption, and affected populations.

The source record now preserves the SF 418 primary-source upgrade while keeping the remaining SF 579 and federal-process gaps unresolved.

## Source custody

The current manifest is `source_manifests/source_pack_2026_08_03.json`. A filename is metadata, not artifact identity. Byte length and SHA-256 determine identity; byte-identical copies, same-name collisions, and superseded artifacts remain separately recorded.

## Infrastructure

- GitHub: `butlerajamesab-lab/Kaleidoscope`
- Supabase: `iwmytuwofniybsmidtki`—currently empty; migration draft only
- Render: `srv-d9ob6re417fc73euovag`—space created, auto-deploy disabled
