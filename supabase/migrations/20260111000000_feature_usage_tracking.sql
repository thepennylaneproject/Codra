-- ============================================================
-- FEATURE USAGE TRACKING
-- Track monthly usage of gated features per user
-- Migration: 20260111_feature_usage_tracking.sql
-- ============================================================

-- Feature usage tracking table for tier limits
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feature TEXT NOT NULL CHECK (feature IN ('coherence_scan', 'task_execution')),
    period_start DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature, period_start)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON public.feature_usage(period_start);

-- Auto-update timestamp trigger
CREATE TRIGGER feature_usage_updated_at
    BEFORE UPDATE ON public.feature_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own feature usage"
    ON public.feature_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own usage (system will update via service role)
CREATE POLICY "Users can insert own feature usage"
    ON public.feature_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current month's usage for a feature
CREATE OR REPLACE FUNCTION get_feature_usage(
    p_user_id UUID,
    p_feature TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_usage INTEGER;
BEGIN
    SELECT usage_count INTO v_usage
    FROM public.feature_usage
    WHERE user_id = p_user_id
      AND feature = p_feature
      AND period_start = DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    RETURN COALESCE(v_usage, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment feature usage (called by backend)
CREATE OR REPLACE FUNCTION increment_feature_usage(
    p_user_id UUID,
    p_feature TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    INSERT INTO public.feature_usage (user_id, feature, period_start, usage_count)
    VALUES (p_user_id, p_feature, DATE_TRUNC('month', CURRENT_DATE)::DATE, 1)
    ON CONFLICT (user_id, feature, period_start)
    DO UPDATE SET 
        usage_count = feature_usage.usage_count + 1,
        updated_at = NOW()
    RETURNING usage_count INTO v_new_count;
    
    RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get project count for a user
CREATE OR REPLACE FUNCTION get_user_project_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.projects
    WHERE user_id = p_user_id
      AND status = 'active';
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.feature_usage IS 'Tracks monthly usage of gated features per user for tier enforcement';
