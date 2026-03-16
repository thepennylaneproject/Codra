-- Codra Briefing: Mid-Project Onboarding State
-- Tracks per-user, per-project orientation progress

CREATE TABLE IF NOT EXISTS public.project_briefing_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID NOT NULL, -- References projects table
    
    -- Orientation progress
    has_seen_snapshot BOOLEAN DEFAULT FALSE,
    has_completed_tour BOOLEAN DEFAULT FALSE,
    dismissed_update_banner BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    last_visited_at TIMESTAMPTZ,
    last_project_state_hash TEXT, -- For change detection
    
    -- User behavior signals (for adaptive language)
    user_signals JSONB DEFAULT '{
        "hasOpenedStudio": false,
        "hasEditedFlows": false,
        "interactionCount": 0
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per project
    UNIQUE(user_id, project_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_briefing_user_project 
    ON public.project_briefing_state(user_id, project_id);

-- RLS Policies
ALTER TABLE public.project_briefing_state ENABLE ROW LEVEL SECURITY;

-- Users can read their own briefing state
CREATE POLICY "Users can read own briefing state"
    ON public.project_briefing_state
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own briefing state
CREATE POLICY "Users can insert own briefing state"
    ON public.project_briefing_state
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own briefing state
CREATE POLICY "Users can update own briefing state"
    ON public.project_briefing_state
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_briefing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS briefing_state_updated_at ON public.project_briefing_state;
CREATE TRIGGER briefing_state_updated_at
    BEFORE UPDATE ON public.project_briefing_state
    FOR EACH ROW
    EXECUTE FUNCTION update_briefing_updated_at();
