import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const earlierMigration = await readFile(
  new URL('../supabase/migrations/20260803160000_kaleidoscope_projection_substrate.sql', import.meta.url),
  'utf8'
);
const freezeMigration = await readFile(
  new URL('../supabase/migrations/20261018092000_kaleidoscope_freeze_scenario_lenses_after_run.sql', import.meta.url),
  'utf8'
);

test('a scenario lens cannot be appended once its projection run exists', () => {
  assert.match(freezeMigration, /create trigger scenario_lens_frozen_after_projection_run\s+before insert on kaleidoscope\.scenario_lens/);
  assert.match(freezeMigration, /from kaleidoscope\.projection_run\s+where scenario_id = new\.scenario_id/);
  assert.match(freezeMigration, /raise exception using\s+errcode = '23514'/);
  assert.match(freezeMigration, /create a superseding scenario/);
  assert.match(earlierMigration, /scenario_lens_append_only before update or delete/);
});

test('scenario lens addition and projection-run insertion serialize on the same scenario key', () => {
  const lock = "hashtextextended('kaleidoscope.scenario_lenses:' || new.scenario_id::text, 0)";
  assert.equal(freezeMigration.split(lock).length - 1, 2);
  assert.equal((freezeMigration.match(/pg_advisory_xact_lock/g) ?? []).length, 2);
  assert.match(
    freezeMigration,
    /create or replace function kaleidoscope\.enforce_projection_run_lens_count\(\)[\s\S]*?pg_advisory_xact_lock[\s\S]*?kaleidoscope\.assert_minimum_lenses\(new\.scenario_id\)/
  );
  assert.match(earlierMigration, /create trigger projection_run_minimum_lenses\s+before insert on kaleidoscope\.projection_run/);
});

test('freeze functions preserve the immutable, least-privilege substrate boundary', () => {
  assert.equal((freezeMigration.match(/set search_path = kaleidoscope, pg_temp/g) ?? []).length, 2);
  assert.match(freezeMigration, /revoke all on function kaleidoscope\.reject_scenario_lens_after_projection_run\(\)/);
  assert.doesNotMatch(freezeMigration, /security definer|grant (update|delete)|alter table[\s\S]+disable trigger/i);
  assert.doesNotMatch(freezeMigration, /\bupdate kaleidoscope\.|\bdelete from kaleidoscope\./i);
});
