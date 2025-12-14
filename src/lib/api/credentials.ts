/**
 * Credentials Adapter for Codra
 * Handles secure API key storage, retrieval, testing, and quota management
 * All sensitive operations go through Netlify Functions (server-side)
 */

import { supabase } from '@/lib/supabase';

export type AIProvider =
  | 'aimlapi'
  | 'deepseek'
  | 'gemini'
  | 'deepai'
  | 'openai'
  | 'anthropic';

export type Environment = 'development' | 'staging' | 'production';

export interface CredentialOptions {
  name?: string;
  isDefault?: boolean;
  monthlyLimit?: number;
  dailyLimit?: number;
  alertThresholds?: {
    percentage: number; // e.g., 80
    notifyEmail: boolean;
  }[];
}

export interface Credential {
  id: string;
  provider: AIProvider;
  environment: Environment;
  name?: string;
  isDefault: boolean;
  isActive: boolean;
  // Never expose the actual key to frontend
  maskedKey?: string; // Last 4 chars, e.g., "...a1b2"
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  lastTestedAt?: Date;
  testStatus?: 'success' | 'failed' | 'unknown';
}

export interface QuotaInfo {
  credentialId: string;
  provider: AIProvider;
  currentBillingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  usage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  limits: {
    monthlyLimit?: number;
    dailyLimit?: number;
  };
  percentageUsed: number;
  remainingRequests?: number;
  remainingBudget?: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
}

export interface CredentialTestResult {
  success: boolean;
  provider: AIProvider;
  message: string;
  latency?: number;
  timestamp: Date;
}

/**
 * Main Credentials Adapter
 * Frontend-facing API that calls Netlify Functions for sensitive operations
 */
export class CredentialsAdapter {
  /**
   * Create a new credential
   * Calls /api/credentials/create on Netlify (server-side encryption)
   */
  static async createCredential(
    provider: AIProvider,
    apiKey: string,
    environment: Environment,
    options?: CredentialOptions
  ): Promise<Credential> {
    try {
      // Send to Netlify Function (NOT to frontend)
      const response = await fetch('/.netlify/functions/credentials-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          apiKey, // Only sent to server!
          environment,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create credential: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.credential as Credential;
    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  /**
   * Get all credentials for user (without exposing keys)
   * Keys are never returned by this endpoint
   */
  static async getCredentials(
    environment?: Environment
  ): Promise<Credential[]> {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('id, provider, environment, name, is_default, is_active, masked_key, created_at, updated_at, last_used_at, last_tested_at, test_status')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by environment if provided
      if (environment) {
        return (data || [])
          .filter((c) => c.environment === environment)
          .map(c => ({
            id: c.id,
            provider: c.provider,
            environment: c.environment,
            name: c.name,
            isDefault: c.is_default,
            isActive: c.is_active,
            maskedKey: c.masked_key,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            lastUsedAt: c.last_used_at,
            lastTestedAt: c.last_tested_at,
            testStatus: c.test_status
          }));
      }

      return (data || []).map(this.mapFromDb);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      throw error;
    }
  }

  /**
   * Get a specific credential (without exposing key)
   */
  static async getCredential(credentialId: string): Promise<Credential> {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .select(
          'id, provider, environment, name, is_default, is_active, masked_key, created_at, updated_at, last_used_at, last_tested_at, test_status'
        )
        .eq('id', credentialId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Credential not found');

      return this.mapFromDb(data);
    } catch (error) {
      console.error('Error fetching credential:', error);
      throw error;
    }
  }

  /**
   * Update credential settings (name, limits, etc.)
   * Does NOT update the actual API key
   */
  static async updateCredential(
    credentialId: string,
    updates: Partial<CredentialOptions & { isActive?: boolean }>
  ): Promise<Credential> {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(typeof updates.isDefault === 'boolean' && {
            is_default: updates.isDefault,
          }),
          ...(typeof updates.isActive === 'boolean' && {
            is_active: updates.isActive,
          }),
          ...(updates.monthlyLimit && {
            monthly_limit: updates.monthlyLimit,
          }),
          ...(updates.dailyLimit && { daily_limit: updates.dailyLimit }),
          updated_at: new Date(),
        })
        .eq('id', credentialId)
        .select(
          'id, provider, environment, name, is_default, is_active, masked_key, created_at, updated_at, last_used_at, last_tested_at, test_status'
        )
        .single();

      if (error) throw error;
      if (!data) throw new Error('Credential not found');

      return this.mapFromDb(data);
    } catch (error) {
      console.error('Error updating credential:', error);
      throw error;
    }
  }

  /**
   * Delete a credential
   */
  static async deleteCredential(credentialId: string): Promise<void> {
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
  }

  /**
   * Test if a credential is valid
   * Calls /api/credentials/test on Netlify
   */
  static async testCredential(
    credentialId: string
  ): Promise<CredentialTestResult> {
    try {
      const response = await fetch('/.netlify/functions/credentials-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentialId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to test credential: ${response.statusText}`);
      }

      const result = await response.json();

      // Update last_tested_at in database
      await supabase
        .from('api_credentials')
        .update({
          last_tested_at: new Date(),
          test_status: result.success ? 'success' : 'failed',
        })
        .eq('id', credentialId);

      return result as CredentialTestResult;
    } catch (error) {
      console.error('Error testing credential:', error);
      return {
        success: false,
        provider: 'aimlapi', // fallback
        message: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get usage and quota information for a credential
   */
  static async getQuotaInfo(credentialId: string): Promise<QuotaInfo> {
    try {
      // Get credential info
      const credential = await this.getCredential(credentialId);

      // Get credential limits from database
      const { data: credData, error: credError } = await supabase
        .from('api_credentials')
        .select('monthly_limit, daily_limit')
        .eq('id', credentialId)
        .single();

      if (credError) throw credError;

      // Calculate current billing period
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get usage for current month
      const { data: usageData, error: usageError } = await supabase
        .from('usage_logs')
        .select('requests, total_tokens, cost_cents')
        .eq('credential_id', credentialId)
        .gte('created_at', currentMonthStart.toISOString())
        .lte('created_at', currentMonthEnd.toISOString());

      if (usageError) throw usageError;

      // Calculate totals
      const totalRequests =
        usageData?.reduce((sum: number, log: any) => sum + (log.requests || 0), 0) || 0;
      const totalTokens =
        usageData?.reduce((sum: number, log: any) => sum + (log.total_tokens || 0), 0) || 0;
      const totalCostCents =
        usageData?.reduce((sum: number, log: any) => sum + (log.cost_cents || 0), 0) || 0;

      // Determine quota status
      const monthlyLimit = credData?.monthly_limit;
      const percentageUsed = monthlyLimit
        ? Math.round((totalRequests / monthlyLimit) * 100)
        : 0;

      let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';
      if (percentageUsed >= 100) status = 'exceeded';
      else if (percentageUsed >= 95) status = 'critical';
      else if (percentageUsed >= 80) status = 'warning';

      return {
        credentialId,
        provider: credential.provider,
        currentBillingPeriod: {
          startDate: currentMonthStart,
          endDate: currentMonthEnd,
        },
        usage: {
          requests: totalRequests,
          tokens: totalTokens,
          cost: totalCostCents / 100, // Convert cents to dollars
        },
        limits: {
          monthlyLimit: credData?.monthly_limit,
          dailyLimit: credData?.daily_limit,
        },
        percentageUsed,
        remainingRequests: monthlyLimit
          ? Math.max(0, monthlyLimit - totalRequests)
          : undefined,
        remainingBudget: undefined, // Could implement budget-based limits
        status,
      };
    } catch (error) {
      console.error('Error getting quota info:', error);
      throw error;
    }
  }

  /**
   * Rotate an API key (replace with new one)
   * Calls /api/credentials/rotate on Netlify
   */
  static async rotateKey(
    credentialId: string,
    newApiKey: string
  ): Promise<Credential> {
    try {
      const response = await fetch('/.netlify/functions/credentials-rotate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId,
          newApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rotate key: ${response.statusText}`);
      }

      const data = await response.json();
      return data.credential as Credential;
    } catch (error) {
      console.error('Error rotating credential:', error);
      throw error;
    }
  }

  /**
   * Get all usage logs for a credential
   */
  static async getUsageLogs(
    credentialId: string,
    dateRange?: {
      startDate: Date;
      endDate: Date;
    }
  ) {
    try {
      let query = supabase
        .from('usage_logs')
        .select(
          'id, model, request_type, requests, total_tokens, cost_cents, latency_ms, success, created_at'
        )
        .eq('credential_id', credentialId)
        .order('created_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate.toISOString())
          .lte('created_at', dateRange.endDate.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching usage logs:', error);
      throw error;
    }
  }

  // Helper: Map database fields to TypeScript interface
  private static mapFromDb(dbRecord: any): Credential {
    return {
      id: dbRecord.id,
      provider: dbRecord.provider,
      environment: dbRecord.environment,
      name: dbRecord.name,
      isDefault: dbRecord.is_default,
      isActive: dbRecord.is_active,
      maskedKey: dbRecord.masked_key,
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at),
      lastUsedAt: dbRecord.last_used_at
        ? new Date(dbRecord.last_used_at)
        : undefined,
      lastTestedAt: dbRecord.last_tested_at
        ? new Date(dbRecord.last_tested_at)
        : undefined,
      testStatus: dbRecord.test_status,
    };
  }
}
