-- Explicit ON DELETE SET NULL for nullable FKs that relied on PostgreSQL default (NO ACTION).

-- project_assets.parent_id -> self-reference for versioning
ALTER TABLE public.project_assets
  DROP CONSTRAINT IF EXISTS project_assets_parent_id_fkey;

ALTER TABLE public.project_assets
  ADD CONSTRAINT project_assets_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.project_assets(id)
  ON DELETE SET NULL;

-- asset_bundles.created_by -> optional auth.users audit column
ALTER TABLE public.asset_bundles
  DROP CONSTRAINT IF EXISTS asset_bundles_created_by_fkey;

ALTER TABLE public.asset_bundles
  ADD CONSTRAINT asset_bundles_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- image_policy_registry_versions.created_by
ALTER TABLE public.image_policy_registry_versions
  DROP CONSTRAINT IF EXISTS image_policy_registry_versions_created_by_fkey;

ALTER TABLE public.image_policy_registry_versions
  ADD CONSTRAINT image_policy_registry_versions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- image_policy_receipts.registry_version
ALTER TABLE public.image_policy_receipts
  DROP CONSTRAINT IF EXISTS image_policy_receipts_registry_version_fkey;

ALTER TABLE public.image_policy_receipts
  ADD CONSTRAINT image_policy_receipts_registry_version_fkey
  FOREIGN KEY (registry_version)
  REFERENCES public.image_policy_registry_versions(version)
  ON DELETE SET NULL;
