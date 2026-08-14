begin;

create table kaleidoscope.scenario_artifact (
  scenario_id uuid not null references kaleidoscope.scenario(scenario_id),
  source_artifact_id uuid not null references kaleidoscope.source_artifact(source_artifact_id),
  support_scope text not null check (support_scope = 'declared_scenario_source'),
  no_component_support_inference boolean not null check (no_component_support_inference),
  no_upstream_ownership_inference boolean not null check (no_upstream_ownership_inference),
  primary key (scenario_id, source_artifact_id)
);

create index scenario_artifact_source_artifact_id_idx on kaleidoscope.scenario_artifact (source_artifact_id);
alter table kaleidoscope.scenario_artifact enable row level security;
revoke all on kaleidoscope.scenario_artifact from public, anon, authenticated;
grant select, insert on kaleidoscope.scenario_artifact to service_role;
create trigger scenario_artifact_append_only before update or delete on kaleidoscope.scenario_artifact
for each row execute function kaleidoscope.deny_mutation();

commit;
