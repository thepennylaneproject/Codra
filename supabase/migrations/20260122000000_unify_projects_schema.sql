-- ============================================================
-- DATA-001 FIX: Unify Projects Schema
-- Merges Architect schema columns into existing projects table
-- Fixes schema collision between 001_initial_schema.sql and architect_schema.sql
-- ============================================================

-- ============================================================
-- 1. ADD ARCHITECT COLUMNS
-- ============================================================

-- Add new columns with defaults to allow existing rows
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS primary_goal TEXT,
ADD COLUMN IF NOT EXISTS secondary_goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_users TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand JSONB DEFAULT '{}';

-- ============================================================
-- 2. BACKFILL DATA FROM LEGACY COLUMNS
-- ============================================================

-- Map name -> title, description -> summary and primary_goal
UPDATE public.projects 
SET 
  title = COALESCE(title, name),
  summary = COALESCE(summary, description, name),
  primary_goal = COALESCE(primary_goal, description, name),
  -- Extract domain from settings JSONB if present
  domain = COALESCE(
    domain,
    CASE 
      WHEN settings->>'projectType' = 'campaign' THEN 'content_engine'
      WHEN settings->>'projectType' = 'product' THEN 'saas'
      WHEN settings->>'projectType' = 'content' THEN 'content_engine'
      WHEN settings->>'projectType' = 'custom' THEN 'other'
      ELSE 'other'
    END
  )
WHERE title IS NULL OR summary IS NULL OR primary_goal IS NULL;

-- ============================================================
-- 3. ADD NOT NULL CONSTRAINTS
-- ============================================================

-- Now that all rows have data, make critical fields required
ALTER TABLE public.projects 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN summary SET NOT NULL,
ALTER COLUMN domain SET NOT NULL,
ALTER COLUMN primary_goal SET NOT NULL;

-- ============================================================
-- 4. ADD DOMAIN CHECK CONSTRAINT
-- ============================================================

ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_domain_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_domain_check
CHECK (domain IN ('saas', 'site', 'automation', 'content_engine', 'api', 'mobile', 'other'));

-- ============================================================
-- 5. UPDATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_projects_domain 
  ON public.projects(domain);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'deleted_at'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_projects_title ON public.projects(title) WHERE deleted_at IS NULL';
  ELSE
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_projects_title ON public.projects(title)';
  END IF;
END $$;

-- ============================================================
-- 6. ADD COMMENTS
-- ============================================================

COMMENT ON COLUMN public.projects.title IS 'Project name (unified from name column)';
COMMENT ON COLUMN public.projects.summary IS 'Short project description (unified from description column)';
COMMENT ON COLUMN public.projects.domain IS 'Project type category for Architect system';
COMMENT ON COLUMN public.projects.primary_goal IS 'Main project objective';

-- ============================================================
-- 7. NOTES FOR FUTURE CLEANUP
-- ============================================================

-- After verifying application uses new columns, optionally:
-- 1. Mark legacy columns (name, description) as deprecated
-- 2. Create view for backward compatibility if needed
-- 3. Eventually drop legacy columns in future migration

-- For now, we keep both sets of columns to allow gradual migration
