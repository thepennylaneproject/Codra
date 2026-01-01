-- ============================================================
-- BEHAVIOR TRACKING SCHEMA
-- Tracks user behavior to improve Smart Defaults inference
-- ============================================================

-- ============================================================
-- 1. BEHAVIOR EVENTS TABLE
-- Tracks individual user actions for learning preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS public.behavior_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    event TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_time 
    ON public.behavior_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_event 
    ON public.behavior_events(event);

COMMENT ON TABLE public.behavior_events IS 'User behavior tracking for Smart Defaults learning';
COMMENT ON COLUMN public.behavior_events.event IS 'Event type: setting_changed, desk_switched, quality_feedback, task_rerun, export_format_chosen';
COMMENT ON COLUMN public.behavior_events.metadata IS 'Additional context: setting name, value, task type, etc.';

-- ============================================================
-- 2. TASK PATTERNS TABLE
-- Stores user preferences for specific task types
-- ============================================================

CREATE TABLE IF NOT EXISTS public.task_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    desk_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    overrides JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- One pattern per user/desk/task combination
    UNIQUE(user_id, desk_id, task_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_patterns_user 
    ON public.task_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_task_patterns_desk 
    ON public.task_patterns(desk_id);
CREATE INDEX IF NOT EXISTS idx_task_patterns_type 
    ON public.task_patterns(task_type);

-- Auto-update timestamp trigger
CREATE TRIGGER task_patterns_updated_at
    BEFORE UPDATE ON public.task_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.task_patterns IS 'Saved task-specific setting overrides ("Remember for similar tasks")';
COMMENT ON COLUMN public.task_patterns.desk_id IS 'Desk where pattern applies: write, design, code, research';
COMMENT ON COLUMN public.task_patterns.task_type IS 'Type of task: headline, code-review, mockup, etc.';
COMMENT ON COLUMN public.task_patterns.overrides IS 'Setting overrides: qualityPriority, maxSteps, modelOverride, etc.';

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_patterns ENABLE ROW LEVEL SECURITY;

-- BEHAVIOR_EVENTS policies
DROP POLICY IF EXISTS "Users can view own behavior events" ON public.behavior_events;
CREATE POLICY "Users can view own behavior events"
    ON public.behavior_events FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own behavior events" ON public.behavior_events;
CREATE POLICY "Users can create own behavior events"
    ON public.behavior_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE on behavior events (immutable audit trail)

-- TASK_PATTERNS policies
DROP POLICY IF EXISTS "Users can view own task patterns" ON public.task_patterns;
CREATE POLICY "Users can view own task patterns"
    ON public.task_patterns FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own task patterns" ON public.task_patterns;
CREATE POLICY "Users can create own task patterns"
    ON public.task_patterns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own task patterns" ON public.task_patterns;
CREATE POLICY "Users can update own task patterns"
    ON public.task_patterns FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own task patterns" ON public.task_patterns;
CREATE POLICY "Users can delete own task patterns"
    ON public.task_patterns FOR DELETE
    USING (auth.uid() = user_id);
