# Schema Violation in performance-cost-auditor output

**ID:** SYNTH-DEBT-019
**Type:** debt
**Severity:** minor
**Status:** fixed_verified

## History
- 2026-03-06T19:09:44.815550Z: created by synthesizer - Generated due to schema validation failure.
- 2026-03-13T05:01:46Z: cleanup-script - Normalized priority from 'p2' to 'P2' per LYRA v1.1 enum rules.
- 2026-03-19T20:44:29Z: solo-dev - Fix applied via session runner. Commit: 4582118
- 2026-03-19T21:19:35Z: copilot - fixed_verified: perf_audit_report.json rewritten to conform to LYRA v1.1 schema (PLP-70). All findings now include all required fields. Schema validation passes.
