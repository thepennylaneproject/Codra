/**
 * PHASE 3: Secure Credential Management - SQL Migrations
 * 
 * Creates:
 * - api_credentials table (encrypted keys storage)
 * - credential_quotas table (usage limits)
 * - credential_usage table (usage tracking)
 * - usage_alerts table (quota alerts)
 * - audit_logs table (security audit trail)
 * 
 * All tables include RLS policies for multi-tenant security
 */

-- ============================================================================
-- API_CREDENTIALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id VARCHAR(255) NOT NULL,
  environment VARCHAR(50) NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
  encrypted_key TEXT NOT NULL,
  key_hash VARCHAR(32) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status VARCHAR(50) CHECK (test_status IN ('success', 'failed', 'untested')),
  test_error_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_credentials_user_id ON public.api_credentials(user_id);
CREATE INDEX idx_api_credentials_provider ON public.api_credentials(provider_id, environment);
CREATE INDEX idx_api_credentials_is_active ON public.api_credentials(is_active);

-- RLS Policies - api_credentials
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own credentials"
  ON public.api_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create credentials"
  ON public.api_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON public.api_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON public.api_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CREDENTIAL_QUOTAS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credential_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.api_credentials(id) ON DELETE CASCADE,
  limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN ('requests', 'tokens', 'cost')),
  limit_value NUMERIC NOT NULL CHECK (limit_value > 0),
  reset_cycle VARCHAR(50) NOT NULL CHECK (reset_cycle IN ('monthly', 'daily', 'none')),
  reset_day INTEGER CHECK (reset_day IS NULL OR (reset_day >= 1 AND reset_day <= 31)),
  alert_thresholds INTEGER[] DEFAULT ARRAY[80, 95, 100],
  alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credential_quotas_credential_id ON public.credential_quotas(credential_id);

-- RLS Policies - credential_quotas
ALTER TABLE public.credential_quotas ENABLE ROW LEVEL SECURITY;

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
-- CREDENTIAL_USAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credential_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.api_credentials(id) ON DELETE CASCADE,
  billing_cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  estimated_cost NUMERIC DEFAULT 0.00,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(credential_id, billing_cycle_start, billing_cycle_end)
);

-- Indexes
CREATE INDEX idx_credential_usage_credential_id ON public.credential_usage(credential_id);
CREATE INDEX idx_credential_usage_cycle ON public.credential_usage(billing_cycle_start, billing_cycle_end);

-- RLS Policies - credential_usage
ALTER TABLE public.credential_usage ENABLE ROW LEVEL SECURITY;

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
-- USAGE_ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.api_credentials(id) ON DELETE CASCADE,
  quota_id UUID NOT NULL REFERENCES public.credential_quotas(id) ON DELETE CASCADE,
  threshold INTEGER NOT NULL CHECK (threshold IN (80, 95, 100)),
  current_usage NUMERIC NOT NULL,
  limit_value NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  alerted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  
  UNIQUE(credential_id, quota_id, threshold, alerted_at::date)
);

-- Indexes
CREATE INDEX idx_usage_alerts_credential_id ON public.usage_alerts(credential_id);
CREATE INDEX idx_usage_alerts_acknowledged ON public.usage_alerts(acknowledged);

-- RLS Policies - usage_alerts
ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES public.api_credentials(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(255),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_credential_id ON public.audit_logs(credential_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- RLS Policies - audit_logs (read-only for users)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate billing cycle
CREATE OR REPLACE FUNCTION get_billing_cycle(
  p_reset_cycle VARCHAR,
  p_reset_day INTEGER
)
RETURNS TABLE(cycle_start TIMESTAMP WITH TIME ZONE, cycle_end TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  IF p_reset_cycle = 'monthly' THEN
    RETURN QUERY SELECT
      date_trunc('month', NOW())::TIMESTAMP WITH TIME ZONE,
      (date_trunc('month', NOW()) + INTERVAL '1 month')::TIMESTAMP WITH TIME ZONE;
  ELSIF p_reset_cycle = 'daily' THEN
    RETURN QUERY SELECT
      date_trunc('day', NOW())::TIMESTAMP WITH TIME ZONE,
      (date_trunc('day', NOW()) + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
  ELSE
    RETURN QUERY SELECT
      timestamp '1970-01-01'::TIMESTAMP WITH TIME ZONE,
      timestamp '2099-12-31'::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get current usage percentage
CREATE OR REPLACE FUNCTION get_usage_percentage(
  p_credential_id UUID,
  p_limit_value NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_current_usage NUMERIC;
BEGIN
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_usage
  FROM public.credential_usage
  WHERE credential_id = p_credential_id
    AND billing_cycle_start <= NOW()
    AND billing_cycle_end > NOW();
  
  RETURN (v_current_usage / NULLIF(p_limit_value, 0)) * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_api_credentials_updated_at
  BEFORE UPDATE ON public.api_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_credential_quotas_updated_at
  BEFORE UPDATE ON public.credential_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Note: Run these inserts after creating test users

-- Example: Create default quotas for new credentials
-- This can be called from the application when a credential is created

CREATE OR REPLACE FUNCTION create_default_quota(p_credential_id UUID)
RETURNS UUID AS $$
DECLARE
  v_quota_id UUID;
BEGIN
  INSERT INTO public.credential_quotas (
    credential_id,
    limit_type,
    limit_value,
    reset_cycle,
    alert_thresholds
  ) VALUES (
    p_credential_id,
    'requests',
    1000,
    'monthly',
    ARRAY[80, 95, 100]
  )
  RETURNING id INTO v_quota_id;
  
  RETURN v_quota_id;
END;
$$ LANGUAGE plpgsql;
