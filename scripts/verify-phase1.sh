#!/bin/bash
# ============================================================
# Phase 1 Migration Verification Script
# Run this after applying Phase 1 migrations to verify fixes
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Phase 1 Migration Verification"
echo "======================================"
echo ""

# Ensure we have DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable not set${NC}"
    echo "Set it with: export DATABASE_URL='your-connection-string'"
    exit 1
fi

echo "Connecting to database..."
echo ""

# ============================================================
# DATA-001: Check Projects Schema
# ============================================================

echo -e "${YELLOW}[DATA-001] Checking Projects Schema...${NC}"

# Check if new columns exist
COLUMNS_CHECK=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'projects' 
  AND column_name IN ('title', 'summary', 'domain', 'primary_goal');
")

if [ "$COLUMNS_CHECK" -eq 4 ]; then
    echo -e "${GREEN}✓ All unified schema columns present${NC}"
else
    echo -e "${RED}✗ Missing unified schema columns (found $COLUMNS_CHECK/4)${NC}"
    exit 1
fi

# Check for NULL values in required fields
NULL_CHECK=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM public.projects 
WHERE title IS NULL OR summary IS NULL OR primary_goal IS NULL;
")

if [ "$NULL_CHECK" -eq 0 ]; then
    echo -e "${GREEN}✓ No NULL values in required fields${NC}"
else
    echo -e "${RED}✗ Found $NULL_CHECK rows with NULL required fields${NC}"
    exit 1
fi

echo ""

# ============================================================
# DATA-002 & DATA-003: Check Foreign Keys
# ============================================================

echo -e "${YELLOW}[DATA-002/003] Checking Foreign Key Constraints...${NC}"

# Check specifications FK
SPEC_FK=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM pg_constraint 
WHERE conname = 'specifications_project_id_fkey' 
  AND confdeltype = 'c';
")

if [ "$SPEC_FK" -eq 1 ]; then
    echo -e "${GREEN}✓ specifications.project_id CASCADE constraint exists${NC}"
else
    echo -e "${RED}✗ specifications FK constraint missing or incorrect${NC}"
    exit 1
fi

# Check task_queues FK
TASK_FK=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM pg_constraint 
WHERE conname = 'task_queues_project_id_fkey' 
  AND confdeltype = 'c';
")

if [ "$TASK_FK" -eq 1 ]; then
    echo -e "${GREEN}✓ task_queues.project_id CASCADE constraint exists${NC}"
else
    echo -e "${RED}✗ task_queues FK constraint missing or incorrect${NC}"
    exit 1
fi

# Check for orphaned records
ORPHANED_SPECS=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM public.specifications s
LEFT JOIN public.projects p ON s.project_id = p.id
WHERE p.id IS NULL;
")

if [ "$ORPHANED_SPECS" -eq 0 ]; then
    echo -e "${GREEN}✓ No orphaned specifications${NC}"
else
    echo -e "${YELLOW}⚠ Found $ORPHANED_SPECS orphaned specifications${NC}"
fi

ORPHANED_QUEUES=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM public.task_queues t
LEFT JOIN public.projects p ON t.project_id = p.id
WHERE p.id IS NULL;
")

if [ "$ORPHANED_QUEUES" -eq 0 ]; then
    echo -e "${GREEN}✓ No orphaned task_queues${NC}"
else
    echo -e "${YELLOW}⚠ Found $ORPHANED_QUEUES orphaned task_queues${NC}"
fi

echo ""

# ============================================================
# DATA-004: Check Version Auto-Increment
# ============================================================

echo -e "${YELLOW}[DATA-004] Checking Version Auto-Increment...${NC}"

# Check if trigger exists
TRIGGER_CHECK=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM pg_trigger 
WHERE tgname = 'specification_version_increment';
")

if [ "$TRIGGER_CHECK" -eq 1 ]; then
    echo -e "${GREEN}✓ Version increment trigger exists${NC}"
else
    echo -e "${RED}✗ Version increment trigger missing${NC}"
    exit 1
fi

# Check if version column has default
VERSION_DEFAULT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'specifications' 
  AND column_name = 'version' 
  AND is_nullable = 'NO';
")

if [ "$VERSION_DEFAULT" -eq 1 ]; then
    echo -e "${GREEN}✓ Version column is NOT NULL${NC}"
else
    echo -e "${RED}✗ Version column allows NULL${NC}"
    exit 1
fi

echo ""

# ============================================================
# Summary
# ============================================================

echo "======================================"
echo -e "${GREEN}Phase 1 Verification Complete!${NC}"
echo "======================================"
echo ""
echo "All critical data integrity fixes have been verified."
echo "You can now proceed with Phase 2."
echo ""
