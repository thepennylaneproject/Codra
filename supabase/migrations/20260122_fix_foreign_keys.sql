-- ============================================================
-- DATA-002 & DATA-003 FIX: Fix Foreign Keys After Table Rename
-- Repairs broken foreign key constraints after spreads -> specifications rename
-- ============================================================

-- ============================================================
-- DATA-002: FIX SPECIFICATIONS FOREIGN KEY
-- ============================================================

-- Drop old constraint from spreads table if it exists
DO $$ 
BEGIN
  -- Drop old spreads FK constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'spreads_project_id_fkey'
  ) THEN
    ALTER TABLE public.specifications 
      DROP CONSTRAINT spreads_project_id_fkey;
  END IF;
  
  -- Drop current constraint to recreate
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'specifications_project_id_fkey'
  ) THEN
    ALTER TABLE public.specifications
      DROP CONSTRAINT specifications_project_id_fkey;
  END IF;
END $$;

-- Add correct constraint with CASCADE
ALTER TABLE public.specifications
  ADD CONSTRAINT specifications_project_id_fkey
  FOREIGN KEY (project_id) 
  REFERENCES public.projects(id) 
  ON DELETE CASCADE;

-- Also fix user_id FK while we're here
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'spreads_user_id_fkey'
  ) THEN
    ALTER TABLE public.specifications 
      DROP CONSTRAINT spreads_user_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'specifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.specifications
      DROP CONSTRAINT specifications_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.specifications
  ADD CONSTRAINT specifications_user_id_fkey
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- ============================================================
-- DATA-003: FIX TASK_QUEUES FOREIGN KEYS
-- ============================================================

-- Fix spread_id -> specification_id reference
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'task_queues_spread_id_fkey'
  ) THEN
    ALTER TABLE public.task_queues
      DROP CONSTRAINT task_queues_spread_id_fkey;
  END IF;
END $$;

-- Check if spread_id column exists (might be named differently)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'task_queues' 
      AND column_name = 'spread_id'
  ) THEN
    -- Rename column for clarity
    ALTER TABLE public.task_queues 
      RENAME COLUMN spread_id TO specification_id;
  END IF;
END $$;

-- Add correct FK constraint
-- Note: specification_id is nullable, so SET NULL on delete is appropriate
ALTER TABLE public.task_queues
  DROP CONSTRAINT IF EXISTS task_queues_specification_id_fkey;

ALTER TABLE public.task_queues
  ADD CONSTRAINT task_queues_specification_id_fkey
  FOREIGN KEY (specification_id) 
  REFERENCES public.specifications(id) 
  ON DELETE SET NULL;

-- Ensure project_id and user_id FKs are correct
ALTER TABLE public.task_queues
  DROP CONSTRAINT IF EXISTS task_queues_project_id_fkey;

ALTER TABLE public.task_queues
  ADD CONSTRAINT task_queues_project_id_fkey
  FOREIGN KEY (project_id) 
  REFERENCES public.projects(id) 
  ON DELETE CASCADE;

ALTER TABLE public.task_queues
  DROP CONSTRAINT IF EXISTS task_queues_user_id_fkey;

ALTER TABLE public.task_queues
  ADD CONSTRAINT task_queues_user_id_fkey
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Run these manually to verify fixes:
/*

-- Check for orphaned specifications
SELECT s.id, s.project_id, 'orphaned specification' as issue
FROM public.specifications s
LEFT JOIN public.projects p ON s.project_id = p.id
WHERE p.id IS NULL;

-- Check for orphaned task_queues
SELECT t.id, t.project_id, 'orphaned task_queue' as issue
FROM public.task_queues t
LEFT JOIN public.projects p ON t.project_id = p.id
WHERE p.id IS NULL;

-- Verify FK constraints exist
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  confdeltype as on_delete_action
FROM pg_constraint
WHERE contype = 'f' 
  AND conrelid::regclass::text IN ('specifications', 'task_queues')
ORDER BY conrelid::regclass, conname;

*/

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON CONSTRAINT specifications_project_id_fkey ON public.specifications 
  IS 'Ensures specifications are deleted when parent project is deleted';

COMMENT ON CONSTRAINT task_queues_specification_id_fkey ON public.task_queues
  IS 'Sets task_queue.specification_id to NULL when specification is deleted (allows orphaned queues for audit)';

COMMENT ON CONSTRAINT task_queues_project_id_fkey ON public.task_queues
  IS 'Ensures task_queues are deleted when parent project is deleted';
