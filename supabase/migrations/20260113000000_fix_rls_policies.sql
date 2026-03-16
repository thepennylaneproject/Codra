/**
 * Fix RLS Policies for Credential Management Tables
 * 
 * Addresses Supabase security linter warnings by ensuring RLS is properly
 * enabled on credential_quotas, credential_usage, usage_alerts, and audit_logs.
 * 
 * This migration is idempotent - safe to run even if RLS is already enabled.
 */

-- ============================================================================
-- CREDENTIAL_QUOTAS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.credential_quotas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see quotas for their credentials" ON public.credential_quotas;
DROP POLICY IF EXISTS "Users can manage quotas for their credentials" ON public.credential_quotas;
DROP POLICY IF EXISTS "Users can update quotas for their credentials" ON public.credential_quotas;
DROP POLICY IF EXISTS "Users can delete quotas for their credentials" ON public.credential_quotas;

-- Recreate policies
CREATE POLICY "Users can see quotas for their credentials"
  ON public.credential_quotas
  FOR SELECT
  USING (
    credential_id IN (
      SELECT id FROM public.api_credentials
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage quotas for their credentials"
  ON public.credential_quotas
  FOR INSERT
  WITH CHECK (
    credential_id IN (
      SELECT id FROM public.api_credentials
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quotas for their credentials"
  ON public.credential_quotas
  FOR UPDATE
  USING (
    credential_id IN (
      SELECT id FROM public.api_credentials
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quotas for their credentials"
  ON public.credential_quotas
  FOR DELETE
  USING (
    credential_id IN (
      SELECT id FROM public.api_credentials
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CREDENTIAL_USAGE TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.credential_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see usage for their credentials" ON public.credential_usage;
DROP POLICY IF EXISTS "Netlify Functions can record usage" ON public.credential_usage;
DROP POLICY IF EXISTS "Netlify Functions can update usage" ON public.credential_usage;

-- Recreate policies
CREATE POLICY "Users can see usage for their credentials"
  ON public.credential_usage
  FOR SELECT
  USING (
    credential_id IN (
      SELECT id FROM public.api_credentials
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Netlify Functions can record usage"
  ON public.credential_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Netlify Functions can update usage"
  ON public.credential_usage
  FOR UPDATE
  USING (true);

-- ============================================================================
-- USAGE_ALERTS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see alerts for their credentials" ON public.usage_alerts;
DROP POLICY IF EXISTS "Users can acknowledge alerts" ON public.usage_alerts;
DROP POLICY IF EXISTS "Netlify Functions can create alerts" ON public.usage_alerts;

-- Recreate policies
CREATE POLICY "Users can see alerts for their credentials"
  ON public.usage_alerts
  FOR SELECT
  USING (
    credential_id IN (
      SELECT id FROM public.api_credentials
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can acknowledge alerts"
  ON public.usage_alerts
  FOR UPDATE
  USING (
    credential_id IN (
      SELECT id FROM public.api_credentials
      WHERE user_id = auth.uid()
    )
  );

-- Allow Netlify Functions to insert alerts
CREATE POLICY "Netlify Functions can create alerts"
  ON public.usage_alerts
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- AUDIT_LOGS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- Recreate policies
CREATE POLICY "Users can see their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);
