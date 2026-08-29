begin;

create or replace function kaleidoscope.enforce_lens_result_declared_for_scenario()
returns trigger
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
begin
  if not exists (
    select 1
    from kaleidoscope.projection_run as run
    join kaleidoscope.scenario_lens as declared
      on declared.scenario_id = run.scenario_id
    where run.projection_run_id = new.projection_run_id
      and declared.lens_manifest_id = new.lens_manifest_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'lens_result lens must be declared by the projection run scenario';
  end if;

  return new;
end;
$$;

create trigger lens_result_declared_for_scenario
before insert on kaleidoscope.lens_result
for each row execute function kaleidoscope.enforce_lens_result_declared_for_scenario();

create or replace function kaleidoscope.enforce_collision_lens_result_same_run()
returns trigger
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
declare
  collision_run_id uuid;
  result_run_id uuid;
begin
  select projection_run_id into collision_run_id
  from kaleidoscope.cross_lens_collision
  where collision_id = new.collision_id;

  select projection_run_id into result_run_id
  from kaleidoscope.lens_result
  where lens_result_id = new.lens_result_id;

  if collision_run_id is null
     or result_run_id is null
     or collision_run_id <> result_run_id then
    raise exception using
      errcode = '23514',
      message = 'collision_lens_result members must belong to the same projection run';
  end if;

  return new;
end;
$$;

create trigger collision_lens_result_same_run
before insert on kaleidoscope.collision_lens_result
for each row execute function kaleidoscope.enforce_collision_lens_result_same_run();

revoke all on function kaleidoscope.enforce_lens_result_declared_for_scenario() from public, anon, authenticated;
revoke all on function kaleidoscope.enforce_collision_lens_result_same_run() from public, anon, authenticated;

commit;
