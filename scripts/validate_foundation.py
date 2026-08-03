#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEX64 = re.compile(r'^[0-9a-f]{64}$')


def fail(message: str) -> None:
    print(f'FAIL: {message}', file=sys.stderr)
    raise SystemExit(1)


def load(path: str):
    target = ROOT / path
    try:
        return json.loads(target.read_text(encoding='utf-8'))
    except Exception as exc:
        fail(f'{path} is not valid JSON: {exc}')


def parse_ledger(path: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for number, line in enumerate((ROOT / path).read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip():
            continue
        try:
            digest, filename = line.split(maxsplit=1)
        except ValueError:
            fail(f'{path}:{number} malformed')
        if filename in result:
            fail(f'duplicate ledger filename: {filename}')
        result[filename] = digest
    return result


manifest = load('source_manifests/source_pack_2026_08_03_v3.json')
if manifest.get('identity_rule') != 'filename_is_metadata; byte_length_and_sha256_determine_artifact_identity':
    fail('source identity rule changed or missing')
if manifest.get('corpus_policy') != 'all uploaded documents in this source sequence are active Kaleidoscope source artifacts; no selected subset':
    fail('complete-corpus policy changed or missing')
entries = manifest.get('entries', [])
if len(entries) != 41:
    fail(f'expected 41 source entries, observed {len(entries)}')
by_name = {}
for entry in entries:
    name = entry.get('source_file_name')
    digest = entry.get('sha256', '')
    length = entry.get('byte_length')
    if not name or name in by_name:
        fail(f'invalid or duplicate source filename: {name}')
    if not HEX64.fullmatch(digest):
        fail(f'invalid source hash: {name}')
    if not isinstance(length, int) or length <= 0:
        fail(f'invalid source byte length: {name}')
    if entry.get('embedded_in_repository') is not False:
        fail(f'external source marked embedded: {name}')
    if entry.get('source_use_state') != 'active_kaleidoscope_source':
        fail(f'source is not active Kaleidoscope corpus: {name}')
    by_name[name] = entry

required_new = {
    'P25-PREEMPT-FAMILY-01_dossier.md': (6484, '0c84ce7e744cc0fc5a2d3cc82f13d5424dd137e82d6943c4ebeffe294f1890bd'),
    'P25-DOL-01_state_inventory_chunk2-1.md': (8288, '2d667a89a7bf5232fd7332fecb7612879adaf6ee0c8be5a1dd3b1d00c89d5684'),
    'P25-IA-01_mechanism_dossier-4.md': (12185, '2157da884d15ceb174ba950b92f2499d110ff9c909e772e5737ae6f5a662e46c'),
}
for name, (length, digest) in required_new.items():
    row = by_name.get(name)
    if not row or row['byte_length'] != length or row['sha256'] != digest:
        fail(f'new source identity mismatch: {name}')

ledger = parse_ledger('source_manifests/SHA256SUMS_2026_08_03_v3.txt')
if ledger != {name: row['sha256'] for name, row in by_name.items()}:
    fail('checksum ledger does not match source manifest')

for group in manifest.get('duplicate_groups', []):
    digest = group.get('sha256')
    files = group.get('files', [])
    if len(files) < 2:
        fail('duplicate group is underspecified')
    for name in files:
        if name not in by_name or by_name[name]['sha256'] != digest:
            fail(f'invalid duplicate-group member: {name}')

for group in manifest.get('supersession_groups', []):
    current = group.get('canonical_file')
    historical = group.get('supersedes_for_substantive_use', [])
    if current not in by_name or not historical:
        fail('invalid supersession group')
    for name in historical:
        if name not in by_name:
            fail(f'unknown superseded source: {name}')
        if by_name[name]['sha256'] == by_name[current]['sha256']:
            fail('byte-identical copies must not be modeled as supersession')

expected_supersession = {
    ('P25-IA-01_mechanism_dossier-4.md', 'P25-IA-01_mechanism_dossier-3.md'),
    ('P25-DOL-01_state_inventory_chunk2-1.md', 'P25-DOL-01_state_inventory_chunk2.md'),
}
observed_supersession = {
    (group.get('canonical_file'), historical)
    for group in manifest.get('supersession_groups', [])
    for historical in group.get('supersedes_for_substantive_use', [])
}
if not expected_supersession.issubset(observed_supersession):
    fail('current source supersession chain is incomplete')

reuploads = manifest.get('reupload_observations', [])
if not any(row.get('source_file_name') == 'P25-IA-01_mechanism_dossier-3.md' and row.get('observed_state') == 'same_name_same_bytes_reuploaded' for row in reuploads):
    fail('same-name same-byte reupload observation missing')

fixture = load('fixtures/gender_identity_title_vii_family.v1.json')
scenario = fixture.get('scenario', {})
lenses = scenario.get('lens_ids', [])
if len(lenses) < 3 or len(lenses) != len(set(lenses)):
    fail('Title VII scenario must declare at least three unique lenses')
if fixture.get('projection_results', 'missing') is not None:
    fail('Title VII fixture must not contain projection results')
if not scenario.get('unresolved_conditions'):
    fail('Title VII unresolved conditions must remain explicit')

mechanisms = {row.get('mechanism_id'): row for row in fixture.get('mechanisms', [])}
iowa = mechanisms.get('P25-IA-01', {})
if iowa.get('verification_state') != 'mixed':
    fail('P25-IA-01 aggregate verification must remain mixed')
components = {row.get('component'): row.get('verification_state') for row in iowa.get('verification_components', [])}
if components.get('SF 418 enacted text and legislative history') != 'primary_verified':
    fail('SF 418 primary-source upgrade missing')
if components.get('SF 579 exact clause and March 10, 2026 signing date') != 'secondary_verified_high_confidence':
    fail('SF 579 exact-clause/signing evidence state missing')
if components.get('SF 579 complete enrolled text reviewed line by line') != 'primary_source_not_obtained':
    fail('SF 579 full enrolled-text gap missing')
if components.get('affected localities: 13 cities plus unincorporated Johnson County') != 'secondary_verified':
    fail('Iowa locality-count correction missing')

relations = fixture.get('relationships', [])
if not any(row.get('relationship_type') == 'produces_similar_effect' and row.get('causal_claim_state') == 'not_asserted' for row in relations):
    fail('non-causal Iowa/federal relationship discipline missing')
if not any(row.get('target_id') == 'P25-PREEMPT-FAMILY-01' for row in relations):
    fail('Iowa/preemption-family binding missing')

preemption = load('fixtures/local_lgbtq_ordinance_preemption_family.v1.json')
preemption_scenario = preemption.get('scenario', {})
preemption_lenses = preemption_scenario.get('lens_ids', [])
if len(preemption_lenses) < 3 or len(preemption_lenses) != len(set(preemption_lenses)):
    fail('preemption-family scenario must declare at least three unique lenses')
if preemption.get('projection_results', 'missing') is not None:
    fail('preemption-family fixture must not contain projection results')
member_states = {row.get('jurisdiction'): row.get('mechanism_state') for row in preemption.get('members', [])}
expected_members = {'Tennessee':'operative','Arkansas':'operative','North Carolina':'historical_expired','Texas':'contested_litigation','Iowa':'operative'}
if member_states != expected_members:
    fail('preemption-family member state is incomplete or drifted')
if not any(row.get('causal_claim_state') == 'not_asserted' for row in preemption.get('relationships', [])):
    fail('preemption-family anti-coordination discipline missing')

contracts = load('contracts/foundation-contracts.v1.json')
if contracts.get('$schema') != 'https://json-schema.org/draft/2020-12/schema':
    fail('contract bundle does not declare JSON Schema 2020-12')
required_defs = {'source_artifact','mechanism','state_snapshot','change_set','lens_manifest','scenario','projection_bundle','replay_receipt'}
if set(contracts.get('$defs', {})) != required_defs:
    fail('contract bundle definitions are incomplete or drifted')

civic_binding_schema = load('contracts/civic-genome-snapshot-binding.v1.json')
if civic_binding_schema.get('$schema') != 'https://json-schema.org/draft/2020-12/schema':
    fail('Civic Genome binding contract does not declare JSON Schema 2020-12')
if civic_binding_schema.get('$id') != 'https://luminari.org/kaleidoscope/contracts/civic-genome-snapshot-binding.v1.json':
    fail('Civic Genome binding contract ID drifted')
required_binding_fields = {
    'binding_id', 'binding_version', 'source_owner', 'source_contract_id',
    'source_contract_version', 'source_snapshot_id', 'source_snapshot_hash',
    'source_export_receipt_id', 'source_export_receipt_hash', 'source_as_of',
    'source_scope', 'source_completeness_state', 'source_component_count',
    'component_manifest', 'verification_mapping_state', 'binding_state',
    'binding_errors', 'no_mutation'
}
if not required_binding_fields.issubset(set(civic_binding_schema.get('required', []))):
    fail('Civic Genome binding required fields are incomplete')

civic_binding = load('fixtures/civic_genome_snapshot_binding.v1.json')
if civic_binding.get('fixture_status') != 'definition_only_no_live_snapshot':
    fail('Civic Genome fixture must not claim a live snapshot')
if civic_binding.get('source_owner') != 'lighthouse/civic_genome':
    fail('Civic Genome fixture source owner drifted')
if civic_binding.get('source_contract_id') != 'civic_genome.external_snapshot.v1':
    fail('Civic Genome fixture source contract drifted')
if civic_binding.get('source_contract_version') != '1.0.0':
    fail('Civic Genome fixture source contract version drifted')
if not HEX64.fullmatch(civic_binding.get('source_snapshot_hash', '')):
    fail('Civic Genome fixture snapshot hash is invalid')
if not HEX64.fullmatch(civic_binding.get('source_export_receipt_hash', '')):
    fail('Civic Genome fixture receipt hash is invalid')
component_manifest = civic_binding.get('component_manifest', [])
if civic_binding.get('source_component_count') != len(component_manifest):
    fail('Civic Genome fixture component count does not match manifest')
component_ids = [row.get('source_component_id') for row in component_manifest]
if len(component_ids) != len(set(component_ids)) or not all(isinstance(value, str) and value.startswith('civic_genome:') for value in component_ids):
    fail('Civic Genome fixture component identities are invalid')
if civic_binding.get('verification_mapping_state') != 'unmapped_source_native':
    fail('Civic Genome fixture must preserve unmapped source-native verification')
if civic_binding.get('verification_mapping_rule_id') is not None or civic_binding.get('verification_mapping_rule_version') is not None:
    fail('Civic Genome fixture must not invent a verification mapping rule')
if civic_binding.get('binding_state') != 'unresolved' or not civic_binding.get('binding_errors'):
    fail('Civic Genome fixture must remain explicitly unresolved')
if civic_binding.get('source_completeness_state') != 'incomplete':
    fail('Civic Genome fixture must not claim a complete source export')
if civic_binding.get('no_mutation') is not True:
    fail('Civic Genome binding must be read-only')
for row in component_manifest:
    if row.get('component_mapping_state') != 'unmapped' or row.get('kaleidoscope_component_id') is not None:
        fail('Civic Genome fixture must not silently map components')
    verification = row.get('source_verification', [])
    if not verification or any(state.get('mapping_state') != 'source_native_preserved' for state in verification):
        fail('Civic Genome fixture must preserve source-native verification states')

package = load('package.json')
if package.get('version') != '0.1.4':
    fail('package version is not 0.1.4')
for path in [
    'src/canonical-json.mjs',
    'src/hash.mjs',
    'src/diff.mjs',
    'src/server.mjs',
    'FOUNDATION.md',
    'docs/SOURCE_CORPUS.md',
    'contracts/civic-genome-snapshot-binding.v1.json',
    'fixtures/civic_genome_snapshot_binding.v1.json',
]:
    if not (ROOT / path).is_file():
        fail(f'missing required file: {path}')

receipt = load('FOUNDATION_RECEIPT.json')
if receipt.get('source_entry_count') != 41 or receipt.get('render_service_state') != 'live_staging_scaffold':
    fail('foundation receipt is stale')
if receipt.get('foundation_version') != '0.1.4':
    fail('foundation receipt version is stale')
if receipt.get('civic_genome_binding_contract_state') != 'defined_unbound':
    fail('foundation receipt Civic Genome binding state is stale')

print('OK: Kaleidoscope v0.1.4 source corpus, deterministic scaffold, and unresolved Civic Genome binding contract validated')
