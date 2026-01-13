/**
 * Credentials Adapter - ADAPTED FOR EXISTING SCHEMA
 * Updated to use correct column names from your Supabase tables
 */

import { supabase } from '@/lib/supabase';
import type {
  ApiCredential,
  CreateCredentialRequest,
  CreateCredentialResponse,
  CredentialTestResult,
  QuotaStats,
  RotateCredentialResult,
  CredentialFilter,
} from './types';

const API_BASE = '/api';

/**
 * Credentials adapter - updated for your schema
 */
export const credentialsAdapter = {
  /**
   * Create a new API credential
   */
  async createCredential(
    request: CreateCredentialRequest
  ): Promise<CreateCredentialResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call Netlify function via proxy
      const response = await fetch(`${API_BASE}/credentials/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          user_id: user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create credential');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  },

  /**
   * Get all credentials for current user
   */
  async getCredentials(filter?: CredentialFilter): Promise<ApiCredential[]> {
    try {
      let query = supabase.from('api_credentials').select('*');

      if (filter?.provider) {
        query = query.eq('provider', filter.provider);
      }
      if (filter?.environment) {
        query = query.eq('environment', filter.environment);
      }
      if (filter?.is_active !== undefined) {
        query = query.eq('is_active', filter.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ApiCredential[];
    } catch (error) {
      console.error('Error fetching credentials:', error);
      throw error;
    }
  },

  /**
   * Get a specific credential
   */
  async getCredential(credentialId: string): Promise<ApiCredential> {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('id', credentialId)
        .single();

      if (error) throw error;
      return data as ApiCredential;
    } catch (error) {
      console.error('Error fetching credential:', error);
      throw error;
    }
  },

  /**
   * Update credential metadata
   */
  async updateCredential(
    credentialId: string,
    updates: Partial<Pick<ApiCredential, 'is_active' | 'label' | 'notes' | 'monthly_limit' | 'daily_limit' | 'alert_threshold_warning' | 'alert_threshold_critical'>>
  ): Promise<ApiCredential> {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .update(updates)
        .eq('id', credentialId)
        .select()
        .single();

      if (error) throw error;
      return data as ApiCredential;
    } catch (error) {
      console.error('Error updating credential:', error);
      throw error;
    }
  },

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  },

  /**
   * Test a credential
   */
  async testCredential(credentialId: string): Promise<CredentialTestResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE}/credentials/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ credential_id: credentialId })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || result.error || 'Test failed',
          provider: result.provider || 'unknown',
          testedAt: new Date(),
          responseTime: result.responseTime || 0
        };
      }

      return {
        success: result.success,
        message: result.message,
        provider: result.provider,
        testedAt: new Date(result.testedAt),
        responseTime: result.responseTime || 0
      };
    } catch (error) {
      console.error('Error testing credential:', error);
      throw error;
    }
  },

  /**
   * Rotate a credential
   */
  async rotateCredential(
    credentialId: string,
    newApiKey: string
  ): Promise<RotateCredentialResult> {
    try {
      const response = await fetch(`${API_BASE}/credentials/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: credentialId,
          new_api_key: newApiKey
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to rotate credential');
      }

      return response.json();
    } catch (error) {
      console.error('Error rotating credential:', error);
      throw error;
    }
  },

  /**
   * Get usage statistics
   */
  async getUsage(credentialId: string): Promise<QuotaStats> {
    try {
      // Get credential info
      const credential = await this.getCredential(credentialId);

      // Calculate percentages
      const monthlyPercentage = credential.monthly_limit
        ? (credential.current_month_usage / credential.monthly_limit) * 100
        : 0;
      const dailyPercentage = credential.daily_limit
        ? (credential.current_day_usage / credential.daily_limit) * 100
        : 0;

      // Determine status
      let status: 'ok' | 'warning' | 'exceeded' = 'ok';
      if (monthlyPercentage >= 100 || dailyPercentage >= 100) {
        status = 'exceeded';
      } else if (monthlyPercentage >= credential.alert_threshold_critical ||
        dailyPercentage >= credential.alert_threshold_critical) {
        status = 'warning';
      }

      // Get alerts
      const { data: alerts = [] } = await supabase
        .from('usage_alerts')
        .select('*')
        .eq('credential_id', credentialId);

      return {
        credential_id: credentialId,
        provider: credential.provider,
        environment: credential.environment,
        monthly_limit: credential.monthly_limit,
        monthly_usage: credential.current_month_usage,
        monthly_percentage: monthlyPercentage,
        daily_limit: credential.daily_limit,
        daily_usage: credential.current_day_usage,
        daily_percentage: dailyPercentage,
        remaining: Math.max(0, credential.monthly_limit - credential.current_month_usage),
        status,
        alerts: alerts as any[]
      };
    } catch (error) {
      console.error('Error getting usage:', error);
      throw error;
    }
  },

  /**
   * Record usage (called after API requests)
   */
  async recordUsage(
    credentialId: string,
    usage: { requestCount: number; tokenCount: number; cost: number }
  ): Promise<void> {
    try {
      // Update monthly and daily usage on api_credentials
      const { data: credential } = await supabase
        .from('api_credentials')
        .select('current_month_usage, current_day_usage')
        .eq('id', credentialId)
        .single();

      if (credential) {
        await supabase
          .from('api_credentials')
          .update({
            current_month_usage: (credential.current_month_usage || 0) + usage.requestCount,
            current_day_usage: (credential.current_day_usage || 0) + usage.requestCount,
            last_used_at: new Date().toISOString()
          })
          .eq('id', credentialId);
      }

      // Also record in credential_usage for historical tracking
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      await supabase
        .from('credential_usage')
        .upsert({
          credential_id: credentialId,
          billing_cycle_start: startOfMonth,
          billing_cycle_end: endOfMonth,
          request_count: (usage.requestCount || 0),
          token_count: (usage.tokenCount || 0),
          estimated_cost: (usage.cost || 0)
        }, {
          onConflict: 'credential_id,billing_cycle_start,billing_cycle_end'
        });
    } catch (error) {
      console.error('Error recording usage:', error);
      // Don't throw - usage tracking shouldn't break the request
    }
  },

  /**
   * Check quota alerts
   */
  async checkQuotaAlerts(credentialId: string): Promise<QuotaStats> {
    return this.getUsage(credentialId);
  }
};

export type CredentialsAdapter = typeof credentialsAdapter;