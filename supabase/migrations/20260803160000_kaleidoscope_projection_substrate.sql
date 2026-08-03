begin;

create extension if not exists pgcrypto;
create schema if not exists kaleidoscope;

revoke all on schema kaleidoscope from public, anon, authenticated;
grant usage on schema kaleidoscope to service_role;

create or replace function kaleidoscope.deny_mutation()
returns trigger
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
begin
  raise exception 'kaleidoscope truth-bearing records are append-only; create a superseding record instead';
end;
$$;

create table kaleidoscope.source_binding (
  source_binding_id uuid primary key default gen_random_uuid(),
  upstream_platform text not null,
  upstream_object_type text not null,
  upstream_object_id text not null,
  upstream_version text,
  upstream_hash text not null check (upstream_hash ~ '^[0-9a-f]{64}$'),
  verification_state text not null,
  bound_at timestamptz not null default now(),
  unique (upstream_platform, upstream_object_type, upstream_object_id, upstream_hash)
);

create table kaleidoscope.state_snapshot (
  state_snapshot_id uuid primary key default gen_random_uuid(),
  external_snapshot_id text not null unique,
  snapshot_kind text not null check (snapshot_kind in ('baseline', 'changed')),
  as_of_date date not null,
  jurisdiction_scope jsonb not null,
  unresolved_conditions jsonb not null default '[]'::jsonb,
  snapshot_hash text not null check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  supersedes_snapshot_id uuid references kaleidoscope.state_snapshot(state_snapshot_id),
  created_at timestamptz not null default now()
);

create table kaleidoscope.state_snapshot_source (
  state_snapshot_id uuid not null references kaleidoscope.state_snapshot(state_snapshot_id),
  source_binding_id uuid not null references kaleidoscope.source_binding(source_binding_id),
  primary key (state_snapshot_id, source_binding_id)
);

create table kaleidoscope.state_component (
  state_component_id uuid primary key default gen_random_uuid(),
  state_snapshot_id uuid not null references kaleidoscope.state_snapshot(state_snapshot_id),
  component_id text not null,
  component_type text not null,
  domain text,
  jurisdiction text,
  temporal_scope text,
  value jsonb not null,
  verification_state text not null,
  declared_transition text check (
    declared_transition is null or declared_transition in ('modified', 'superseded', 'preempted', 'unresolved')
  ),
  unresolved_conditions jsonb not null default '[]'::jsonb,
  component_hash text not null check (component_hash ~ '^[0-9a-f]{64}$'),
  unique (state_snapshot_id, component_id)
);

create table kaleidoscope.state_component_source (
  state_component_id uuid not null references kaleidoscope.state_component(state_component_id),
  source_binding_id uuid not null references kaleidoscope.source_binding(source_binding_id),
  primary key (state_component_id, source_binding_id)
);

create table kaleidoscope.change_set (
  change_set_id uuid primary key default gen_random_uuid(),
  external_change_set_id text not null unique,
  baseline_snapshot_id uuid not null references kaleidoscope.state_snapshot(state_snapshot_id),
  changed_snapshot_id uuid not null references kaleidoscope.state_snapshot(state_snapshot_id),
  assumptions jsonb not null default '[]'::jsonb,
  excluded_factors jsonb not null default '[]'::jsonb,
  unresolved_conditions jsonb not null default '[]'::jsonb,
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  output_hash text not null check (output_hash ~ '^[0-9a-f]{64}$'),
  supersedes_change_set_id uuid references kaleidoscope.change_set(change_set_id),
  created_at timestamptz not null default now(),
  check (baseline_snapshot_id <> changed_snapshot_id)
);

create table kaleidoscope.change_operation (
  change_operation_id uuid primary key default gen_random_uuid(),
  change_set_id uuid not null references kaleidoscope.change_set(change_set_id),
  operation_order integer not null check (operation_order > 0),
  operation text not null check (
    operation in ('added', 'removed', 'modified', 'preserved', 'superseded', 'preempted', 'unresolved')
  ),
  component_id text not null,
  before_state jsonb,
  after_state jsonb,
  operation_hash text not null check (operation_hash ~ '^[0-9a-f]{64}$'),
  unique (change_set_id, operation_order),
  unique (change_set_id, component_id)
);

create table kaleidoscope.lens_manifest (
  lens_manifest_id uuid primary key default gen_random_uuid(),
  lens_id text not null,
  lens_version text not null check (lens_version ~ '^\d+\.\d+\.\d+$'),
  purpose text not null,
  accepted_component_types jsonb not null default '[]'::jsonb,
  rule_manifest_id text not null,
  rule_manifest_hash text not null check (rule_manifest_hash ~ '^[0-9a-f]{64}$'),
  configuration jsonb not null default '{}'::jsonb,
  source_requirements jsonb not null default '[]'::jsonb,
  collision_dimensions jsonb not null default '[]'::jsonb,
  unresolved_behavior text not null check (unresolved_behavior = 'preserve'),
  non_goals jsonb not null default '[]'::jsonb,
  no_mutation boolean not null check (no_mutation),
  manifest_hash text not null check (manifest_hash ~ '^[0-9a-f]{64}$'),
  supersedes_lens_manifest_id uuid references kaleidoscope.lens_manifest(lens_manifest_id),
  created_at timestamptz not null default now(),
  unique (lens_id, lens_version)
);

create table kaleidoscope.scenario (
  scenario_id uuid primary key default gen_random_uuid(),
  external_scenario_id text not null unique,
  baseline_snapshot_id uuid not null references kaleidoscope.state_snapshot(state_snapshot_id),
  change_set_id uuid not null references kaleidoscope.change_set(change_set_id),
  temporal_horizon text,
  assumptions jsonb not null default '[]'::jsonb,
  excluded_factors jsonb not null default '[]'::jsonb,
  unresolved_conditions jsonb not null default '[]'::jsonb,
  configuration jsonb not null default '{}'::jsonb,
  scenario_hash text not null check (scenario_hash ~ '^[0-9a-f]{64}$'),
  supersedes_scenario_id uuid references kaleidoscope.scenario(scenario_id),
  created_at timestamptz not null default now()
);

create table kaleidoscope.scenario_lens (
  scenario_id uuid not null references kaleidoscope.scenario(scenario_id),
  lens_manifest_id uuid not null references kaleidoscope.lens_manifest(lens_manifest_id),
  lens_order integer not null check (lens_order > 0),
  primary key (scenario_id, lens_manifest_id),
  unique (scenario_id, lens_order)
);

create or replace function kaleidoscope.assert_minimum_lenses(p_scenario_id uuid)
returns void
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
declare
  lens_count integer;
begin
  select count(*) into lens_count
  from kaleidoscope.scenario_lens
  where scenario_id = p_scenario_id;

  if lens_count < 3 then
    raise exception 'governed projection requires at least three declared lenses; observed %', lens_count;
  end if;
end;
$$;

create table kaleidoscope.projection_run (
  projection_run_id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references kaleidoscope.scenario(scenario_id),
  engine_version text not null,
  canonicalization_version text not null,
  run_status text not null check (run_status in ('completed', 'failed', 'unresolved')),
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  output_hash text check (output_hash is null or output_hash ~ '^[0-9a-f]{64}$'),
  unresolved_conditions jsonb not null default '[]'::jsonb,
  contradictions jsonb not null default '[]'::jsonb,
  human_review_state text not null check (human_review_state in ('required', 'reviewed', 'accepted', 'rejected')),
  supersedes_projection_run_id uuid references kaleidoscope.projection_run(projection_run_id),
  created_at timestamptz not null default now()
);

create or replace function kaleidoscope.enforce_projection_run_lens_count()
returns trigger
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
begin
  perform kaleidoscope.assert_minimum_lenses(new.scenario_id);
  return new;
end;
$$;

create trigger projection_run_minimum_lenses
before insert on kaleidoscope.projection_run
for each row execute function kaleidoscope.enforce_projection_run_lens_count();

create table kaleidoscope.lens_result (
  lens_result_id uuid primary key default gen_random_uuid(),
  projection_run_id uuid not null references kaleidoscope.projection_run(projection_run_id),
  lens_manifest_id uuid not null references kaleidoscope.lens_manifest(lens_manifest_id),
  result_status text not null check (result_status in ('completed', 'failed', 'unresolved')),
  deltas jsonb not null default '[]'::jsonb,
  unresolved_conditions jsonb not null default '[]'::jsonb,
  output_hash text check (output_hash is null or output_hash ~ '^[0-9a-f]{64}$'),
  unique (projection_run_id, lens_manifest_id)
);

create table kaleidoscope.cross_lens_collision (
  collision_id uuid primary key default gen_random_uuid(),
  projection_run_id uuid not null references kaleidoscope.projection_run(projection_run_id),
  collision_type text not null,
  collision_payload jsonb not null,
  unresolved boolean not null default true,
  collision_hash text not null check (collision_hash ~ '^[0-9a-f]{64}$')
);

create table kaleidoscope.collision_lens_result (
  collision_id uuid not null references kaleidoscope.cross_lens_collision(collision_id),
  lens_result_id uuid not null references kaleidoscope.lens_result(lens_result_id),
  primary key (collision_id, lens_result_id)
);

create table kaleidoscope.replay_receipt (
  replay_receipt_id uuid primary key default gen_random_uuid(),
  projection_run_id uuid not null references kaleidoscope.projection_run(projection_run_id),
  canonicalization_version text not null,
  engine_version text not null,
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  output_hash text not null check (output_hash ~ '^[0-9a-f]{64}$'),
  deterministic_replay_key text not null check (deterministic_replay_key ~ '^[0-9a-f]{64}$'),
  replay_status text not null check (replay_status in ('original', 'identical_replay', 'mismatch', 'unresolved')),
  supersedes_receipt_id uuid references kaleidoscope.replay_receipt(replay_receipt_id),
  created_at timestamptz not null default now()
);

create table kaleidoscope.projection_run_event (
  projection_run_event_id uuid primary key default gen_random_uuid(),
  projection_run_id uuid references kaleidoscope.projection_run(projection_run_id),
  scenario_id uuid not null references kaleidoscope.scenario(scenario_id),
  event_type text not null check (event_type in ('started', 'completed', 'failed', 'unresolved', 'challenged', 'replayed')),
  event_payload jsonb not null default '{}'::jsonb,
  event_hash text not null check (event_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

alter table kaleidoscope.source_binding enable row level security;
alter table kaleidoscope.state_snapshot enable row level security;
alter table kaleidoscope.state_snapshot_source enable row level security;
alter table kaleidoscope.state_component enable row level security;
alter table kaleidoscope.state_component_source enable row level security;
alter table kaleidoscope.change_set enable row level security;
alter table kaleidoscope.change_operation enable row level security;
alter table kaleidoscope.lens_manifest enable row level security;
alter table kaleidoscope.scenario enable row level security;
alter table kaleidoscope.scenario_lens enable row level security;
alter table kaleidoscope.projection_run enable row level security;
alter table kaleidoscope.lens_result enable row level security;
alter table kaleidoscope.cross_lens_collision enable row level security;
alter table kaleidoscope.collision_lens_result enable row level security;
alter table kaleidoscope.replay_receipt enable row level security;
alter table kaleidoscope.projection_run_event enable row level security;

revoke all on all tables in schema kaleidoscope from public, anon, authenticated;
revoke all on all sequences in schema kaleidoscope from public, anon, authenticated;
grant select, insert on all tables in schema kaleidoscope to service_role;
grant usage, select on all sequences in schema kaleidoscope to service_role;

create trigger source_binding_append_only before update or delete on kaleidoscope.source_binding for each row execute function kaleidoscope.deny_mutation();
create trigger state_snapshot_append_only before update or delete on kaleidoscope.state_snapshot for each row execute function kaleidoscope.deny_mutation();
create trigger state_snapshot_source_append_only before update or delete on kaleidoscope.state_snapshot_source for each row execute function kaleidoscope.deny_mutation();
create trigger state_component_append_only before update or delete on kaleidoscope.state_component for each row execute function kaleidoscope.deny_mutation();
create trigger state_component_source_append_only before update or delete on kaleidoscope.state_component_source for each row execute function kaleidoscope.deny_mutation();
create trigger change_set_append_only before update or delete on kaleidoscope.change_set for each row execute function kaleidoscope.deny_mutation();
create trigger change_operation_append_only before update or delete on kaleidoscope.change_operation for each row execute function kaleidoscope.deny_mutation();
create trigger lens_manifest_append_only before update or delete on kaleidoscope.lens_manifest for each row execute function kaleidoscope.deny_mutation();
create trigger scenario_append_only before update or delete on kaleidoscope.scenario for each row execute function kaleidoscope.deny_mutation();
create trigger scenario_lens_append_only before update or delete on kaleidoscope.scenario_lens for each row execute function kaleidoscope.deny_mutation();
create trigger projection_run_append_only before update or delete on kaleidoscope.projection_run for each row execute function kaleidoscope.deny_mutation();
create trigger lens_result_append_only before update or delete on kaleidoscope.lens_result for each row execute function kaleidoscope.deny_mutation();
create trigger collision_append_only before update or delete on kaleidoscope.cross_lens_collision for each row execute function kaleidoscope.deny_mutation();
create trigger collision_lens_append_only before update or delete on kaleidoscope.collision_lens_result for each row execute function kaleidoscope.deny_mutation();
create trigger replay_receipt_append_only before update or delete on kaleidoscope.replay_receipt for each row execute function kaleidoscope.deny_mutation();
create trigger projection_event_append_only before update or delete on kaleidoscope.projection_run_event for each row execute function kaleidoscope.deny_mutation();

commit;
