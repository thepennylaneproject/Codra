-- ============================================================
-- CODRA DATABASE SCHEMA - Phase 2
-- Complete Supabase migrations with RLS for multi-tenant security
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USER PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    company TEXT,
    job_title TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Preferences
    preferences JSONB DEFAULT '{
        "theme": "dark",
        "defaultEnvironment": "development",
        "notifications": {
            "email": true,
            "quotaAlerts": true,
            "weeklyDigest": false
        },
        "editor": {
            "fontSize": 14,
            "tabSize": 2,
            "wordWrap": true
        }
    }'::jsonb,
    
    -- Subscription/Plan info
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
    plan_started_at TIMESTAMPTZ,
    plan_expires_at TIMESTAMPTZ,
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for common queries
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_plan ON public.profiles(plan);
CREATE INDEX idx_profiles_last_active ON public.profiles(last_active_at DESC);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. API CREDENTIALS (encrypted keys with environment scoping)
-- ============================================================

CREATE TYPE credential_environment AS ENUM ('development', 'staging', 'production');
CREATE TYPE credential_status AS ENUM ('active', 'inactive', 'error', 'expired');
CREATE TYPE ai_provider AS ENUM ('aimlapi', 'deepseek', 'gemini', 'deepai', 'openai', 'anthropic');

CREATE TABLE public.api_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Provider info
    provider ai_provider NOT NULL,
    provider_name TEXT NOT NULL, -- Display name
    environment credential_environment NOT NULL DEFAULT 'development',
    
    -- Encrypted key (AES-256-GCM encrypted, base64 encoded)
    encrypted_key TEXT NOT NULL,
    key_hint TEXT, -- Last 4 characters for display
    
    -- Status
    status credential_status DEFAULT 'inactive',
    last_tested_at TIMESTAMPTZ,
    last_error TEXT,
    
    -- Limits and usage
    monthly_limit INTEGER, -- NULL = unlimited
    daily_limit INTEGER,
    current_month_usage INTEGER DEFAULT 0,
    current_day_usage INTEGER DEFAULT 0,
    usage_reset_day INTEGER DEFAULT 1, -- Day of month to reset
    
    -- Alert thresholds (percentages)
    alert_threshold_warning INTEGER DEFAULT 80,
    alert_threshold_critical INTEGER DEFAULT 95,
    last_alert_sent_at TIMESTAMPTZ,
    
    -- Metadata
    label TEXT, -- User-defined label
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique constraint: one credential per provider/environment per user
    UNIQUE(user_id, provider, environment)
);

CREATE INDEX idx_credentials_user ON public.api_credentials(user_id);
CREATE INDEX idx_credentials_provider ON public.api_credentials(provider);
CREATE INDEX idx_credentials_env ON public.api_credentials(environment);
CREATE INDEX idx_credentials_status ON public.api_credentials(status);

CREATE TRIGGER credentials_updated_at
    BEFORE UPDATE ON public.api_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. USAGE LOGS (detailed tracking per request)
-- ============================================================

CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credential_id UUID REFERENCES public.api_credentials(id) ON DELETE SET NULL,
    
    -- Provider info
    provider ai_provider NOT NULL,
    model TEXT NOT NULL,
    environment credential_environment NOT NULL,
    
    -- Request details
    request_type TEXT NOT NULL, -- 'completion', 'image', 'embedding', etc.
    endpoint TEXT,
    
    -- Usage metrics
    requests INTEGER DEFAULT 1,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Image-specific
    images_generated INTEGER DEFAULT 0,
    image_resolution TEXT,
    
    -- Cost tracking (in USD cents for precision)
    cost_cents INTEGER DEFAULT 0,
    
    -- Performance
    latency_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    error_code TEXT,
    
    -- Context
    project_id UUID, -- Will reference projects table
    session_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Partitioning-ready indexes for time-series queries
CREATE INDEX idx_usage_user_time ON public.usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_provider_time ON public.usage_logs(provider, created_at DESC);
CREATE INDEX idx_usage_credential ON public.usage_logs(credential_id);
CREATE INDEX idx_usage_project ON public.usage_logs(project_id);
CREATE INDEX idx_usage_created ON public.usage_logs(created_at DESC);

-- ============================================================
-- 4. PROJECTS (workspace organization)
-- ============================================================

CREATE TYPE project_status AS ENUM ('active', 'archived', 'deleted');

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Emoji or icon name
    color TEXT, -- Hex color for UI
    
    -- Status
    status project_status DEFAULT 'active',
    
    -- Settings
    settings JSONB DEFAULT '{
        "defaultModel": "gpt-4o",
        "defaultProvider": "aimlapi",
        "maxContextTokens": 128000,
        "autoSave": true,
        "gitIntegration": {
            "enabled": false,
            "repoUrl": null,
            "branch": "main"
        }
    }'::jsonb,
    
    -- Paths (for local file system access)
    local_path TEXT,
    last_synced_at TIMESTAMPTZ,
    
    -- Stats
    total_requests INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    
    -- Timestamps
    last_opened_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique slug per user
    UNIQUE(user_id, slug)
);

CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_last_opened ON public.projects(last_opened_at DESC);

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. PROJECT ASSETS (files, images, generated content)
-- ============================================================

CREATE TYPE asset_type AS ENUM (
    'file',      -- Code files, documents
    'image',     -- Generated images
    'audio',     -- Generated audio/voice
    'video',     -- Generated video
    'prompt',    -- Saved prompts
    'snippet',   -- Code snippets
    'workflow',  -- Saved workflows
    'export'     -- Exported outputs
);

CREATE TABLE public.project_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Asset info
    type asset_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Storage
    storage_path TEXT, -- Supabase storage path
    public_url TEXT,
    mime_type TEXT,
    file_size INTEGER, -- Bytes
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_id UUID REFERENCES public.project_assets(id), -- For versioning
    
    -- Generation info (for AI-generated assets)
    generated BOOLEAN DEFAULT false,
    generation_params JSONB, -- Model, prompt, settings used
    provider ai_provider,
    model TEXT,
    generation_cost_cents INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_assets_project ON public.project_assets(project_id);
CREATE INDEX idx_assets_user ON public.project_assets(user_id);
CREATE INDEX idx_assets_type ON public.project_assets(type);
CREATE INDEX idx_assets_tags ON public.project_assets USING GIN(tags);
CREATE INDEX idx_assets_not_deleted ON public.project_assets(id) WHERE deleted_at IS NULL;

CREATE TRIGGER assets_updated_at
    BEFORE UPDATE ON public.project_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. USAGE AGGREGATES (pre-computed for dashboard)
-- ============================================================

CREATE TABLE public.usage_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    provider ai_provider NOT NULL,
    environment credential_environment NOT NULL,
    
    -- Aggregated metrics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    avg_latency_ms INTEGER,
    
    -- Image-specific
    images_generated INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, date, provider, environment)
);

CREATE INDEX idx_aggregates_user_date ON public.usage_daily_aggregates(user_id, date DESC);
CREATE INDEX idx_aggregates_provider ON public.usage_daily_aggregates(provider);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_daily_aggregates ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- API_CREDENTIALS policies
CREATE POLICY "Users can view own credentials"
    ON public.api_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own credentials"
    ON public.api_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
    ON public.api_credentials FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
    ON public.api_credentials FOR DELETE
    USING (auth.uid() = user_id);

-- USAGE_LOGS policies
CREATE POLICY "Users can view own usage logs"
    ON public.usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
    ON public.usage_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE on usage logs (immutable audit trail)

-- PROJECTS policies
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- PROJECT_ASSETS policies
CREATE POLICY "Users can view own assets"
    ON public.project_assets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
    ON public.project_assets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
    ON public.project_assets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
    ON public.project_assets FOR DELETE
    USING (auth.uid() = user_id);

-- USAGE_DAILY_AGGREGATES policies
CREATE POLICY "Users can view own aggregates"
    ON public.usage_daily_aggregates FOR SELECT
    USING (auth.uid() = user_id);

-- System-only insert/update for aggregates (via service role)

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily usage counters
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.api_credentials
    SET current_day_usage = 0, updated_at = NOW()
    WHERE current_day_usage > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage counters
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.api_credentials
    SET current_month_usage = 0, updated_at = NOW()
    WHERE EXTRACT(DAY FROM NOW()) = usage_reset_day
    AND current_month_usage > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate daily usage
CREATE OR REPLACE FUNCTION aggregate_daily_usage(target_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void AS $$
BEGIN
    INSERT INTO public.usage_daily_aggregates (
        user_id, date, provider, environment,
        total_requests, successful_requests, failed_requests,
        total_tokens, total_cost_cents, avg_latency_ms, images_generated
    )
    SELECT 
        user_id,
        target_date,
        provider,
        environment,
        COUNT(*),
        COUNT(*) FILTER (WHERE success = true),
        COUNT(*) FILTER (WHERE success = false),
        SUM(total_tokens),
        SUM(cost_cents),
        AVG(latency_ms)::INTEGER,
        SUM(images_generated)
    FROM public.usage_logs
    WHERE created_at >= target_date AND created_at < target_date + INTERVAL '1 day'
    GROUP BY user_id, provider, environment
    ON CONFLICT (user_id, date, provider, environment)
    DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        successful_requests = EXCLUDED.successful_requests,
        failed_requests = EXCLUDED.failed_requests,
        total_tokens = EXCLUDED.total_tokens,
        total_cost_cents = EXCLUDED.total_cost_cents,
        avg_latency_ms = EXCLUDED.avg_latency_ms,
        images_generated = EXCLUDED.images_generated,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or API)
-- ============================================================

-- Note: Execute these via Supabase dashboard or management API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.api_credentials IS 'Encrypted API credentials per provider/environment';
COMMENT ON TABLE public.usage_logs IS 'Detailed usage tracking for all AI requests';
COMMENT ON TABLE public.projects IS 'User workspaces/projects';
COMMENT ON TABLE public.project_assets IS 'Files and generated content within projects';
COMMENT ON TABLE public.usage_daily_aggregates IS 'Pre-computed daily usage summaries';
