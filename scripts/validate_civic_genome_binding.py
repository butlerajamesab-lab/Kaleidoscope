#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEX64 = re.compile(r"^[0-9a-f]{64}$")
SOURCE_SCHEMA_ID = "https://luminari.org/civic-genome/contracts/external-snapshot.v1.schema.json"
SOURCE_CONTRACT_ID = "civic_genome.external_snapshot.v1"
SOURCE_CONTRACT_VERSION = "1.0.0"


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def load(path: str):
    try:
        return json.loads((ROOT / path).read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"{path} is not valid JSON: {exc}")


schema = load("contracts/civic-genome-snapshot-binding.v1.json")
fixture = load("fixtures/civic_genome_snapshot_binding.v1.json")

required = set(schema.get("required", []))
for field in {
    "source_schema_id",
    "source_contract_id",
    "source_contract_version",
    "source_snapshot_hash",
    "source_export_receipt_hash",
    "verification_mapping_state",
    "binding_state",
    "no_mutation",
}:
    if field not in required:
        fail(f"binding schema does not require {field}")

properties = schema.get("properties", {})
if properties.get("source_schema_id", {}).get("const") != SOURCE_SCHEMA_ID:
    fail("binding schema source_schema_id drifted")
if properties.get("source_contract_id", {}).get("const") != SOURCE_CONTRACT_ID:
    fail("binding schema source_contract_id drifted")
if properties.get("source_contract_version", {}).get("const") != SOURCE_CONTRACT_VERSION:
    fail("binding schema source_contract_version drifted")
if properties.get("no_mutation", {}).get("const") is not True:
    fail("binding schema no_mutation boundary drifted")

if fixture.get("source_schema_id") != SOURCE_SCHEMA_ID:
    fail("fixture source_schema_id does not match the Lighthouse producer schema")
if fixture.get("source_contract_id") != SOURCE_CONTRACT_ID:
    fail("fixture source_contract_id drifted")
if fixture.get("source_contract_version") != SOURCE_CONTRACT_VERSION:
    fail("fixture source_contract_version drifted")
if not HEX64.fullmatch(fixture.get("source_snapshot_hash", "")):
    fail("fixture source_snapshot_hash is invalid")
if not HEX64.fullmatch(fixture.get("source_export_receipt_hash", "")):
    fail("fixture source_export_receipt_hash is invalid")
if fixture.get("binding_state") != "unresolved":
    fail("definition fixture must remain unresolved")
if fixture.get("verification_mapping_state") != "unmapped_source_native":
    fail("definition fixture must preserve source-native verification without mapping")
if fixture.get("verification_mapping_rule_id") is not None:
    fail("definition fixture invents a verification mapping rule ID")
if fixture.get("verification_mapping_rule_version") is not None:
    fail("definition fixture invents a verification mapping rule version")
if fixture.get("no_mutation") is not True:
    fail("definition fixture is not read-only")
if not fixture.get("binding_errors"):
    fail("definition fixture must preserve explicit binding errors")

manifest = fixture.get("component_manifest", [])
if fixture.get("source_component_count") != len(manifest):
    fail("fixture source_component_count does not match component_manifest")
for index, component in enumerate(manifest):
    component_id = component.get("source_component_id", "")
    if not isinstance(component_id, str) or not component_id.startswith("civic_genome:"):
        fail(f"component_manifest[{index}] has an invalid source component identity")
    if component.get("component_mapping_state") != "unmapped":
        fail(f"component_manifest[{index}] silently maps a source component")
    if component.get("kaleidoscope_component_id") is not None:
        fail(f"component_manifest[{index}] invents a Kaleidoscope component ID")
    for state in component.get("source_verification", []):
        if state.get("mapping_state") != "source_native_preserved":
            fail(f"component_manifest[{index}] rewrites source-native verification")

print("OK: Kaleidoscope Civic Genome binding is pinned to the portable source schema and remains unresolved")
