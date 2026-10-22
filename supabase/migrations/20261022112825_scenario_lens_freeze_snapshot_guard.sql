begin;

-- Advisory-lock acquisition does not refresh a REPEATABLE READ snapshot.
-- Both insertion paths require statement snapshots before sharing the lock.
-- Keep append-only tables, existing grants, and existing triggers unchanged.
do $preflight$
begin
  if not exists (
    select 1 from pg_proc
    where oid = 'kaleidoscope.enforce_projection_run_lens_count()'::regprocedure
      and not prosecdef and pg_get_userbyid(proowner) = 'postgres'
      and md5(prosrc) in ('be06d4ba7dc28974f7d32f916415b53c', 'd42823e09cdbdfcb9685be471dd6227d')
  ) or not exists (
    select 1 from pg_proc
    where oid = 'kaleidoscope.reject_scenario_lens_after_projection_run()'::regprocedure
      and not prosecdef and pg_get_userbyid(proowner) = 'postgres'
      and md5(prosrc) in ('928033b8f56f0949bf37e237fe87de76', '2f47c704a1abd2311e9af3213e762a13')
  ) then
    raise exception 'scenario lens freeze function differs from reviewed definition';
  end if;
end;
$preflight$;

create or replace function kaleidoscope.enforce_projection_run_lens_count()
returns trigger
language plpgsql
set search_path = kaleidoscope, pg_temp
as $$
begin
  if current_setting('transaction_isolation') in ('repeatable read', 'serializable') then
    raise exception using
      errcode = '25000',
      message = 'scenario lens and projection writes require READ COMMITTED isolation',
      hint = 'Start a new READ COMMITTED transaction; advisory locks cannot refresh a fixed snapshot.';
  end if;
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
  if current_setting('transaction_isolation') in ('repeatable read', 'serializable') then
    raise exception using
      errcode = '25000',
      message = 'scenario lens and projection writes require READ COMMITTED isolation',
      hint = 'Start a new READ COMMITTED transaction; advisory locks cannot refresh a fixed snapshot.';
  end if;
  perform pg_advisory_xact_lock(
    hashtextextended('kaleidoscope.scenario_lenses:' || new.scenario_id::text, 0)
  );
  if exists (
    select 1 from kaleidoscope.projection_run where scenario_id = new.scenario_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'cannot add scenario lens after a projection run exists; create a superseding scenario';
  end if;
  return new;
end;
$$;

do $postflight$
begin
  if (select md5(prosrc) from pg_proc where oid = 'kaleidoscope.enforce_projection_run_lens_count()'::regprocedure) <> 'd42823e09cdbdfcb9685be471dd6227d'
     or (select md5(prosrc) from pg_proc where oid = 'kaleidoscope.reject_scenario_lens_after_projection_run()'::regprocedure) <> '2f47c704a1abd2311e9af3213e762a13' then
    raise exception 'scenario lens freeze repair fingerprint mismatch';
  end if;
end;
$postflight$;

commit;
