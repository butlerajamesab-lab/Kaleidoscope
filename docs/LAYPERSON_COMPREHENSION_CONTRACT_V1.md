# Kaleidoscope Layperson Comprehension Contract v1

## Purpose

Kaleidoscope must be understandable without prior knowledge of government, law, policy, Luminari, or the platform's internal architecture.

The public surface follows this order:

```text
What is happening?
→ What changed?
→ Why does it matter?
→ Who or what may be affected?
→ What does the evidence support?
→ What is still unknown?
→ Show the evidence
→ Show the technical proof
```

Technical vocabulary remains available for inspection, but it is not the price of admission.

## Public-first / technical-second rule

A public-facing concept must be explained in ordinary language before its internal or specialist term is required.

Examples:

| Internal or specialist term | Public-first presentation |
|---|---|
| vertical slice | a bounded end-to-end example of a civic change |
| lens | one separate way of examining the same change |
| collision | two supported findings that pull in different directions and are both preserved |
| structural delta | what changed between the before and after state |
| preemption | a state rule that limits what local governments are allowed to regulate or protect |
| unresolved | the available source material does not support a final answer yet |
| deterministic receipt | technical replay proof tying a result to its exact inputs, rules, versions, hashes, and write boundary |
| canonical persistence | saving an analysis as an official governed Kaleidoscope record |

Acronyms are expanded the first time they matter to comprehension. For example:

```text
EEOC = U.S. Equal Employment Opportunity Commission
```

The public surface may then use the acronym after the expansion.

## Scenario rule

A scenario card must lead with:

1. a plain-language subject;
2. a short explanation of what changed;
3. why the distinction matters;
4. visible open questions or uncertainty;
5. evidence/detail actions only when those routes actually exist.

Scenario IDs, policy-family IDs, engine state, hashes, and internal titles belong under **Technical details**.

A missing detail route must be represented as unavailable. It must never be converted into a placeholder, empty, or fabricated link.

## Lens rule

The public heading describes the question being asked, for example:

- What legal protections remain or change?
- What ways to enforce the right remain?
- What can local governments still do?
- Who is structurally affected?
- Is the restriction in force now?
- How has the rule changed over time?
- How does it differ from state to state?

The internal lens ID remains inspectable under Technical details.

## Evidence rule

Evidence is described before manifest mechanics.

The user should understand that:

- source files are preserved;
- conflicting and inconvenient sources are not silently discarded;
- revisions and duplicates remain visible;
- exact technical identity is used to distinguish files.

Manifest IDs, byte lengths, and SHA-256 hashes remain available for technical inspection.

## Proof rule

The public surface calls the section **Proof & history**.

It explains the purpose of deterministic receipts before exposing receipt IDs and hashes: important results must be tied to the exact state that produced them so they can be challenged and replayed.

## Status rule

Raw machine states are translated before display.

Examples:

- `executed_test_fixture` → Tested example
- `validated_unbound` → Validated — not accepted as official input
- `applied_empty_unbound` → Storage ready — runtime not connected
- `runtime_not_bound` → Not connected
- `available_no_write` → Check available — no live writes

Machine state remains visible under Technical details.

## Truth boundary

Plain language must not weaken epistemic discipline.

Kaleidoscope still preserves these distinctions:

```text
source observation
legal interpretation
projected consequence
current implementation status
claim about motive or coordination
```

Simplification may change wording. It may not change evidentiary strength, causal state, ownership, unresolved state, or the distinction between a tested example and canonical fact.

## Acceptance requirements

The public workspace must fail its acceptance gate if:

- a technical-only term becomes a primary navigation requirement without explanation;
- an acronym necessary for comprehension is used without expansion;
- a missing detail route becomes a fake link;
- a tested example is relabeled as a canonical fact or prediction;
- an unresolved condition is silently removed;
- a source-system ownership boundary is hidden;
- a composite score is introduced over independent findings;
- technical proof is removed rather than placed behind a secondary inspection layer.
