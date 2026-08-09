begin;

create index if not exists change_set_baseline_snapshot_id_idx
  on kaleidoscope.change_set (baseline_snapshot_id);
create index if not exists change_set_changed_snapshot_id_idx
  on kaleidoscope.change_set (changed_snapshot_id);
create index if not exists change_set_supersedes_change_set_id_idx
  on kaleidoscope.change_set (supersedes_change_set_id);

create index if not exists collision_lens_result_lens_result_id_idx
  on kaleidoscope.collision_lens_result (lens_result_id);
create index if not exists cross_lens_collision_projection_run_id_idx
  on kaleidoscope.cross_lens_collision (projection_run_id);

create index if not exists lens_manifest_supersedes_lens_manifest_id_idx
  on kaleidoscope.lens_manifest (supersedes_lens_manifest_id);
create index if not exists lens_result_lens_manifest_id_idx
  on kaleidoscope.lens_result (lens_manifest_id);

create index if not exists projection_run_scenario_id_idx
  on kaleidoscope.projection_run (scenario_id);
create index if not exists projection_run_supersedes_projection_run_id_idx
  on kaleidoscope.projection_run (supersedes_projection_run_id);

create index if not exists projection_run_event_projection_run_id_idx
  on kaleidoscope.projection_run_event (projection_run_id);
create index if not exists projection_run_event_scenario_id_idx
  on kaleidoscope.projection_run_event (scenario_id);

create index if not exists replay_receipt_projection_run_id_idx
  on kaleidoscope.replay_receipt (projection_run_id);
create index if not exists replay_receipt_supersedes_receipt_id_idx
  on kaleidoscope.replay_receipt (supersedes_receipt_id);

create index if not exists scenario_baseline_snapshot_id_idx
  on kaleidoscope.scenario (baseline_snapshot_id);
create index if not exists scenario_change_set_id_idx
  on kaleidoscope.scenario (change_set_id);
create index if not exists scenario_supersedes_scenario_id_idx
  on kaleidoscope.scenario (supersedes_scenario_id);
create index if not exists scenario_lens_lens_manifest_id_idx
  on kaleidoscope.scenario_lens (lens_manifest_id);

create index if not exists state_component_source_source_binding_id_idx
  on kaleidoscope.state_component_source (source_binding_id);
create index if not exists state_snapshot_supersedes_snapshot_id_idx
  on kaleidoscope.state_snapshot (supersedes_snapshot_id);
create index if not exists state_snapshot_source_source_binding_id_idx
  on kaleidoscope.state_snapshot_source (source_binding_id);

commit;
