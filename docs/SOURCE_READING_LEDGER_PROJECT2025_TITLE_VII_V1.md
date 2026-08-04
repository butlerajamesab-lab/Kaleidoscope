# Source Reading Ledger — Project 2025 Title VII Vertical Slice v1

## Scope

This ledger records the source-reading state for the bounded Title VII vertical slice only. It is not a claim that all 41 active Kaleidoscope source artifacts have been read line by line.

Reading state is independent from byte-identity custody and from the source's own verification state.

## States

- `read_complete_for_vertical_slice` — the complete artifact was inspected for this bounded slice.
- `relevant_sections_inspected` — the sections used by this slice were inspected; no claim of complete semantic review.
- `identity_verified_only` — filename, byte length, and SHA-256 are known, but substantive reading is not claimed.
- `not_used_in_this_slice` — active corpus artifact preserved but not used here.

## Ledger

| Source artifact | Reading state | Use in slice | Preserved limitation |
|---|---|---|---|
| `project2025_catalog_pass1.md` | `read_complete_for_vertical_slice` | Project 2025 chapter-level proposal context and source/interpretation/projection doctrine | Surface sweep; not a completed chapter-by-chapter decomposition |
| `project2025_mechanism_dossiers_batch1.md` | `read_complete_for_vertical_slice` | P25-DOL-01 mechanism model and implementation-route distinction | Several mechanism claims retain open primary-source items |
| `P25-DOL-01_source_ledger_chunk1.md` | `read_complete_for_vertical_slice` | Primary-source ceiling, what-source-proves / does-not-prove discipline | January 2026 EEOC meeting record and appellate status remain open |
| `P25-DOL-01_state_inventory_chunk1.md` | `relevant_sections_inspected` | Independent statutory and *Bostock* baseline support | Not used as a completed 50-state inventory |
| `P25-DOL-01_state_inventory_chunk2-1.md` | `read_complete_for_vertical_slice` | Corrected state-category and unresolved-inventory context | Individual-state coverage remains incomplete and corrected across revisions |
| `P25-IA-01_mechanism_dossier-4.md` | `read_complete_for_vertical_slice` | SF 418 primary verification; SF 579 route, clause, and locality correction | Complete enrolled SF 579 text remains unreviewed line by line |
| `P25-PREEMPT-FAMILY-01_dossier.md` | `read_complete_for_vertical_slice` | Local-preemption family and anti-coordination discipline | Family coverage and current Texas litigation remain incomplete |
| `constitutional_powers_reference_pass1.md` | `relevant_sections_inspected` | Authority, checks, and separation of source from interpretation and current-status claims | Not treated as a complete constitutional-law reference for this slice |

## Source hierarchy behavior

The engine preserves the verification state attached to each component source binding. A component may not claim a verification state stronger than its weakest supporting source.

Examples in this fixture:

- independently retrieved statutory or judicial support may remain `primary_verified`;
- a fact pattern with an uncollected official instrument remains at its declared secondary or missing-primary-source ceiling;
- a mixed support set remains `mixed` in presentation while the weakest source controls `evidence_ceiling`;
- a relationship based on similar effect remains non-causal.

## Corpus boundary

All other entries in `kaleidoscope_source_pack_2026_08_03_v3` remain active source artifacts. They are neither discarded nor silently represented as read. Their reading state for this vertical slice is `not_used_in_this_slice` unless separately recorded.
