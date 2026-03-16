-- ============================================================
-- DATA-004 FIX: Auto-Increment Specification Version
-- Adds database trigger to manage version field automatically
-- Prevents version drift and race conditions in conflict detection
-- ============================================================

-- ============================================================
-- 1. CREATE VERSION INCREMENT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION increment_specification_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if content actually changed
  -- Check if sections or toc changed (the main content fields)
  IF (NEW.sections IS DISTINCT FROM OLD.sections) OR 
     (NEW.toc IS DISTINCT FROM OLD.toc) OR 
     (NEW.lyra_state IS DISTINCT FROM OLD.lyra_state) THEN
    
    -- Increment version (or initialize to 1 if NULL)
    NEW.version = COALESCE(OLD.version, 0) + 1;
    
    -- Update last_modified_at timestamp
    NEW.last_modified_at = NOW();
    
    -- Note: last_modified_by should be set by application code
    -- We don't have access to auth.uid() in BEFORE UPDATE trigger context
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. CREATE TRIGGER
-- ============================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS specification_version_increment ON public.specifications;

-- Create new trigger
CREATE TRIGGER specification_version_increment
  BEFORE UPDATE ON public.specifications
  FOR EACH ROW
  EXECUTE FUNCTION increment_specification_version();

-- ============================================================
-- 3. ENSURE VERSION COLUMN EXISTS AND HAS DEFAULT
-- ============================================================

-- This should already exist from 20260112_add_spread_versioning.sql
-- but we verify and add if missing
ALTER TABLE public.specifications
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Backfill any NULL versions
UPDATE public.specifications 
SET version = 1 
WHERE version IS NULL;

-- Add NOT NULL constraint
ALTER TABLE public.specifications
  ALTER COLUMN version SET NOT NULL;

-- ============================================================
-- 4. ADD OPTIMISTIC LOCK CHECK FUNCTION (OPTIONAL)
-- ============================================================

-- This function can be called from application code to verify version
-- before updating, providing an additional safety check
CREATE OR REPLACE FUNCTION check_specification_version(
  p_specification_id UUID,
  p_expected_version INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_version INTEGER;
BEGIN
  SELECT version INTO current_version
  FROM public.specifications
  WHERE id = p_specification_id;
  
  IF current_version IS NULL THEN
    RAISE EXCEPTION 'Specification not found: %', p_specification_id;
  END IF;
  
  RETURN current_version = p_expected_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. COMMENTS
-- ============================================================

COMMENT ON FUNCTION increment_specification_version() IS 
  'Automatically increments version when specification content changes. Used for optimistic locking and conflict detection.';

COMMENT ON FUNCTION check_specification_version(UUID, INTEGER) IS 
  'Helper function to verify expected version before update. Returns true if version matches, false otherwise.';

-- ============================================================
-- TESTING NOTES
-- ============================================================

/*
-- Test version increment:

-- 1. Create test specification
INSERT INTO specifications (project_id, user_id, sections, toc)
VALUES (
  (SELECT id FROM projects LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  '[]'::jsonb,
  '[]'::jsonb
)
RETURNING id, version;  -- Should show version = 1

-- 2. Update content
UPDATE specifications 
SET sections = '[{"id": "test"}]'::jsonb
WHERE id = '<uuid-from-above>'
RETURNING version;  -- Should show version = 2

-- 3. Update again
UPDATE specifications 
SET sections = '[{"id": "test2"}]'::jsonb
WHERE id = '<uuid-from-above>'
RETURNING version;  -- Should show version = 3

-- 4. Update non-content field (should NOT increment)
UPDATE specifications 
SET updated_at = NOW()
WHERE id = '<uuid-from-above>'
RETURNING version;  -- Should still show version = 3

*/
