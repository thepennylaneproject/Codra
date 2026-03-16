-- Migration: Create analyzed_assets table for tracking AI-analyzed Cloudinary assets
-- This table stores AI-generated tags and metadata from Claude analysis

CREATE TABLE IF NOT EXISTS analyzed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloudinary_public_id TEXT UNIQUE NOT NULL,
    cloudinary_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    primary_color TEXT,
    mood TEXT,
    suggested_use_case TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by public_id
CREATE INDEX IF NOT EXISTS idx_analyzed_assets_public_id ON analyzed_assets(cloudinary_public_id);

-- Index for querying by tags
CREATE INDEX IF NOT EXISTS idx_analyzed_assets_tags ON analyzed_assets USING GIN(tags);

-- Enable RLS
ALTER TABLE analyzed_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for scheduled functions)
CREATE POLICY "Service role can manage analyzed_assets" ON analyzed_assets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to read
CREATE POLICY "Authenticated users can read analyzed_assets" ON analyzed_assets
    FOR SELECT
    TO authenticated
    USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_analyzed_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analyzed_assets_updated_at
    BEFORE UPDATE ON analyzed_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_analyzed_assets_updated_at();
