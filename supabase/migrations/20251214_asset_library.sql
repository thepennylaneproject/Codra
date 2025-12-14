-- ============================================================
-- MODULE G: ASSET LIBRARY
-- Storage + Metadata + Versioning for reusable assets
-- ============================================================

-- ============================================================
-- 1. ASSETS TABLE
-- Core metadata for all uploaded assets
-- ============================================================

CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Asset type and identity
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'doc', 'other')),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Storage references
    storage_path TEXT NOT NULL, -- Supabase Storage path: workspace/{workspaceId}/{assetId}/{version}/filename
    public_url TEXT NOT NULL,   -- Full URL to access the asset
    
    -- File metadata
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    
    -- Media-specific metadata (nullable for non-media files)
    width INTEGER,              -- Image/video width in pixels
    height INTEGER,             -- Image/video height in pixels
    duration_ms INTEGER,        -- Audio/video duration in milliseconds
    
    -- Integrity and deduplication
    hash_sha256 TEXT,           -- SHA-256 hash for deduplication
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_assets_workspace ON public.assets(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_user ON public.assets(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_type ON public.assets(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_created ON public.assets(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_hash ON public.assets(hash_sha256) WHERE hash_sha256 IS NOT NULL AND deleted_at IS NULL;

-- Auto-update timestamp trigger
CREATE TRIGGER assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. ASSET_TAGS TABLE
-- Many-to-many relationship for tagging assets
-- ============================================================

CREATE TABLE public.asset_tags (
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    
    PRIMARY KEY (asset_id, tag)
);

-- Index for tag-based queries
CREATE INDEX idx_asset_tags_tag ON public.asset_tags(tag);

-- ============================================================
-- 3. ASSET_VERSIONS TABLE
-- Version history for asset updates
-- ============================================================

CREATE TABLE public.asset_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    
    -- Storage references for this version
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    
    -- File metadata
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    
    -- Media-specific metadata (nullable)
    width INTEGER,
    height INTEGER,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique version numbers per asset
    UNIQUE(asset_id, version)
);

-- Index for version queries
CREATE INDEX idx_asset_versions_asset ON public.asset_versions(asset_id, version DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_versions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- ASSETS Policies
-- ------------------------------------------------------------

-- Workspace members can view assets (checks if user has access to the workspace)
CREATE POLICY "Workspace members can view assets"
    ON public.assets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = assets.workspace_id
            AND projects.user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

-- Users can create assets in their own workspaces
CREATE POLICY "Users can create assets in own workspaces"
    ON public.assets FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = workspace_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can update their own assets
CREATE POLICY "Users can update own assets"
    ON public.assets FOR UPDATE
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = workspace_id
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Users can soft delete (or hard delete) their own assets
CREATE POLICY "Users can delete own assets"
    ON public.assets FOR DELETE
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = workspace_id
            AND projects.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------
-- ASSET_TAGS Policies
-- ------------------------------------------------------------

-- Users can view tags for assets they can access
CREATE POLICY "Users can view tags for accessible assets"
    ON public.asset_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_tags.asset_id
            AND EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = assets.workspace_id
                AND projects.user_id = auth.uid()
            )
            AND assets.deleted_at IS NULL
        )
    );

-- Users can create tags for their own assets
CREATE POLICY "Users can create tags for own assets"
    ON public.asset_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_tags.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- Users can delete tags from their own assets
CREATE POLICY "Users can delete tags from own assets"
    ON public.asset_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_tags.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------
-- ASSET_VERSIONS Policies
-- ------------------------------------------------------------

-- Users can view versions for assets they can access
CREATE POLICY "Users can view versions for accessible assets"
    ON public.asset_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_versions.asset_id
            AND EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = assets.workspace_id
                AND projects.user_id = auth.uid()
            )
            AND assets.deleted_at IS NULL
        )
    );

-- Service role can insert versions (server-side only)
CREATE POLICY "Service role can insert versions"
    ON public.asset_versions FOR INSERT
    WITH CHECK (true);

-- Only admins can delete old versions (via service role)
-- No direct DELETE policy - must use service role

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Function to create a new asset version
CREATE OR REPLACE FUNCTION create_asset_version(
    p_asset_id UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_mime_type TEXT,
    p_size_bytes BIGINT,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_version_num INTEGER;
    v_version_id UUID;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version), 0) + 1
    INTO v_version_num
    FROM public.asset_versions
    WHERE asset_id = p_asset_id;
    
    -- Insert new version
    INSERT INTO public.asset_versions (
        asset_id, version, storage_path, public_url,
        mime_type, size_bytes, width, height
    ) VALUES (
        p_asset_id, v_version_num, p_storage_path, p_public_url,
        p_mime_type, p_size_bytes, p_width, p_height
    ) RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete an asset
CREATE OR REPLACE FUNCTION soft_delete_asset(p_asset_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted BOOLEAN;
BEGIN
    UPDATE public.assets
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = p_asset_id
    AND deleted_at IS NULL
    AND user_id = auth.uid();
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.assets IS 'Uploaded and generated assets with metadata and storage references';
COMMENT ON TABLE public.asset_tags IS 'Tags for organizing and filtering assets';
COMMENT ON TABLE public.asset_versions IS 'Version history for asset updates';

COMMENT ON COLUMN public.assets.storage_path IS 'Supabase Storage path: workspace/{workspaceId}/{assetId}/{version}/filename';
COMMENT ON COLUMN public.assets.hash_sha256 IS 'SHA-256 hash for deduplication (optional)';
COMMENT ON COLUMN public.assets.deleted_at IS 'Soft delete timestamp (NULL = active)';
