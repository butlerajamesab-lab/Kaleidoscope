# Local LGBTQ-Ordinance Preemption Vertical Slice v1

## Purpose

This is Kaleidoscope's second bounded policy-family stress test.

It is intentionally different from the first Title VII/Iowa slice. Instead of comparing one federal mechanism to one state analogue, it tests whether the same deterministic kernel can preserve **cross-jurisdiction and temporal heterogeneity** inside a source-defined mechanism family.

It remains a source-controlled test fixture, not a canonical legal conclusion or prediction.

## Source boundary

The slice uses exactly two governed source artifacts from the 41-entry source manifest:

| Artifact | SHA-256 | Bytes | Role |
|---|---|---:|---|
| `P25-PREEMPT-FAMILY-01_dossier.md` | `0c84ce7e744cc0fc5a2d3cc82f13d5424dd137e82d6943c4ebeffe294f1890bd` | 6484 | cross-cutting preemption mechanism family |
| `P25-IA-01_mechanism_dossier-4.md` | `2157da884d15ceb174ba950b92f2499d110ff9c909e772e5737ae6f5a662e46c` | 12185 | current Iowa state-parallel mechanism dossier |

The byte lengths and hashes match the source manifest.

No web update, current-litigation inference, or unrecorded external fact is silently added to this fixture.

## Policy family

```text
local_lgbtq_ordinance_preemption.v1
```

The family dossier defines the pattern as state law restricting cities/counties from enacting nondiscrimination protections broader than state law, specifically as applied to sexual orientation/gender identity.

The source itself requires an important causal boundary:

```text
relationship_type = produces_similar_effect
causal_claim_state = not_asserted
```

The mechanism predates Project 2025 and appears through different timelines and legislative vehicles. Family membership is not treated as evidence of centralized coordination.

## Jurisdictions represented

### Tennessee

- source-described operative preemption since 2011;
- quoted statutory operative clause in the family dossier;
- represented at `primary_verified` ceiling;
- full statutory context beyond the quoted clause remains an open source-pack item.

### Arkansas

- source-described operative preemption since 2015;
- quoted statutory operative clause in the family dossier;
- represented at `primary_verified` ceiling;
- full statutory context beyond the quoted clause remains an open source-pack item.

### North Carolina

- historical HB2-era member;
- source says the preemption provision expired in 2020 and local authority returned;
- represented at `secondary_verified` ceiling;
- current engine implementation-state vocabulary has no `historical_expired` value, so the mechanism-level enum is explicitly left `unresolved` while the component itself truthfully records `historical_preemption_expired`.

This is a deliberate stress-test finding rather than a silent taxonomy substitution.

### Texas

- source describes a broad 2023 preemption law not originally LGBTQ-specific in design;
- source reports a November 2025 lawsuit seeking to apply the law to Dallas ordinances including the LGBTQ anti-bias ordinance;
- the broad instrument and the specific LGBTQ application are modeled separately;
- the specific litigation outcome remains `unresolved` because the source pack does not establish the result.

### Iowa

- source describes SF 579's 2026 preemption of broader local nondiscrimination categories;
- source gives the preemption language, March 10, 2026 signature date, procedural-bill amendment history, and corrected locality count of 13 cities plus unincorporated Johnson County;
- represented at `secondary_verified_high_confidence` ceiling because the complete enrolled bill has not been independently reviewed line by line in the current source pack.

## Temporal reference

The baseline is a declared reference state:

```text
local_preemption_family_reference_2020_12_31.v1
```

The changed state is the source-observed current pass:

```text
local_preemption_family_source_observed_2026.v1
```

The comparison yields six typed operations:

- Tennessee — preserved;
- Arkansas — preserved;
- North Carolina — preserved as historical/expired state;
- Texas broad preemption instrument — modified from the pre-2023 reference state;
- Texas LGBTQ-ordinance application — unresolved;
- Iowa local nondiscrimination authority — preempted.

The reference does not claim that all five jurisdictions shared one legal baseline. Each component carries its own jurisdiction and temporal description.

## Lenses

Four independent lenses execute over the same typed diff:

1. `preemption_operability.v1`
2. `preemption_temporal_history.v1`
3. `preemption_jurisdictional_variation.v1`
4. existing `affected_populations.v1`

The fourth lens is intentionally reused from the first vertical slice to test whether a pre-existing lens can operate across a new policy family without hidden scenario-specific branching.

## Preserved collisions

### Active versus expired family members

```text
same_family_different_current_operability
```

The family contains operative restrictions in some jurisdictions and a historical expired member in North Carolina. Kaleidoscope preserves that variation instead of averaging it into a family-level score.

### Texas instrument versus application outcome

```text
operative_general_instrument_specific_application_unresolved
```

The source pack identifies the broad instrument while the specific reported LGBTQ-ordinance application remains unresolved. Existence of the instrument does not silently become a claim that the challenged ordinance has already been invalidated.

## Explicit non-claims

This slice does not:

- claim centralized coordination among the represented states or Project 2025;
- infer the current outcome of Texas litigation beyond the source pack;
- treat an expired North Carolina mechanism as currently operative;
- infer additional member states not established by the dossier;
- compute population magnitude or discrimination rates;
- mutate upstream platforms;
- write to Kaleidoscope Supabase;
- convert the source-controlled fixture into canonical projection truth.

## Engine pressure revealed

The slice exposes one real vocabulary limitation in the existing bounded engine:

```text
implementation_state lacks historical_expired
```

Rather than changing that enum inside the same slice, v1 preserves the source fact in the component model and marks the mechanism-level representation unresolved. A later kernel vocabulary change can be considered independently, with regression proof against the existing Title VII fixture.
