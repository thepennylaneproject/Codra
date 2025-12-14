/**
 * Credential Management Types - ADAPTED FOR EXISTING SCHEMA
 * These types match your actual Supabase table structure
 */

export type EnvironmentType = 'dev' | 'staging' | 'prod';
export type CredentialStatus = 'active' | 'inactive' | 'error' | 'untested';
export type ProviderType = 'aimlapi' | 'deepseek' | 'gemini' | 'deepai' | 'netlify' | 'vercel' | 'github';
export type QuotaResetCycle = 'monthly' | 'daily' | 'none';

/**
 * API Credential - matches your existing api_credentials table
 */
export interface ApiCredential {
  id: string;
  user_id: string;
  provider: ProviderType; // ← Your table uses "provider" not "provider_id"
  provider_name: string;
  environment: EnvironmentType;
  encrypted_key: string;
  key_hint: string; // ← Your table uses "key_hint" not "key_hash"
  status: CredentialStatus;
  last_tested_at: string | null;
  last_error: string | null;
  monthly_limit: number;
  daily_limit: number;
  current_month_usage: number;
  current_day_usage: number;
  usage_reset_day: number;
  alert_threshold_warning: number;
  alert_threshold_critical: number;
  last_alert_sent_at: string | null;
  label: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  masked_key: string | null;
  is_active: boolean;
  last_used_at: string | null;
  test_status: string | null;
}

/**
 * Quota configuration - matches your credential_quotas table
 */
export interface CredentialQuota {
  id: string;
  credential_id: string;
  limit_type: 'requests' | 'tokens' | 'cost';
  limit_value: number;
  reset_cycle: QuotaResetCycle;
  created_at: string;
  updated_at: string;
}

/**
 * Usage tracking - matches your credential_usage table
 */
export interface CredentialUsage {
  id: string;
  credential_id: string;
  billing_cycle_start: string;
  billing_cycle_end: string;
  request_count: number;
  token_count: number;
  estimated_cost: number;
}

/**
 * Usage alert - matches your usage_alerts table
 */
export interface UsageAlert {
  id: string;
  credential_id: string;
  quota_id: string;
  threshold: number;
  current_usage: number;
  limit_value: number;
  percentage: number;
  alerted_at: string;
  acknowledged: boolean;
}

/**
 * Credential test result
 */
export interface CredentialTestResult {
  success: boolean;
  message: string;
  provider: string;
  testedAt: Date;
  responseTime: number;
}

/**
 * Request to create a credential
 */
export interface CreateCredentialRequest {
  provider: ProviderType;
  provider_name: string;
  environment: EnvironmentType;
  encrypted_key: string; // Plaintext - will be encrypted on server
  monthly_limit?: number;
  daily_limit?: number;
  alert_threshold_warning?: number;
  alert_threshold_critical?: number;
  label?: string;
  notes?: string;
}

/**
 * Response when credential is created
 */
export interface CreateCredentialResponse {
  id: string;
  provider: ProviderType;
  environment: EnvironmentType;
  key_hint: string;
  is_active: boolean;
  created_at: string;
  message: string;
}

/**
 * Quota usage stats for display
 */
export interface QuotaStats {
  credential_id: string;
  provider: string;
  environment: EnvironmentType;
  monthly_limit: number;
  monthly_usage: number;
  monthly_percentage: number;
  daily_limit: number;
  daily_usage: number;
  daily_percentage: number;
  remaining: number;
  status: 'ok' | 'warning' | 'exceeded';
  alerts: UsageAlert[];
}

/**
 * Rotation result
 */
export interface RotateCredentialResult {
  id: string;
  provider: string;
  old_key_hint: string;
  new_key_hint: string;
  rotated_at: string;
  message: string;
}

/**
 * Credential filter for queries
 */
export interface CredentialFilter {
  provider?: ProviderType;
  environment?: EnvironmentType;
  is_active?: boolean;
}