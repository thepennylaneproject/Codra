/**
 * Admin Usage & Costs Endpoint
 * 
 * GET /api/admin-usage?period={7d|30d|90d}&workspace_id=...
 * Returns aggregated usage and cost analytics from telemetry tables
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../utils/admin-auth';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
};

interface RunsPerDay {
    date: string;
    count: number;
}

interface CostPerDay {
    date: string;
    cost: number;
}

interface ProviderShare {
    provider: string;
    count: number;
    cost: number;
}

interface LatestRun {
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

export const handler: Handler = async (event) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Require admin authorization
        await requireAdmin(event);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const params = event.queryStringParameters || {};
        const period = params.period || '7d';
        const workspaceId = params.workspace_id;

        // Calculate date range
        let daysAgo: number;
        switch (period) {
            case '7d':
                daysAgo = 7;
                break;
            case '30d':
                daysAgo = 30;
                break;
            case '90d':
                daysAgo = 90;
                break;
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid period. Must be 7d, 30d, or 90d' }),
                };
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        const startDateStr = startDate.toISOString();

        // Build base query
        let aiRunsQuery = supabase
            .from('ai_runs')
            .select('*')
            .gte('created_at', startDateStr);

        if (workspaceId) {
            aiRunsQuery = aiRunsQuery.eq('workspace_id', workspaceId);
        }

        const { data: aiRuns, error: aiRunsError } = await aiRunsQuery;

        if (aiRunsError) {
            console.error('Error fetching AI runs:', aiRunsError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to fetch usage data' }),
            };
        }

        // Aggregate data
        const runsPerDay: Record<string, number> = {};
        const costPerDay: Record<string, number> = {};
        const providerStats: Record<string, { count: number; cost: number }> = {};

        aiRuns?.forEach((run) => {
            const date = new Date(run.created_at).toISOString().split('T')[0];

            // Runs per day
            runsPerDay[date] = (runsPerDay[date] || 0) + 1;

            // Cost per day
            const cost = run.actual_cost_usd || 0;
            costPerDay[date] = (costPerDay[date] || 0) + cost;

            // Provider stats
            const provider = run.provider_id;
            if (!providerStats[provider]) {
                providerStats[provider] = { count: 0, cost: 0 };
            }
            providerStats[provider].count += 1;
            providerStats[provider].cost += cost;
        });

        // Format runs per day
        const runsPerDayArray: RunsPerDay[] = Object.entries(runsPerDay).map(([date, count]) => ({
            date,
            count,
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Format cost per day
        const costPerDayArray: CostPerDay[] = Object.entries(costPerDay).map(([date, cost]) => ({
            date,
            cost: parseFloat(cost.toFixed(6)),
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Format provider share
        const providerShareArray: ProviderShare[] = Object.entries(providerStats).map(([provider, stats]) => ({
            provider,
            count: stats.count,
            cost: parseFloat(stats.cost.toFixed(6)),
        })).sort((a, b) => b.cost - a.cost);

        // Get latest runs (top 50)
        const latestRunsQuery = supabase
            .from('ai_runs')
            .select('id, created_at, task_type, provider_id, model_id, actual_cost_usd, latency_ms, success, sources_count, error_code, error_message_safe, trace_json')
            .order('created_at', { ascending: false })
            .limit(50);

        const { data: latestRunsData, error: latestRunsError } = workspaceId
            ? await latestRunsQuery.eq('workspace_id', workspaceId)
            : await latestRunsQuery;

        if (latestRunsError) {
            console.error('Error fetching latest runs:', latestRunsError);
        }

        const latestRuns: LatestRun[] = (latestRunsData || []).map(run => ({
            id: run.id,
            created_at: run.created_at,
            task_type: run.task_type,
            provider_id: run.provider_id,
            model_id: run.model_id,
            actual_cost_usd: run.actual_cost_usd || 0,
            latency_ms: run.latency_ms || 0,
            success: run.success,
            sources_count: run.sources_count || 0,
            error_code: run.error_code,
            error_message_safe: run.error_message_safe,
            trace_json: run.trace_json,
        }));

        // Calculate totals
        const totalRuns = aiRuns?.length || 0;
        const totalCost = aiRuns?.reduce((sum, run) => sum + (run.actual_cost_usd || 0), 0) || 0;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                period,
                runsPerDay: runsPerDayArray,
                costPerDay: costPerDayArray,
                providerShare: providerShareArray,
                latestRuns,
                totalRuns,
                totalCost: parseFloat(totalCost.toFixed(6)),
            }),
        };

    } catch (error: any) {
        console.error('Admin usage error:', error);

        // Check if it's an auth error
        if (error.message?.includes('Unauthorized') || error.message?.includes('authorization')) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Forbidden: Admin access required' }),
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
