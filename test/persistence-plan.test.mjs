import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../fixtures/project2025-title-vii-vertical-slice.v1.mjs';
import sourceManifest from '../source_manifests/source_pack_2026_08_03_v3.json' with { type: 'json' };
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import civilRights from '../lenses/civil_rights.v1.json' with { type: 'json' };
import enforcementPathways from '../lenses/enforcement_pathways.v1.json' with { type: 'json' };
import localGovernmentPreemption from '../lenses/local_government_preemption.v1.json' with { type: 'json' };
import { buildDeterministicPersistencePlan } from '../src/persistence-plan.mjs';

const lensManifests = [
  affectedPopulations,
  civilRights,
  enforcementPathways,
  localGovernmentPreemption
];

function build() {
  return buildDeterministicPersistencePlan({ fixture, lensManifests, sourceManifest });
}

function artifactUsage(snapshot) {
  const snapshotArtifacts = new Set();
  let componentLinks = 0;
  for (const component of snapshot.components) {
    const componentArtifacts = new Set(component.source_bindings.map((binding) => binding.source_artifact_id));
    componentLinks += componentArtifacts.size;
    for (const sourceArtifactId of componentArtifacts) snapshotArtifacts.add(sourceArtifactId);
  }
  return { snapshotArtifacts, componentLinks };
}

test('builds an exact deterministic persistence plan without database credentials or writes', () => {
  const plan = build();
  assert.equal(plan.persistence_plan_version, '1.1.0');
  assert.equal(plan.adapter_state, 'deterministic_dry_run_mapping_only');
  assert.equal(plan.target_schema, 'kaleidoscope');
  assert.equal(plan.source_manifest_id, 'kaleidoscope_source_pack_2026_08_03_v3');
  assert.equal(plan.scenario_id, 'project2025_gender_identity_title_vii_vertical_slice.v1');
  assert.equal(plan.live_write_authorized, false);
  assert.equal(plan.database_write_count, 0);
  assert.equal(plan.upstream_mutation, false);
  assert.equal(plan.credentials_required, false);
  assert.equal(plan.sql_emitted, false);
  assert.equal(plan.table_plan.length, 36);
});

test('replay produces the identical persistence plan hash', () => {
  const first = build();
  const second = build();
  assert.deepEqual(second, first);
  assert.equal(second.persistence_plan_hash, first.persistence_plan_hash);
});

test('routes direct custody through source_artifact without inventing peer-platform bindings', () => {
  const plan = build();
  assert.equal(plan.source_artifacts.length, fixture.source_artifact_ids.length);
  assert.ok(plan.source_artifacts.every((entry) => entry.mapping_state === 'direct_custody_mappable_unpersisted'));
  assert.ok(plan.source_artifacts.every((entry) => entry.target_table === 'source_artifact'));
  assert.equal(plan.blockers.includes('source_binding_upstream_ownership_mapping_not_declared'), false);
  assert.equal(plan.direct_custody.upstream_object_bindings_created, 0);
  assert.equal(plan.direct_custody.no_upstream_ownership_inference, true);

  const sourceBinding = plan.table_plan.find((entry) => entry.table === 'source_binding');
  const snapshotSource = plan.table_plan.find((entry) => entry.table === 'state_snapshot_source');
  const componentSource = plan.table_plan.find((entry) => entry.table === 'state_component_source');
  assert.equal(sourceBinding.mapping_state, 'not_applicable_direct_custody');
  assert.equal(sourceBinding.candidate_record_count, 0);
  assert.equal(snapshotSource.mapping_state, 'not_applicable_direct_custody');
  assert.equal(componentSource.mapping_state, 'not_applicable_direct_custody');
});

test('derives snapshot and component artifact links only from declared component support', () => {
  const plan = build();
  const baseline = artifactUsage(fixture.baseline);
  const changed = artifactUsage(fixture.changed);
  const expectedSnapshotLinks = baseline.snapshotArtifacts.size + changed.snapshotArtifacts.size;
  const expectedComponentLinks = baseline.componentLinks + changed.componentLinks;
  const referenced = new Set([...baseline.snapshotArtifacts, ...changed.snapshotArtifacts]);
  const expectedUnlinked = fixture.source_artifact_ids.filter((id) => !referenced.has(id)).sort();

  assert.equal(plan.direct_custody.snapshot_artifact_link_count, expectedSnapshotLinks);
  assert.equal(plan.direct_custody.component_artifact_link_count, expectedComponentLinks);
  assert.deepEqual(plan.direct_custody.unlinked_scenario_support_artifact_ids, expectedUnlinked);

  const snapshotArtifacts = plan.table_plan.find((entry) => entry.table === 'state_snapshot_artifact');
  const componentArtifacts = plan.table_plan.find((entry) => entry.table === 'state_component_artifact');
  const scenarioArtifacts = plan.table_plan.find((entry) => entry.table === 'scenario_artifact');
  assert.equal(snapshotArtifacts.candidate_record_count, expectedSnapshotLinks);
  assert.equal(componentArtifacts.candidate_record_count, expectedComponentLinks);
  assert.equal(scenarioArtifacts.candidate_record_count, fixture.source_artifact_ids.length);
});

test('maps structurally available records while blocking canonical projection persistence', () => {
  const plan = build();
  const snapshots = plan.table_plan.find((entry) => entry.table === 'state_snapshot');
  const components = plan.table_plan.find((entry) => entry.table === 'state_component');
  const operations = plan.table_plan.find((entry) => entry.table === 'change_operation');
  const projectionRun = plan.table_plan.find((entry) => entry.table === 'projection_run');
  const collisionLinks = plan.table_plan.find((entry) => entry.table === 'collision_lens_result');

  assert.equal(snapshots.mapping_state, 'structurally_mappable_unpersisted');
  assert.equal(snapshots.candidate_record_count, 2);
  assert.equal(components.candidate_record_count, fixture.baseline.components.length + fixture.changed.components.length);
  assert.ok(operations.candidate_record_count > 0);
  assert.equal(projectionRun.mapping_state, 'blocked_authorization');
  assert.ok(projectionRun.unresolved_conditions.includes('projection_claim_state_not_authorized_for_canonical_persistence'));
  assert.ok(plan.blockers.includes('runtime_database_transport_not_bound'));
  assert.ok(plan.blockers.includes('collision_lens_result_foreign_key_mapping_not_declared'));
  assert.ok(plan.blockers.includes('projection_run_event_emission_contract_not_declared'));
  assert.equal(collisionLinks.mapping_state, 'blocked_contract_gap');
  assert.equal(collisionLinks.candidate_record_count, 0);
});

test('rejects a source artifact that is not present in the governed source manifest', () => {
  const changed = structuredClone(fixture);
  changed.source_artifact_ids = [...changed.source_artifact_ids, 'invented-source.md'];
  assert.throws(
    () => buildDeterministicPersistencePlan({ fixture: changed, lensManifests, sourceManifest }),
    /source_artifact_missing_from_manifest:invented-source\.md/
  );
});

test('preserves upstream validation when component support is not declared by the scenario', () => {
  const changed = structuredClone(fixture);
  changed.baseline.components[0].source_bindings[0].source_artifact_id = 'constitutional_powers_reference_pass1.md';
  changed.source_artifact_ids = changed.source_artifact_ids.filter((id) => id !== 'constitutional_powers_reference_pass1.md');
  assert.throws(
    () => buildDeterministicPersistencePlan({ fixture: changed, lensManifests, sourceManifest }),
    /unknown_source_artifact:constitutional_powers_reference_pass1\.md/
  );
});

test('a source-manifest identity change changes the persistence plan hash without changing engine output', () => {
  const first = build();
  const changedManifest = structuredClone(sourceManifest);
  const source = changedManifest.entries.find((entry) => entry.source_file_name === fixture.source_artifact_ids[0]);
  source.sha256 = 'f'.repeat(64);
  const second = buildDeterministicPersistencePlan({ fixture, lensManifests, sourceManifest: changedManifest });
  assert.notEqual(second.persistence_plan_hash, first.persistence_plan_hash);
  assert.equal(second.projection_bundle_hash, first.projection_bundle_hash);
});
