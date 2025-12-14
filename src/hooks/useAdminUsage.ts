/**
 * useAdminUsage Hook
 * 
 * Fetches usage and cost analytics from telemetry data.
 * Provides time-series data for charts and detailed run information.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RunsPerDay {
    date: string;
    count: number;
}

export interface CostPerDay {
    date: string;
    cost: number;
}

export interface ProviderShare {
    provider: string;
    count: number;
    cost: number;
}

export interface LatestRun {
    id: string;
    created_at: string;
    task_type: string;
    provider_id: string;
    model_id: string;
    actual_cost_usd: number;
    latency_ms: number;
    success: boolean;
    sources_count: number;
    error_code?: string;
    error_message_safe?: string;
    trace_json?: any;
}

export interface UsageData {
    period: string;
    runsPerDay: RunsPerDay[];
    costPerDay: CostPerDay[];
    providerShare: ProviderShare[];
    latestRuns: LatestRun[];
    totalRuns: number;
    totalCost: number;
}

async function fetchUsageData(
    period: '7d' | '30d' | '90d',
    workspaceId?: string
): Promise<UsageData> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('No active session');
    }

    const params = new URLSearchParams({ period });
    if (workspaceId) {
        params.append('workspace_id', workspaceId);
    }

    const response = await fetch(
        `/.netlify/functions/api/admin-usage?${params.toString()}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch usage data');
    }

    return response.json();
}

export function useAdminUsage(period: '7d' | '30d' | '90d' = '7d', workspaceId?: string) {
    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery<UsageData>({
        queryKey: ['admin-usage', period, workspaceId],
        queryFn: () => fetchUsageData(period, workspaceId),
        staleTime: 60 * 1000, // 1 minute
    });

    return {
        runsPerDay: data?.runsPerDay || [],
        costPerDay: data?.costPerDay || [],
        providerShare: data?.providerShare || [],
        latestRuns: data?.latestRuns || [],
        totalRuns: data?.totalRuns || 0,
        totalCost: data?.totalCost || 0,
        isLoading,
        error,
        refetch,
    };
}
