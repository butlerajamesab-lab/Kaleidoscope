begin;

-- Both insertion paths must acquire the same transaction-scoped lock.
-- This serializes the moment a scenario's lens set becomes frozen with
-- competing additions of scenario lenses (without requiring UPDATE grants).
create or replace function kaleidoscope.enforce_projection_run_lens_count()
returns trigger
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended('kaleidoscope.scenario_lenses:' || new.scenario_id::text, 0)
  );
  perform kaleidoscope.assert_minimum_lenses(new.scenario_id);
  return new;
end;
$$;

create or replace function kaleidoscope.reject_scenario_lens_after_projection_run()
returns trigger
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended('kaleidoscope.scenario_lenses:' || new.scenario_id::text, 0)
  );

  if exists (
    select 1
    from kaleidoscope.projection_run
    where scenario_id = new.scenario_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'cannot add scenario lens after a projection run exists; create a superseding scenario';
  end if;

  return new;
end;
$$;

create trigger scenario_lens_frozen_after_projection_run
before insert on kaleidoscope.scenario_lens
for each row execute function kaleidoscope.reject_scenario_lens_after_projection_run();

revoke all on function kaleidoscope.reject_scenario_lens_after_projection_run()
from public, anon, authenticated;

commit;
