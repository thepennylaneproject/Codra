-- ============================================================
-- ADD VERSIONING TO SPREADS TABLE
-- ============================================================

ALTER TABLE public.spreads 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing spreads to have a version if they don't
UPDATE public.spreads SET version = 1 WHERE version IS NULL;

-- Comment on columns
COMMENT ON COLUMN public.spreads.version IS 'Incremental version number for conflict detection';
COMMENT ON COLUMN public.spreads.last_modified_by IS 'The user who last updated this spread';
COMMENT ON COLUMN public.spreads.last_modified_at IS 'Timestamp of the last modification';
