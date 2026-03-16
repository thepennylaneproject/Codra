-- ============================================================
-- MODULE E: TELEMETRY TABLES
-- Tracking for AI runs and retrieval searches
-- ============================================================

-- ============================================================
-- 1. AI_RUNS TABLE
-- Tracks every AI completion request with cost/performance data
-- ============================================================

CREATE TABLE public.ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    
    -- Request context
    task_type TEXT NOT NULL, -- 'chat', 'code', 'summary', 'reasoning', 'image', 'retrieval'
    mode TEXT, -- 'fast', 'balanced', 'best', 'precise', 'production'
    grounded BOOLEAN DEFAULT false, -- Whether retrieval sources were used
    
    -- Execution details
    provider_id TEXT NOT NULL, -- 'aimlapi', 'deepseek', 'gemini', etc.
    model_id TEXT NOT NULL, -- 'gpt-4o', 'claude-3-5-sonnet', etc.
    
    -- Cost estimates (calculated before request)
    est_tokens INTEGER, -- Estimated total tokens
    est_cost_usd DECIMAL(10, 6), -- Estimated cost in USD
    
    -- Actual usage (populated after completion)
    actual_prompt_tokens INTEGER,
    actual_completion_tokens INTEGER,
    actual_cost_usd DECIMAL(10, 6), -- Calculated from actual tokens
    
    -- Performance metrics
    latency_ms INTEGER,
    success BOOLEAN DEFAULT true,
    
    -- Error tracking (safe messages only)
    error_code TEXT, -- 'RATE_LIMIT', 'INVALID_KEY', 'TIMEOUT', etc.
    error_message_safe TEXT, -- User-safe error message
    
    -- Routing explainability
    trace_json JSONB, -- Smart Router trace object
    
    -- Grounding metadata
    sources_count INTEGER, -- Number of retrieval sources used (if grounded)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_ai_runs_user_time ON public.ai_runs(user_id, created_at DESC);
CREATE INDEX idx_ai_runs_workspace_time ON public.ai_runs(workspace_id, created_at DESC) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_ai_runs_provider ON public.ai_runs(provider_id, created_at DESC);
CREATE INDEX idx_ai_runs_model ON public.ai_runs(model_id, created_at DESC);
CREATE INDEX idx_ai_runs_success ON public.ai_runs(success, created_at DESC);
CREATE INDEX idx_ai_runs_task_type ON public.ai_runs(task_type, created_at DESC);
CREATE INDEX idx_ai_runs_grounded ON public.ai_runs(grounded, created_at DESC) WHERE grounded = true;

-- ============================================================
-- 2. RETRIEVAL_RUNS TABLE
-- Tracks every retrieval search request
-- ============================================================

CREATE TABLE public.retrieval_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    
    -- Execution details
    provider_used TEXT NOT NULL CHECK (provider_used IN ('brave', 'tavily')),
    
    -- Query tracking (hashed for privacy/analytics)
    query_hash TEXT NOT NULL, -- SHA-256 hash of query
    
    -- Results
    results_count INTEGER DEFAULT 0,
    
    -- Performance
    latency_ms INTEGER,
    success BOOLEAN DEFAULT true,
    
    -- Error tracking (if failed)
    error_message_safe TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_retrieval_runs_user_time ON public.retrieval_runs(user_id, created_at DESC);
CREATE INDEX idx_retrieval_runs_workspace_time ON public.retrieval_runs(workspace_id, created_at DESC) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_retrieval_runs_provider ON public.retrieval_runs(provider_used, created_at DESC);
CREATE INDEX idx_retrieval_runs_success ON public.retrieval_runs(success, created_at DESC);
CREATE INDEX idx_retrieval_runs_query_hash ON public.retrieval_runs(query_hash, created_at DESC);

-- ============================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrieval_runs ENABLE ROW LEVEL SECURITY;

-- AI_RUNS policies
CREATE POLICY "Users can view own AI runs"
    ON public.ai_runs FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert (server-side logging only)
CREATE POLICY "Service role can insert AI runs"
    ON public.ai_runs FOR INSERT
    WITH CHECK (true);

-- Service role can update (for completing runs with actuals)
CREATE POLICY "Service role can update AI runs"
    ON public.ai_runs FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- RETRIEVAL_RUNS policies
CREATE POLICY "Users can view own retrieval runs"
    ON public.retrieval_runs FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert (server-side logging only)
CREATE POLICY "Service role can insert retrieval runs"
    ON public.retrieval_runs FOR INSERT
    WITH CHECK (true);

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Function to calculate cost from tokens and model pricing
-- (This is a placeholder - actual calculation happens in application code)
CREATE OR REPLACE FUNCTION calculate_ai_cost(
    p_model_id TEXT,
    p_prompt_tokens INTEGER,
    p_completion_tokens INTEGER
) RETURNS DECIMAL(10, 6) AS $$
BEGIN
    -- Placeholder: return 0 for now
    -- Actual cost calculation should use provider registry pricing
    RETURN 0.0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.ai_runs IS 'Telemetry for all AI completion requests with cost and performance tracking';
COMMENT ON TABLE public.retrieval_runs IS 'Telemetry for all retrieval search requests';

COMMENT ON COLUMN public.ai_runs.trace_json IS 'Smart Router routing trace for explainability';
COMMENT ON COLUMN public.ai_runs.est_cost_usd IS 'Pre-request cost estimate based on expected tokens';
COMMENT ON COLUMN public.ai_runs.actual_cost_usd IS 'Post-request actual cost based on real token usage';
COMMENT ON COLUMN public.retrieval_runs.query_hash IS 'SHA-256 hash for deduplication and analytics';
