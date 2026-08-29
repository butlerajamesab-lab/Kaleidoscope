import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(
  new URL(
    '../supabase/migrations/20260829183219_kaleidoscope_projection_relationship_guards.sql',
    import.meta.url
  ),
  'utf8'
);

test('lens results are constrained to lenses declared by their run scenario', () => {
  assert.match(migration, /join kaleidoscope\.scenario_lens as declared/);
  assert.match(migration, /declared\.scenario_id = run\.scenario_id/);
  assert.match(migration, /declared\.lens_manifest_id = new\.lens_manifest_id/);
  assert.match(migration, /create trigger lens_result_declared_for_scenario/);
});

test('collision links are constrained to one projection run', () => {
  assert.match(migration, /from kaleidoscope\.cross_lens_collision/);
  assert.match(migration, /from kaleidoscope\.lens_result/);
  assert.match(migration, /collision_run_id <> result_run_id/);
  assert.match(migration, /create trigger collision_lens_result_same_run/);
});

test('guard functions use a fixed search path and expose no public execution grant', () => {
  assert.equal((migration.match(/set search_path = kaleidoscope, pg_temp/g) ?? []).length, 2);
  assert.equal((migration.match(/revoke all on function/g) ?? []).length, 2);
  assert.doesNotMatch(migration, /security definer/i);
  assert.doesNotMatch(migration, /grant execute/i);
});
