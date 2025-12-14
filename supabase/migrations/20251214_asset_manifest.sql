-- ============================================================
-- MODULE I: ASSET MANIFEST SYSTEM
-- Extension to Asset Library for defining bundles, files, and placements
-- ============================================================

-- ============================================================
-- 1. ASSET BUNDLES
-- logical grouping of assets (e.g. "Marketing Kit Q1", "UI Icons")
-- ============================================================

CREATE TABLE public.asset_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT[], -- array of strings for flexible tagging
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id), -- optional tracking
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_asset_bundles_workspace ON public.asset_bundles(workspace_id);

-- Trigger for updated_at
CREATE TRIGGER asset_bundles_updated_at
    BEFORE UPDATE ON public.asset_bundles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. UPDATE ASSETS TABLE
-- Add manifest-specific fields to existing assets table
-- ============================================================

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES public.asset_bundles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS purpose TEXT, -- e.g. "app_icon", "marketing_hero"
ADD COLUMN IF NOT EXISTS variant TEXT, -- e.g. "dark_mode", "primary"
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'; -- "draft", "ready", "archived"

-- Index for bundle lookups
CREATE INDEX IF NOT EXISTS idx_assets_bundle ON public.assets(bundle_id);

-- ============================================================
-- 3. ASSET FILES
-- Concrete file representations including variants (svg, png, webp)
-- This allows one "Asset" to have multiple file formats/sizes
-- ============================================================

CREATE TABLE public.asset_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    -- Physical file details
    path TEXT NOT NULL, -- Relative path or full storage path
    format TEXT NOT NULL, -- "svg", "png", "webp", etc.
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    scale INTEGER DEFAULT 1, -- 1x, 2x, 3x
    size_bytes BIGINT,
    hash_sha256 TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_asset_files_asset ON public.asset_files(asset_id);

-- ============================================================
-- 4. ASSET PLACEMENTS
-- Where is this asset intended to be used in the codebase?
-- ============================================================

CREATE TABLE public.asset_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    kind TEXT NOT NULL, -- "import", "copy", "reference"
    file TEXT NOT NULL, -- Target file path (e.g. "src/components/Header.tsx")
    usage TEXT, -- Description of usage (e.g. "Logo in header")
    symbol TEXT, -- If imported, what symbol name? (e.g. "IconLogo")
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_asset_placements_asset ON public.asset_placements(asset_id);

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE public.asset_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_placements ENABLE ROW LEVEL SECURITY;

-- BUNDLES
CREATE POLICY "Workspace members can view bundles"
    ON public.asset_bundles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = asset_bundles.workspace_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can manage bundles"
    ON public.asset_bundles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = asset_bundles.workspace_id
            AND projects.user_id = auth.uid()
        )
    );

-- FILES (inherit access from asset -> workspace)
CREATE POLICY "Workspace members can view asset files"
    ON public.asset_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            JOIN public.projects ON projects.id = assets.workspace_id
            WHERE assets.id = asset_files.asset_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can manage asset files"
    ON public.asset_files FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            JOIN public.projects ON projects.id = assets.workspace_id
            WHERE assets.id = asset_files.asset_id
            AND projects.user_id = auth.uid()
        )
    );

-- PLACEMENTS (inherit access from asset -> workspace)
CREATE POLICY "Workspace members can view placements"
    ON public.asset_placements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            JOIN public.projects ON projects.id = assets.workspace_id
            WHERE assets.id = asset_placements.asset_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can manage placements"
    ON public.asset_placements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            JOIN public.projects ON projects.id = assets.workspace_id
            WHERE assets.id = asset_placements.asset_id
            AND projects.user_id = auth.uid()
        )
    );
