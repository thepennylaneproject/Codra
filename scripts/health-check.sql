-- ============================================================
-- QUICK DATA HEALTH CHECK
-- Run this query to check for common data issues
-- ============================================================

DO $$
DECLARE
  orphaned_specs INTEGER;
  orphaned_queues INTEGER;
  null_titles INTEGER;
  inactive_expired_creds INTEGER;
  duplicate_projects INTEGER;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Codra Database Health Check';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  
  -- Check for orphaned specifications
  SELECT COUNT(*) INTO orphaned_specs
  FROM public.specifications s
  LEFT JOIN public.projects p ON s.project_id = p.id
  WHERE p.id IS NULL;
  
  IF orphaned_specs > 0 THEN
    RAISE WARNING 'Found % orphaned specifications (DATA-002)', orphaned_specs;
  ELSE
    RAISE NOTICE '✓ No orphaned specifications';
  END IF;
  
  -- Check for orphaned task queues
  SELECT COUNT(*) INTO orphaned_queues
  FROM public.task_queues t
  LEFT JOIN public.projects p ON t.project_id = p.id
  WHERE p.id IS NULL;
  
  IF orphaned_queues > 0 THEN
    RAISE WARNING 'Found % orphaned task_queues (DATA-003)', orphaned_queues;
  ELSE
    RAISE NOTICE '✓ No orphaned task_queues';
  END IF;
  
  -- Check for NULL in critical project fields
  SELECT COUNT(*) INTO null_titles
  FROM public.projects
  WHERE title IS NULL OR summary IS NULL OR primary_goal IS NULL;
  
  IF null_titles > 0 THEN
    RAISE WARNING 'Found % projects with NULL required fields (DATA-001)', null_titles;
  ELSE
    RAISE NOTICE '✓ All projects have required fields';
  END IF;
  
  -- Check for expired but active credentials
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_credentials') THEN
    SELECT COUNT(*) INTO inactive_expired_creds
    FROM public.api_credentials
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND is_active = true;
    
    IF inactive_expired_creds > 0 THEN
      RAISE WARNING 'Found % expired but active credentials (DATA-018)', inactive_expired_creds;
    ELSE
      RAISE NOTICE '✓ No expired active credentials';
    END IF;
  END IF;
  
  -- Check for duplicate project names per user
  SELECT COUNT(*) INTO duplicate_projects
  FROM (
    SELECT user_id, title, COUNT(*) 
    FROM public.projects
    WHERE status = 'active'
    GROUP BY user_id, title
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_projects > 0 THEN
    RAISE WARNING 'Found % users with duplicate project names (DATA-013)', duplicate_projects;
  ELSE
    RAISE NOTICE '✓ No duplicate project names';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  
  IF orphaned_specs = 0 AND orphaned_queues = 0 AND null_titles = 0 AND inactive_expired_creds = 0 AND duplicate_projects = 0 THEN
    RAISE NOTICE '✓ Database health check PASSED';
  ELSE
    RAISE NOTICE '⚠ Database health check found issues above';
  END IF;
  
  RAISE NOTICE '==========================================';
END $$;
