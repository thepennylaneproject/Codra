-- Migration: Add approval status to artifact versions
-- Specifically for tracking which version was approved/rejected

ALTER TABLE artifact_versions
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_note TEXT;

COMMENT ON COLUMN artifact_versions.approval_status IS 'pending, approved, changes_requested, rejected';

-- Index for searching approved versions
CREATE INDEX IF NOT EXISTS idx_artifact_versions_approval_status ON artifact_versions(approval_status);
