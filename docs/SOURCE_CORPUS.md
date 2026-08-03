# Kaleidoscope Source Corpus Policy

## Canonical rule

Every document in the uploaded Kaleidoscope source sequence is active source material for the current build. No document is excluded merely because it is incomplete, duplicated, superseded, contradictory, or not ready for users.

## Identity

A filename is metadata. Artifact identity is determined by:

1. exact byte length;
2. SHA-256 digest.

Similar filenames do not establish identity. Different bytes establish different artifacts. Same filename and same bytes establish a reupload observation, not a new substantive source.

## Preservation

- Exact duplicates remain listed and grouped.
- Revisions remain independent entries.
- Supersession changes substantive preference but never erases history.
- Contradictions and corrections remain source-visible.
- Staging artifacts are not deleted merely for failing user-facing completion rules.
- Deletion requires an independent reason such as corruption, exposed secrets, unlawful content, or an explicitly approved cleanup decision.

## Current corpus

The v3 manifest contains 41 active source entries. Its newest unique artifacts are:

- `P25-PREEMPT-FAMILY-01_dossier.md`;
- `P25-DOL-01_state_inventory_chunk2-1.md`;
- `P25-IA-01_mechanism_dossier-4.md`.

The reuploaded `P25-IA-01_mechanism_dossier-3.md` matched the already cataloged artifact by both byte length and SHA-256 and remains one substantive artifact with a reupload observation.
