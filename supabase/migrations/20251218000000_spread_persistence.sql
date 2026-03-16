-- ============================================================
-- PHASE 3: SPREAD PERSISTENCE
-- Tables for storing Spreads and Task Queues
-- ============================================================

-- ============================================================
-- 1. SPREADS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.spreads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Content snapshot
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    toc JSONB NOT NULL DEFAULT '[]'::jsonb,
    lyra_state JSONB,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'locked')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- One spread per project
    UNIQUE(project_id)
);

-- ============================================================
-- 2. TASK_QUEUES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.task_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    spread_id UUID REFERENCES public.spreads(id) ON DELETE CASCADE,
    
    -- Queue Data
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Status & Versioning
    version INTEGER DEFAULT 1,
    stale BOOLEAN DEFAULT false,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    tear_sheet_version INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- One task queue per project
    UNIQUE(project_id)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_spreads_project ON public.spreads(project_id);
CREATE INDEX IF NOT EXISTS idx_spreads_user ON public.spreads(user_id);
CREATE INDEX IF NOT EXISTS idx_task_queues_project ON public.task_queues(project_id);
CREATE INDEX IF NOT EXISTS idx_task_queues_user ON public.task_queues(user_id);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

ALTER TABLE public.spreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_queues ENABLE ROW LEVEL SECURITY;

-- Spreads Policies
CREATE POLICY "Users can view own spreads"
    ON public.spreads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spreads"
    ON public.spreads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spreads"
    ON public.spreads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spreads"
    ON public.spreads FOR DELETE
    USING (auth.uid() = user_id);

-- Task Queues Policies
CREATE POLICY "Users can view own task queues"
    ON public.task_queues FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own task queues"
    ON public.task_queues FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task queues"
    ON public.task_queues FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task queues"
    ON public.task_queues FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

CREATE TRIGGER update_spreads_updated_at
    BEFORE UPDATE ON public.spreads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_task_queues_updated_at
    BEFORE UPDATE ON public.task_queues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. COMMENTS
-- ============================================================

COMMENT ON TABLE public.spreads IS 'Persistent storage for Spread workspace layout and content snapshots';
COMMENT ON TABLE public.task_queues IS 'Persistent storage for project task sequences and execution status';
