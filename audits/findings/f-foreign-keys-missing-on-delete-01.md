# Foreign Keys Missing ON DELETE Behaviors

**ID:** f-foreign-keys-missing-on-delete-01  
**Type:** debt  
**Severity:** minor  
**Status:** fixed_verified  

## Summary

Nullable foreign keys that previously relied on PostgreSQL default `NO ACTION` now use explicit `ON DELETE SET NULL` in `supabase/migrations/20260319120000_explicit_on_delete_remaining_fks.sql`.

## History

- 2026-03-06: Opened by schema-auditor (original debt).
- 2026-03-19: Patch applied (session runner); Linear PLP-48.
- 2026-03-19: Scoped LYRA re-audit (data / logic / security) + synthesizer marked **verification_passed** → `fixed_verified`.

## Verification evidence

- `project_assets.parent_id` → self-ref, `ON DELETE SET NULL`
- `asset_bundles.created_by` → `auth.users`, `ON DELETE SET NULL`
- `image_policy_registry_versions.created_by` → `auth.users`, `ON DELETE SET NULL`
- `image_policy_receipts.registry_version` → `image_policy_registry_versions(version)`, `ON DELETE SET NULL`

Run artifacts: `audits/runs/2026-03-19/synthesized-20260319-211503.json`
