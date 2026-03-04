# Phase 1 Deployment Guide

## Overview

Phase 1 addresses critical data integrity issues:

- **DATA-001**: Unify competing projects schemas
- **DATA-002**: Fix specifications foreign key cascade
- **DATA-003**: Fix task_queues foreign key cascade
- **DATA-004**: Auto-increment version for conflict detection

## Pre-Deployment Checklist

- [ ] Backup production database
- [ ] Test migrations in staging environment
- [ ] Verify application builds successfully with code changes
- [ ] Schedule deployment during low-traffic window
- [ ] Prepare rollback plan

## Deployment Steps

### Step 1: Database Backup

```bash
# Create timestamped backup
export BACKUP_FILE="codra_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
echo "Backup saved to: $BACKUP_FILE"
```

### Step 2: Apply Migrations (in order)

Run these migrations **in sequence** on your Supabase database:

```bash
# Navigate to migrations directory
cd supabase/migrations

# Option A: Using Supabase CLI (recommended)
supabase db push

# Option B: Manual SQL execution
psql $DATABASE_URL -f 20260122_unify_projects_schema.sql
psql $DATABASE_URL -f 20260122_fix_foreign_keys.sql
psql $DATABASE_URL -f 20260122_auto_increment_version.sql
```

**Expected Output:**

- Migration 1: `ALTER TABLE` statements, `UPDATE` for backfill, indexes created
- Migration 2: `ALTER TABLE` for FK constraints, no errors about missing constraints
- Migration 3: `CREATE FUNCTION` and `CREATE TRIGGER` for version increment

### Step 3: Verify Migrations

Run the verification script:

```bash
# Set your database connection string
export DATABASE_URL="postgresql://..."

# Run verification
./scripts/verify-phase1.sh
```

**Expected Output:**

```
======================================
Phase 1 Migration Verification
======================================

[DATA-001] Checking Projects Schema...
✓ All unified schema columns present
✓ No NULL values in required fields

[DATA-002/003] Checking Foreign Key Constraints...
✓ specifications.project_id CASCADE constraint exists
✓ task_queues.project_id CASCADE constraint exists
✓ No orphaned specifications
✓ No orphaned task_queues

[DATA-004] Checking Version Auto-Increment...
✓ Version increment trigger exists
✓ Version column is NOT NULL

======================================
Phase 1 Verification Complete!
======================================
```

### Step 4: Deploy Application Code

Deploy updated `src/domain/projects.ts` to production:

```bash
# Build application
npm run build

# Deploy to production (adjust for your deployment method)
# Example for Netlify:
netlify deploy --prod

# Example for Vercel:
vercel --prod
```

### Step 5: Monitor

After deployment, monitor for:

1. **Project Creation Errors**:

   ```bash
   # Check application logs for project creation failures
   netlify functions:log projects-create --tail
   ```

2. **Database Connection Issues**:

   ```sql
   -- Check for failed queries
   SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';
   ```

3. **Version Increment**:
   ```sql
   -- Verify versions are incrementing
   SELECT id, version, updated_at
   FROM specifications
   ORDER BY updated_at DESC
   LIMIT 10;
   ```

## Testing in Production

### Test 1: Create New Project

```bash
# Via application UI or API
curl -X POST https://your-app.com/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Test Project", "type": "campaign", "summary": "Test"}'
```

**Verify**: Check database for new row with proper `title`, `summary`, `domain` values.

### Test 2: Update Specification

1. Open a specification in the UI
2. Make a change to content
3. Save
4. **Verify**: `version` column incremented in database

### Test 3: Delete Project

1. Delete a project via UI
2. **Verify**: Associated specifications and task_queues are also deleted (CASCADE)

```sql
SELECT COUNT(*) FROM specifications WHERE project_id = '<deleted-project-id>';
-- Should return 0
```

## Rollback Plan

If issues occur, rollback in reverse order:

### Rollback Step 1: Revert Application Code

```bash
# Deploy previous version
git revert HEAD
npm run build
netlify deploy --prod
```

### Rollback Step 2: Remove Migrations

```sql
-- Remove version trigger (DATA-004)
DROP TRIGGER IF EXISTS specification_version_increment ON public.specifications;
DROP FUNCTION IF EXISTS increment_specification_version();
DROP FUNCTION IF EXISTS check_specification_version(UUID, INTEGER);

-- Revert FKs to original state (DATA-002/003)
-- (Only if causing issues - generally safe to leave)

-- Remove new columns (DATA-001)
-- WARNING: This loses data in new columns!
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS summary,
  DROP COLUMN IF EXISTS domain,
  DROP COLUMN IF EXISTS primary_goal,
  DROP COLUMN IF EXISTS secondary_goals,
  DROP COLUMN IF EXISTS target_users,
  DROP COLUMN IF EXISTS tech_stack,
  DROP COLUMN IF EXISTS constraints,
  DROP COLUMN IF EXISTS brand;
```

### Rollback Step 3: Restore from Backup

If catastrophic failure:

```bash
# Drop and restore database
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql $DATABASE_URL < $BACKUP_FILE
```

## Post-Deployment Cleanup

After 1 week of stable operation:

1. **Monitor for legacy column usage**:

   ```sql
   -- Check if any code is still writing to 'name' instead of 'title'
   SELECT id, name, title FROM projects WHERE name IS NOT NULL AND name != title;
   ```

2. **Plan for eventual legacy column removal** (Phase 4+)

## Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution**: The migration uses `IF NOT EXISTS` - this is safe to ignore. The column may have been added in a previous partial migration.

### Issue: "NULL value in column violates not-null constraint"

**Cause**: Backfill didn't complete properly.

**Solution**:

```sql
-- Manually backfill missing data
UPDATE public.projects
SET title = name WHERE title IS NULL;
UPDATE public.projects
SET summary = description WHERE summary IS NULL;
UPDATE public.projects
SET primary_goal = description WHERE primary_goal IS NULL;
```

### Issue: Version not incrementing

**Cause**: Trigger not firing.

**Solution**:

```sql
-- Verify trigger exists
SELECT tgname FROM pg_trigger WHERE tgrelid = 'specifications'::regclass;

-- If missing, rerun migration
\i supabase/migrations/20260122_auto_increment_version.sql
```

### Issue: Orphaned specifications after project delete

**Cause**: FK cascade not properly configured.

**Solution**:

```sql
-- Rerun FK migration
\i supabase/migrations/20260122_fix_foreign_keys.sql
```

## Success Criteria

Phase 1 is successfully deployed when:

- ✅ All new projects use unified schema (`title`, `summary`, `domain`)
- ✅ No project creation errors in logs for 24 hours
- ✅ Version auto-increments on specification updates
- ✅ Deleting projects cascades to child records
- ✅ No orphaned data found in daily checks
- ✅ Verification script passes

## Next Steps

After Phase 1 is stable, proceed to Phase 2: Validation Hardening (see `data_audit_report.md`).
