-- ============================================================
-- MODULE F: ADMIN SETTINGS TABLES
-- Admin dashboard control plane for routing, retrieval, and usage
-- ============================================================

-- ============================================================
-- 1. APP_SETTINGS TABLE
-- Workspace-scoped global settings for router and retrieval
-- ============================================================

CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Router weights (0-100, should sum to ~100 for UI display)
    router_weight_cost INTEGER DEFAULT 25 CHECK (router_weight_cost >= 0 AND router_weight_cost <= 100),
    router_weight_latency INTEGER DEFAULT 25 CHECK (router_weight_latency >= 0 AND router_weight_latency <= 100),
    router_weight_quality INTEGER DEFAULT 25 CHECK (router_weight_quality >= 0 AND router_weight_quality <= 100),
    router_weight_task_match INTEGER DEFAULT 25 CHECK (router_weight_task_match >= 0 AND router_weight_task_match <= 100),
    
    -- Budget defaults
    max_cost_per_run_usd DECIMAL(10, 6) DEFAULT 1.00,
    monthly_budget_usd DECIMAL(10, 2) DEFAULT 100.00,
    
    -- Retrieval defaults
    default_retrieval_provider TEXT DEFAULT 'auto' CHECK (default_retrieval_provider IN ('auto', 'brave', 'tavily')),
    default_retrieval_max_results INTEGER DEFAULT 5 CHECK (default_retrieval_max_results >= 1 AND default_retrieval_max_results <= 20),
    default_retrieval_timeout_ms INTEGER DEFAULT 5000 CHECK (default_retrieval_timeout_ms >= 1000 AND default_retrieval_timeout_ms <= 30000),
    
    -- Auto rules for retrieval (JSON array of { keyword, provider })
    retrieval_keyword_rules JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Only one settings row per workspace
    UNIQUE(workspace_id)
);

-- Index for workspace lookups
CREATE INDEX idx_app_settings_workspace ON public.app_settings(workspace_id);

-- ============================================================
-- 2. PROVIDER_SETTINGS TABLE
-- Provider-level configuration (enabled/disabled, display overrides)
-- ============================================================

CREATE TABLE public.provider_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Provider identifier (matches registry)
    provider_id TEXT NOT NULL,
    
    -- Configuration
    enabled BOOLEAN DEFAULT true,
    display_name_override TEXT, -- Override registry displayName
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Only one settings row per provider per workspace
    UNIQUE(workspace_id, provider_id)
);

-- Indexes
CREATE INDEX idx_provider_settings_workspace ON public.provider_settings(workspace_id);
CREATE INDEX idx_provider_settings_provider ON public.provider_settings(provider_id);

-- ============================================================
-- 3. MODEL_SETTINGS TABLE
-- Model-level configuration (metadata overrides, task defaults)
-- ============================================================

CREATE TABLE public.model_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Model identifier (matches registry)
    model_id TEXT NOT NULL,
    
    -- Metadata overrides (NULL = use registry defaults)
    tags TEXT[], -- Override registry tags
    context_window INTEGER, -- Override registry contextWindow
    price_hint_input_per_1k DECIMAL(10, 6), -- Override registry priceHint.inputPer1k
    price_hint_output_per_1k DECIMAL(10, 6), -- Override registry priceHint.outputPer1k
    latency_hint_ms INTEGER, -- Override registry latencyHintMs
    
    -- Task type defaults (which model to use for each task type)
    default_for_task_types TEXT[], -- Array of task types this model is default for
    
    -- Enabled/disabled
    enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Only one settings row per model per workspace
    UNIQUE(workspace_id, model_id)
);

-- Indexes
CREATE INDEX idx_model_settings_workspace ON public.model_settings(workspace_id);
CREATE INDEX idx_model_settings_model ON public.model_settings(model_id);
CREATE INDEX idx_model_settings_task_types ON public.model_settings USING GIN(default_for_task_types) WHERE default_for_task_types IS NOT NULL;

-- ============================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_settings ENABLE ROW LEVEL SECURITY;

-- APP_SETTINGS policies
-- Everyone can read (needed for Smart Router and Prompt Architect)
CREATE POLICY "Users can view app settings"
    ON public.app_settings FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Service role can insert/update/delete (via admin endpoints)
CREATE POLICY "Service role can manage app settings"
    ON public.app_settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- PROVIDER_SETTINGS policies
CREATE POLICY "Users can view provider settings"
    ON public.provider_settings FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage provider settings"
    ON public.provider_settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- MODEL_SETTINGS policies
CREATE POLICY "Users can view model settings"
    ON public.model_settings FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage model settings"
    ON public.model_settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_settings_updated_at
    BEFORE UPDATE ON public.provider_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_settings_updated_at
    BEFORE UPDATE ON public.model_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.app_settings IS 'Workspace-scoped settings for router weights, budget, and retrieval defaults';
COMMENT ON TABLE public.provider_settings IS 'Provider-level configuration (enabled/disabled, display overrides)';
COMMENT ON TABLE public.model_settings IS 'Model-level configuration (metadata overrides, task type defaults)';

COMMENT ON COLUMN public.app_settings.router_weight_cost IS 'Router weight for cost optimization (0-100)';
COMMENT ON COLUMN public.app_settings.router_weight_latency IS 'Router weight for latency optimization (0-100)';
COMMENT ON COLUMN public.app_settings.router_weight_quality IS 'Router weight for quality optimization (0-100)';
COMMENT ON COLUMN public.app_settings.router_weight_task_match IS 'Router weight for task type matching (0-100)';
COMMENT ON COLUMN public.app_settings.retrieval_keyword_rules IS 'JSON array of keyword to provider mappings for auto retrieval routing';

COMMENT ON COLUMN public.model_settings.default_for_task_types IS 'Array of task types (chat, code, reasoning, etc.) this model is default for';
