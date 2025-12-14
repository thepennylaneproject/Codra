/**
 * PHASE 3: Secure Credential Management - SQL Migration
 * 
 * This migration updates the api_credentials table from Phase 2
 * to support encrypted key storage and quota tracking
 * 
 * Run this in Supabase SQL Editor after Phase 2 is deployed
 */

-- ============================================================
-- Update api_credentials table with encryption & quota fields
-- ============================================================

-- Add encryption fields to api_credentials (if not already present from Phase 2)
ALTER TABLE public.api_credentials
ADD COLUMN IF NOT EXISTS encrypted_key JSONB,
ADD COLUMN IF NOT EXISTS encrypted_secret JSONB,
ADD COLUMN IF NOT EXISTS masked_key TEXT,
ADD COLUMN IF NOT EXISTS monthly_limit INTEGER,
ADD COLUMN IF NOT EXISTS daily_limit INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS test_status TEXT CHECK (test_status IN ('success', 'failed', 'unknown'));

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_credentials_provider_env 
  ON public.api_credentials(user_id, provider, environment);

CREATE INDEX IF NOT EXISTS idx_api_credentials_is_active 
  ON public.api_credentials(is_active, user_id);

CREATE INDEX IF NOT EXISTS idx_api_credentials_test_status 
  ON public.api_credentials(test_status);

-- ============================================================
-- Create quota_alerts table for threshold notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quota_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL REFERENCES public.api_credentials(id) ON DELETE CASCADE,
    
    -- Alert settings
    threshold_percentage INTEGER NOT NULL CHECK (threshold_percentage > 0 AND threshold_percentage <= 100),
    notify_email BOOLEAN DEFAULT true,
    notify_in_app BOOLEAN DEFAULT true,
    
    -- Alert state
    last_triggered_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quota_alerts_credential 
  ON public.quota_alerts(credential_id);

CREATE INDEX IF NOT EXISTS idx_quota_alerts_user 
  ON public.quota_alerts(user_id, is_active);

-- ============================================================
-- Create credential_audit_log table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.credential_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credential_id UUID REFERENCES public.api_credentials(id) ON DELETE SET NULL,
    
    -- Audit event
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'tested', 'rotated', 'deleted')),
    details JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credential_audit_log_user 
  ON public.credential_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credential_audit_log_credential 
  ON public.credential_audit_log(credential_id);

-- ============================================================
-- Update RLS policies for api_credentials
-- ============================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Users can create own credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.api_credentials;

-- Create new policies
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

-- ============================================================
-- RLS for quota_alerts
-- ============================================================

ALTER TABLE public.quota_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota alerts"
  ON public.quota_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quota alerts"
  ON public.quota_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quota alerts"
  ON public.quota_alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quota alerts"
  ON public.quota_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS for credential_audit_log
-- ============================================================

ALTER TABLE public.credential_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON public.credential_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Audit log is write-only from backend functions
DROP POLICY IF EXISTS "Only backend can create audit logs" ON public.credential_audit_log;

-- ============================================================
-- Function to update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_api_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_credentials_updated_at
    BEFORE UPDATE ON public.api_credentials
    FOR EACH ROW EXECUTE FUNCTION update_api_credentials_updated_at();

-- ============================================================
-- Helper function to get quota usage for a credential
-- ============================================================

CREATE OR REPLACE FUNCTION get_credential_quota(
  p_credential_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  requests_count BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  month_start DATE,
  month_end DATE
) AS $$
DECLARE
  v_month_start DATE;
  v_month_end DATE;
BEGIN
  -- Get current month boundaries
  v_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Return usage stats
  RETURN QUERY
  SELECT
    COALESCE(SUM(ul.requests), 0)::BIGINT,
    COALESCE(SUM(ul.total_tokens), 0)::BIGINT,
    COALESCE(SUM(ul.cost_cents) / 100.0, 0)::NUMERIC,
    v_month_start,
    v_month_end
  FROM public.usage_logs ul
  WHERE ul.credential_id = p_credential_id
    AND ul.user_id = p_user_id
    AND ul.created_at::DATE >= v_month_start
    AND ul.created_at::DATE <= v_month_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Grant permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION get_credential_quota TO authenticated;
GRANT SELECT ON TABLE public.api_credentials TO authenticated;
GRANT SELECT ON TABLE public.quota_alerts TO authenticated;
GRANT SELECT ON TABLE public.credential_audit_log TO authenticated;
