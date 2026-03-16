-- ============================================================
-- IMAGE POLICY SCHEMA
-- Migration: 20260109_image_policy.sql
-- Implements storage for ImagePolicy v1.0 specification
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. REGISTRY VERSIONS
-- Tracks pinned snapshots for reproducibility
-- ============================================================

CREATE TABLE IF NOT EXISTS image_policy_registry_versions (
    version SERIAL PRIMARY KEY,
    
    -- Full snapshot of canonical assets at this version
    snapshot_json JSONB NOT NULL,
    
    -- Number of assets in snapshot
    asset_count INTEGER NOT NULL DEFAULT 0,
    
    -- Checksum for integrity verification
    checksum_sha256 TEXT,
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for recent versions
CREATE INDEX idx_registry_versions_created 
    ON image_policy_registry_versions(created_at DESC);

COMMENT ON TABLE image_policy_registry_versions 
    IS 'Pinned snapshots of the canonical asset registry for reproducibility';

-- ============================================================
-- 2. GENERATED IMAGES
-- Storage for generated images with retention policy
-- ============================================================

-- Retention mode enum
CREATE TYPE image_retention_mode AS ENUM ('none', 'ephemeral', 'retained');

CREATE TABLE IF NOT EXISTS generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Source tracking
    source TEXT NOT NULL DEFAULT 'generated',
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    
    -- Prompt tracking (hash for privacy, never store raw prompt)
    prompt_hash TEXT NOT NULL,
    
    -- Output details
    url TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    format TEXT NOT NULL,
    transparent_background BOOLEAN NOT NULL DEFAULT FALSE,
    bytes BIGINT,
    
    -- Generation reason
    reason TEXT,
    
    -- Retention policy
    retention_mode image_retention_mode NOT NULL DEFAULT 'ephemeral',
    expires_at TIMESTAMPTZ,
    
    -- Promotion tracking
    promoted_at TIMESTAMPTZ,
    promoted_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_generated_images_user ON generated_images(user_id);
CREATE INDEX idx_generated_images_workspace ON generated_images(workspace_id);
CREATE INDEX idx_generated_images_expires ON generated_images(expires_at) 
    WHERE expires_at IS NOT NULL;
CREATE INDEX idx_generated_images_prompt ON generated_images(prompt_hash);

COMMENT ON TABLE generated_images 
    IS 'Generated images with retention policy - never auto-promoted to canonical';
COMMENT ON COLUMN generated_images.prompt_hash 
    IS 'SHA-256 hash of the prompt for tracking without storing raw text';

-- ============================================================
-- 3. POLICY RECEIPTS
-- Execution traces for observability
-- ============================================================

CREATE TABLE IF NOT EXISTS image_policy_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Execution context
    run_id TEXT NOT NULL,
    template_id TEXT,
    workflow_id TEXT,
    
    -- Policy used (normalized form)
    policy_json JSONB NOT NULL,
    
    -- Registry version used
    registry_version INTEGER REFERENCES image_policy_registry_versions(version),
    
    -- Results
    canonical_assets JSONB NOT NULL DEFAULT '[]',
    generated_outputs JSONB NOT NULL DEFAULT '[]',
    
    -- Credit tracking
    credit_estimate NUMERIC(10, 4),
    credit_actual NUMERIC(10, 4),
    
    -- Error tracking
    error_code TEXT,
    error_details JSONB,
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_policy_receipts_run ON image_policy_receipts(run_id);
CREATE INDEX idx_policy_receipts_template ON image_policy_receipts(template_id) 
    WHERE template_id IS NOT NULL;
CREATE INDEX idx_policy_receipts_workflow ON image_policy_receipts(workflow_id) 
    WHERE workflow_id IS NOT NULL;
CREATE INDEX idx_policy_receipts_user ON image_policy_receipts(user_id);
CREATE INDEX idx_policy_receipts_created ON image_policy_receipts(created_at DESC);

COMMENT ON TABLE image_policy_receipts 
    IS 'Execution traces for image policy runs - for observability and debugging';

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE image_policy_registry_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_policy_receipts ENABLE ROW LEVEL SECURITY;

-- Registry versions: readable by all authenticated users
CREATE POLICY "Authenticated users can read registry versions"
    ON image_policy_registry_versions FOR SELECT
    TO authenticated
    USING (true);

-- Service role can manage registry versions
CREATE POLICY "Service role can manage registry versions"
    ON image_policy_registry_versions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Generated images: users can see their own
CREATE POLICY "Users can view own generated images"
    ON generated_images FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create generated images"
    ON generated_images FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to generated images"
    ON generated_images FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy receipts: users can see their own
CREATE POLICY "Users can view own policy receipts"
    ON image_policy_receipts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create policy receipts"
    ON image_policy_receipts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to policy receipts"
    ON image_policy_receipts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Function to expire ephemeral images (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_generated_images()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM generated_images
    WHERE retention_mode = 'ephemeral'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new registry version
CREATE OR REPLACE FUNCTION create_registry_version(
    p_snapshot_json JSONB,
    p_notes TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_version INTEGER;
    v_count INTEGER;
BEGIN
    -- Count assets in snapshot
    SELECT jsonb_array_length(p_snapshot_json) INTO v_count;
    
    INSERT INTO image_policy_registry_versions (
        snapshot_json,
        asset_count,
        notes,
        created_by
    ) VALUES (
        p_snapshot_json,
        v_count,
        p_notes,
        p_created_by
    ) RETURNING version INTO v_version;
    
    RETURN v_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_generated_images 
    IS 'Deletes ephemeral generated images past their expiration date';
COMMENT ON FUNCTION create_registry_version 
    IS 'Creates a new pinned registry version from a snapshot';
