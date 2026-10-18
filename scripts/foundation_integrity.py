"""Pure checks shared by foundation receipt and evidence validators."""


def all_causal_claims_unasserted(relationships):
    """Reject every unsupported causal assertion, not just the first."""
    return bool(relationships) and all(
        isinstance(row, dict) and row.get("causal_claim_state") == "not_asserted"
        for row in relationships
    )


def deployment_identity_mismatches(foundation, runtime):
    """Compare every deployment-identity field repeated in both receipts."""
    source_control = runtime.get("source_control") or {}
    render = runtime.get("render") or {}
    root_probe = render.get("root_probe") or {}
    pairs = (
        ("render.deploy_id", foundation.get("render_deploy_id"), render.get("deploy_id")),
        ("render.service_id", foundation.get("render_service_id"), render.get("service_id")),
        ("render.service_url", foundation.get("render_service_url"), render.get("service_url")),
        ("render.deploy_finished_at", foundation.get("render_deployed_at"), render.get("deploy_finished_at")),
        ("source_control.merge_commit_sha", foundation.get("render_deployed_commit"), source_control.get("merge_commit_sha")),
        ("render.root_probe.status_code", foundation.get("render_root_probe_status"), root_probe.get("status_code")),
        ("render.startup_event.engine_version", foundation.get("runtime_version_deployed"), (render.get("startup_event") or {}).get("engine_version")),
    )
    return [path for path, expected, observed in pairs if expected is None or observed != expected]
