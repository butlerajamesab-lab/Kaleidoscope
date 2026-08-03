# Kaleidoscope Infrastructure State

## GitHub

- repository: `butlerajamesab-lab/Kaleidoscope`
- canonical branch: `main`
- implementation branch: `foundation/kaleidoscope-platform-v1`
- base state before this branch: one initial commit and a one-line README

## Supabase

- project: `iwmytuwofniybsmidtki`
- status retrieved August 3, 2026: `ACTIVE_HEALTHY`
- retrieved tables: `0`
- retrieved migrations: `0`
- current branch state: migration draft only; nothing applied

## Render

- service name: `kaleidoscope`
- service ID: `srv-d9ob6re417fc73euovag`
- URL: `https://kaleidoscope-zm5d.onrender.com`
- type: Node web service
- branch: `main`
- region: Oregon
- auto-deploy: disabled

The initial Render build failed because `main` did not contain `package.json`. That is a truthful scaffold-state failure, not an application regression. The v0.1.2 branch now contains an executable dependency-free runtime, but a successful production deployment is not claimed until the reviewed branch is merged and deliberately deployed.

## Current capability state

Proven:

- source artifacts are content-addressed by byte length and SHA-256;
- byte-identical copies and different-size name collisions are distinguished;
- SF 418 and SF 579 evidence states remain separate;
- canonical JSON and SHA-256 hashing are deterministic;
- typed state diff is implemented and tested.

Not yet proven:

- production lens rule manifests;
- governed projection execution;
- applied database substrate;
- cross-platform bridge authentication;
- replay against persisted run state;
- successful Render deployment;
- public UI.
