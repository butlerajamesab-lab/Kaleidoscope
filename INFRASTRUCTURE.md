# Kaleidoscope Infrastructure State

## GitHub

- repository: `butlerajamesab-lab/Kaleidoscope`
- canonical branch: `main`
- current staging release: `0.1.3`
- source manifest: `kaleidoscope_source_pack_2026_08_03_v3`

## Supabase

- project: `iwmytuwofniybsmidtki`
- status retrieved August 3, 2026: `ACTIVE_HEALTHY`
- retrieved tables: `0`
- retrieved migrations: `0`
- current state: reviewed migration draft only; nothing applied

## Render

- service name: `kaleidoscope`
- service ID: `srv-d9ob6re417fc73euovag`
- URL: `https://kaleidoscope-zm5d.onrender.com`
- type: Node web service
- branch: `main`
- region: Oregon
- auto-deploy: disabled
- current state: live staging scaffold

## Current capability state

Proven:

- 41 source artifacts are content-addressed by byte length and SHA-256;
- all uploaded source documents are active corpus members rather than a selected subset;
- byte-identical copies and different-size name collisions are distinguished;
- superseded sources remain preserved;
- SF 418 and SF 579 evidence states remain component-specific;
- the local-ordinance-preemption family is represented as its own source-bound mechanism family;
- canonical JSON and SHA-256 hashing are deterministic;
- typed state diff is implemented and tested;
- the staging runtime is live.

Not yet proven:

- production lens rule manifests;
- governed projection execution;
- applied database substrate;
- cross-platform bridge authentication;
- replay against persisted run state;
- public user UI.

Staging incompleteness is permitted. It is documented, not deleted or disguised.
