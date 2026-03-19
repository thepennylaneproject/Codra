# Schema Violation in performance-cost-auditor output

**ID:** SYNTH-DEBT-020
**Type:** debt
**Severity:** minor
**Status:** fixed_verified

## History
- 2026-03-06T19:09:44.815553Z: created by synthesizer - Generated due to schema validation failure.
- 2026-03-19T21:19:00.000Z: fixed_verified by github-copilot - perf_audit_report.json updated to conform to LYRA audit output schema v1.1.0 (added schema_version, run_metadata, agent.role/inputs_used/stop_conditions_hit, finding_id, type, priority, confidence, proof_hooks array, impact, suggested_fix, status, history per finding; rollups updated with by_type and by_status). Resolves PLP-71.
