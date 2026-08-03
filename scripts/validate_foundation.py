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


manifest = load('source_manifests/source_pack_2026_08_03.json')
if manifest.get('identity_rule') != 'filename_is_metadata; byte_length_and_sha256_determine_artifact_identity':
    fail('source identity rule changed or missing')
entries = manifest.get('entries', [])
if len(entries) != 38:
    fail(f'expected 38 source entries, observed {len(entries)}')
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
    by_name[name] = entry

ledger = parse_ledger('source_manifests/SHA256SUMS_2026_08_03.txt')
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

fixture = load('fixtures/gender_identity_title_vii_family.v1.json')
scenario = fixture.get('scenario', {})
lenses = scenario.get('lens_ids', [])
if len(lenses) < 3 or len(lenses) != len(set(lenses)):
    fail('scenario must declare at least three unique lenses')
if fixture.get('projection_results', 'missing') is not None:
    fail('foundation fixture must not contain projection results')
unresolved = scenario.get('unresolved_conditions', [])
if not unresolved:
    fail('unresolved conditions must remain explicit')
if any('SF 418' in item and 'not yet' in item for item in unresolved):
    fail('superseded SF 418 source gap remains in fixture')

mechanisms = {row.get('mechanism_id'): row for row in fixture.get('mechanisms', [])}
iowa = mechanisms.get('P25-IA-01', {})
if iowa.get('verification_state') != 'mixed':
    fail('P25-IA-01 aggregate verification must remain mixed')
components = {row.get('component'): row.get('verification_state') for row in iowa.get('verification_components', [])}
if components.get('SF 418 enacted text and legislative history') != 'primary_verified':
    fail('SF 418 primary-source upgrade missing')
if components.get('SF 579 enrolled text, signature, and effective date') != 'primary_source_not_obtained':
    fail('SF 579 primary-source gap missing')

relations = fixture.get('relationships', [])
if not any(row.get('relationship_type') == 'produces_similar_effect' and row.get('causal_claim_state') == 'not_asserted' for row in relations):
    fail('non-causal Iowa/federal relationship discipline missing')

contracts = load('contracts/foundation-contracts.v1.json')
if contracts.get('$schema') != 'https://json-schema.org/draft/2020-12/schema':
    fail('contract bundle does not declare JSON Schema 2020-12')
required_defs = {'source_artifact','mechanism','state_snapshot','change_set','lens_manifest','scenario','projection_bundle','replay_receipt'}
if set(contracts.get('$defs', {})) != required_defs:
    fail('contract bundle definitions are incomplete or drifted')

package = load('package.json')
if package.get('version') != '0.1.2':
    fail('package version is not 0.1.2')
for path in ['src/canonical-json.mjs','src/hash.mjs','src/diff.mjs','src/server.mjs','FOUNDATION.md']:
    if not (ROOT / path).is_file():
        fail(f'missing required file: {path}')

print('OK: Kaleidoscope v0.1.2 foundation, source custody, contracts, and runtime scaffold validated')
