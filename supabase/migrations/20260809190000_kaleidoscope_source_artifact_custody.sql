begin;

create table kaleidoscope.source_artifact (
  source_artifact_id uuid primary key default gen_random_uuid(),
  external_artifact_id text not null,
  custody_manifest_id text not null,
  source_file_name text not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  byte_length bigint not null check (byte_length >= 0),
  source_role text not null,
  source_use_state text not null,
  custody_scope text not null check (custody_scope = 'artifact_identity_and_provenance_only'),
  content_owner_state text not null check (content_owner_state = 'not_asserted'),
  upstream_binding_state text not null check (upstream_binding_state = 'not_declared'),
  custody_hash text not null check (custody_hash ~ '^[0-9a-f]{64}$'),
  supersedes_source_artifact_id uuid references kaleidoscope.source_artifact(source_artifact_id),
  created_at timestamptz not null default now(),
  unique (custody_manifest_id, external_artifact_id, sha256)
);

create table kaleidoscope.state_snapshot_artifact (
  state_snapshot_id uuid not null references kaleidoscope.state_snapshot(state_snapshot_id),
  source_artifact_id uuid not null references kaleidoscope.source_artifact(source_artifact_id),
  primary key (state_snapshot_id, source_artifact_id)
);

create table kaleidoscope.state_component_artifact (
  state_component_id uuid not null references kaleidoscope.state_component(state_component_id),
  source_artifact_id uuid not null references kaleidoscope.source_artifact(source_artifact_id),
  primary key (state_component_id, source_artifact_id)
);

create index source_artifact_supersedes_source_artifact_id_idx
  on kaleidoscope.source_artifact (supersedes_source_artifact_id);
create index state_snapshot_artifact_source_artifact_id_idx
  on kaleidoscope.state_snapshot_artifact (source_artifact_id);
create index state_component_artifact_source_artifact_id_idx
  on kaleidoscope.state_component_artifact (source_artifact_id);

alter table kaleidoscope.source_artifact enable row level security;
alter table kaleidoscope.state_snapshot_artifact enable row level security;
alter table kaleidoscope.state_component_artifact enable row level security;

revoke all on kaleidoscope.source_artifact from public, anon, authenticated;
revoke all on kaleidoscope.state_snapshot_artifact from public, anon, authenticated;
revoke all on kaleidoscope.state_component_artifact from public, anon, authenticated;

grant select, insert on kaleidoscope.source_artifact to service_role;
grant select, insert on kaleidoscope.state_snapshot_artifact to service_role;
grant select, insert on kaleidoscope.state_component_artifact to service_role;

create trigger source_artifact_append_only
before update or delete on kaleidoscope.source_artifact
for each row execute function kaleidoscope.deny_mutation();

create trigger state_snapshot_artifact_append_only
before update or delete on kaleidoscope.state_snapshot_artifact
for each row execute function kaleidoscope.deny_mutation();

create trigger state_component_artifact_append_only
before update or delete on kaleidoscope.state_component_artifact
for each row execute function kaleidoscope.deny_mutation();

commit;
