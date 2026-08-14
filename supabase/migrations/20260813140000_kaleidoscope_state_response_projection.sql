begin;

create table kaleidoscope.federal_mechanism (
  federal_mechanism_id uuid primary key default gen_random_uuid(),
  mechanism_key text not null unique,
  title text not null,
  policy_family text not null,
  proposal_source jsonb not null,
  proposal_summary text not null,
  observed_status text not null check (observed_status in ('proposed','initiated','partially_operative','operative','enjoined','vacated','rescinded','expired','unknown')),
  path_type text not null check (path_type in ('direct_executive','direct_agency','congressional','judicial','aligned_third_party_litigation','mixed','unknown')),
  match_classification text not null check (match_classification in ('exact_structural_match','partial_structural_match','related_policy_direction','superficial_language_similarity','no_verified_match')),
  required_instruments jsonb not null check (jsonb_typeof(required_instruments) = 'array'),
  affected_systems jsonb not null default '[]',
  affected_populations jsonb not null default '[]',
  unresolved_questions jsonb not null default '[]',
  supersedes_federal_mechanism_id uuid references kaleidoscope.federal_mechanism(federal_mechanism_id),
  created_at timestamptz not null default now()
);

create table kaleidoscope.mechanism_authority (
  mechanism_authority_id uuid primary key default gen_random_uuid(),
  federal_mechanism_id uuid not null references kaleidoscope.federal_mechanism(federal_mechanism_id),
  authority_type text not null check (authority_type in ('constitutional','statutory','inherent','delegated','prosecutorial_discretion','regulatory','other')),
  citation text not null,
  claimed_scope text not null,
  verification_state text not null,
  created_at timestamptz not null default now()
);

create table kaleidoscope.implementation_event (
  implementation_event_id uuid primary key default gen_random_uuid(),
  federal_mechanism_id uuid not null references kaleidoscope.federal_mechanism(federal_mechanism_id),
  event_key text not null,
  instrument_type text not null,
  title text not null,
  event_status text not null,
  occurred_at timestamptz,
  operative boolean not null default false,
  procedural_posture text not null,
  verification_state text not null,
  unique (federal_mechanism_id, event_key)
);

create table kaleidoscope.implementation_edge (
  implementation_edge_id uuid primary key default gen_random_uuid(),
  federal_mechanism_id uuid not null references kaleidoscope.federal_mechanism(federal_mechanism_id),
  source_event_id uuid not null references kaleidoscope.implementation_event(implementation_event_id),
  target_event_id uuid not null references kaleidoscope.implementation_event(implementation_event_id),
  relationship_type text not null check (relationship_type in ('directs','implements','enables','triggers','challenges','enjoins','vacates','rescinds','supersedes','continues_under_other_authority','produces_similar_effect','precedes','reacts_to','no_verified_relationship')),
  causal_claim boolean not null default false,
  reasoning text not null,
  verification_state text not null,
  check (relationship_type <> 'produces_similar_effect' or causal_claim = false),
  check (relationship_type <> 'precedes' or causal_claim = false),
  check (relationship_type <> 'no_verified_relationship' or causal_claim = false)
);

create table kaleidoscope.state_baseline (
  state_baseline_id uuid primary key default gen_random_uuid(),
  jurisdiction_id text not null,
  as_of_date date not null,
  baseline jsonb not null,
  completeness text not null check (completeness in ('unknown','partial','substantial','complete')),
  missing_primary_sources jsonb not null default '[]',
  fiscal_capacity text not null check (fiscal_capacity in ('unknown','low','medium','high')),
  supersedes_state_baseline_id uuid references kaleidoscope.state_baseline(state_baseline_id),
  created_at timestamptz not null default now(),
  unique (jurisdiction_id, as_of_date, state_baseline_id)
);

create table kaleidoscope.material_claim (
  material_claim_id uuid primary key default gen_random_uuid(),
  claim_layer text not null check (claim_layer in ('source','interpretation','projection')),
  claim_text text not null,
  verification_state text not null check (verification_state in ('primary_verified','primary_adjacent','secondary_verified','locator_only','unresolved','contradicted','superseded')),
  doctrine_and_reasoning text,
  uncertainty_label text,
  dependencies jsonb not null default '[]',
  created_at timestamptz not null default now(),
  check (claim_layer <> 'interpretation' or doctrine_and_reasoning is not null),
  check (claim_layer <> 'projection' or uncertainty_label is not null)
);

create table kaleidoscope.claim_source (
  material_claim_id uuid not null references kaleidoscope.material_claim(material_claim_id),
  source_artifact_id uuid not null references kaleidoscope.source_artifact(source_artifact_id),
  issuing_body text not null,
  citation text not null,
  url text,
  retrieved_at timestamptz not null,
  valid_from date,
  valid_to date,
  pinpoint text,
  proves text not null,
  does_not_prove text not null,
  primary key (material_claim_id, source_artifact_id)
);

create table kaleidoscope.projection_result (
  projection_result_id uuid primary key default gen_random_uuid(),
  projection_run_id uuid references kaleidoscope.projection_run(projection_run_id),
  federal_mechanism_id uuid not null references kaleidoscope.federal_mechanism(federal_mechanism_id),
  state_baseline_id uuid not null references kaleidoscope.state_baseline(state_baseline_id),
  generated_at timestamptz not null default now(),
  as_of_date date not null,
  current_status jsonb not null,
  state_baseline_summary text not null,
  evidence_summary jsonb not null,
  unresolved_questions jsonb not null default '[]',
  disclaimer text not null check (disclaimer = 'Research and civic-analysis output; not legal advice.'),
  result_hash text not null check (result_hash ~ '^[0-9a-f]{64}$'),
  supersedes_projection_result_id uuid references kaleidoscope.projection_result(projection_result_id)
);

create table kaleidoscope.response_pathway (
  response_pathway_id uuid primary key default gen_random_uuid(),
  projection_result_id uuid not null references kaleidoscope.projection_result(projection_result_id),
  pathway_key text not null,
  outcome_class text not null check (outcome_class in ('prevent','enjoin','delay','preserve','insulate','backfill','mitigate','route_around','lawfully_decline_participation','monitor_and_prepare','no_viable_state_block_identified','unknown')),
  state_actor text not null check (state_actor in ('governor','attorney_general','legislature','state_agency','state_court','local_government','public_university','state_contractor','interstate_compact','tribal_government','other')),
  action text not null,
  target text not null,
  authority_basis jsonb not null,
  procedural_requirements jsonb not null default '[]',
  dependencies jsonb not null default '[]',
  expected_effect jsonb not null,
  feasibility jsonb not null,
  risk jsonb not null,
  confidence text not null check (confidence in ('low','medium','high')),
  verification_state text not null,
  explanation text not null,
  contrary_authority jsonb not null default '[]',
  unresolved_questions jsonb not null default '[]',
  unique (projection_result_id, pathway_key)
);

create table kaleidoscope.constraint_determination (
  constraint_determination_id uuid primary key default gen_random_uuid(),
  response_pathway_id uuid not null references kaleidoscope.response_pathway(response_pathway_id),
  constraint_type text not null,
  authority jsonb not null,
  effect text not null check (effect in ('permits','limits','delays','forecloses','uncertain')),
  reasoning text not null,
  confidence text not null check (confidence in ('low','medium','high')),
  unresolved_questions jsonb not null default '[]'
);

create table kaleidoscope.response_window (
  response_window_id uuid primary key default gen_random_uuid(),
  response_pathway_id uuid not null references kaleidoscope.response_pathway(response_pathway_id),
  phase text not null check (phase in ('pre_issuance','post_issuance_pre_effective','rulemaking','pre_enforcement','active_enforcement','litigation','post_judgment','continuing')),
  opens_on date,
  closes_on date,
  trigger_events jsonb not null default '[]',
  check (closes_on is null or opens_on is null or closes_on >= opens_on)
);

create table kaleidoscope.pathway_score (
  response_pathway_id uuid primary key references kaleidoscope.response_pathway(response_pathway_id),
  legal_viability smallint not null check (legal_viability between 0 and 5),
  expected_effect smallint not null check (expected_effect between 0 and 5),
  durability smallint not null check (durability between 0 and 5),
  population_coverage smallint not null check (population_coverage between 0 and 5),
  institutional_feasibility smallint not null check (institutional_feasibility between 0 and 5),
  temporal_urgency smallint not null check (temporal_urgency between 0 and 5),
  evidentiary_confidence smallint not null check (evidentiary_confidence between 0 and 5),
  preemption_risk smallint not null check (preemption_risk between 0 and 5),
  adverse_precedent_risk smallint not null check (adverse_precedent_risk between 0 and 5),
  fiscal_burden smallint not null check (fiscal_burden between 0 and 5),
  priority_score smallint generated always as (legal_viability + expected_effect + durability + population_coverage + institutional_feasibility + temporal_urgency + evidentiary_confidence - preemption_risk - adverse_precedent_risk - fiscal_burden) stored,
  ranking_rule_version text not null default 'kaleidoscope_priority.v1'
);

create table kaleidoscope.no_go_path (
  no_go_path_id uuid primary key default gen_random_uuid(),
  projection_result_id uuid not null references kaleidoscope.projection_result(projection_result_id),
  proposed_action text not null,
  reason_foreclosed text not null,
  authority jsonb not null
);

create table kaleidoscope.watch_event (
  watch_event_id uuid primary key default gen_random_uuid(),
  projection_result_id uuid not null references kaleidoscope.projection_result(projection_result_id),
  event text not null,
  consequence text not null,
  expected_on date
);

create table kaleidoscope.affected_population_coverage (
  affected_population_coverage_id uuid primary key default gen_random_uuid(),
  projection_result_id uuid not null references kaleidoscope.projection_result(projection_result_id),
  population text not null,
  coverage text not null,
  gap text,
  verification_state text not null
);

create table kaleidoscope.correction_record (
  correction_record_id uuid primary key default gen_random_uuid(),
  original_claim text not null,
  classification text not null check (classification in ('confirmed','confirmed_with_narrowing','incomplete','contradicted','outdated')),
  corrected_statement text not null,
  basis jsonb not null,
  corrected_at timestamptz not null default now(),
  prior_correction_record_id uuid references kaleidoscope.correction_record(correction_record_id)
);

create index mechanism_authority_mechanism_idx on kaleidoscope.mechanism_authority(federal_mechanism_id);
create index implementation_event_mechanism_idx on kaleidoscope.implementation_event(federal_mechanism_id, occurred_at);
create index implementation_edge_mechanism_idx on kaleidoscope.implementation_edge(federal_mechanism_id);
create index state_baseline_jurisdiction_date_idx on kaleidoscope.state_baseline(jurisdiction_id, as_of_date desc);
create index response_pathway_result_idx on kaleidoscope.response_pathway(projection_result_id);
create index constraint_pathway_idx on kaleidoscope.constraint_determination(response_pathway_id);
create index watch_event_result_idx on kaleidoscope.watch_event(projection_result_id);

do $governance$
declare table_name text;
begin
  foreach table_name in array array['federal_mechanism','mechanism_authority','implementation_event','implementation_edge','state_baseline','material_claim','claim_source','projection_result','response_pathway','constraint_determination','response_window','pathway_score','no_go_path','watch_event','affected_population_coverage','correction_record'] loop
    execute format('alter table kaleidoscope.%I enable row level security', table_name);
    execute format('revoke all on kaleidoscope.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert on kaleidoscope.%I to service_role', table_name);
    execute format('create trigger %I before update or delete on kaleidoscope.%I for each row execute function kaleidoscope.deny_mutation()', table_name || '_append_only', table_name);
  end loop;
end
$governance$;

commit;
