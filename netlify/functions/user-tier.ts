// ============================================================
// USER TIER API - Netlify Function
// netlify/functions/user-tier.ts
// Returns user tier and usage data for feature gating
// ============================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate env vars
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables');
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Response helper
const response = (statusCode: number, body: object) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
    },
    body: JSON.stringify(body),
});

// Extract and verify JWT from Authorization header
async function verifyAuth(event: HandlerEvent): Promise<{ userId: string } | null> {
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            console.error('JWT verification failed:', error);
            return null;
        }

        return { userId: user.id };
    } catch (err) {
        console.error('Auth verification error:', err);
        return null;
    }
}

// Tier type
type UserTier = 'free' | 'pro' | 'team';

// Feature limits by tier
const TIER_LIMITS = {
    free: { projects: 1, coherenceScanPerMonth: 0, taskExecutionEnabled: false },
    pro: { projects: 10, coherenceScanPerMonth: 5, taskExecutionEnabled: true },
    team: { projects: Infinity, coherenceScanPerMonth: Infinity, taskExecutionEnabled: true },
} as const;

// ============================================================
// Main Handler
// ============================================================
export const handler: Handler = async (event: HandlerEvent) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return response(200, {});
    }

    // Only allow GET
    if (event.httpMethod !== 'GET') {
        return response(405, { error: 'Method not allowed' });
    }

    // Verify authentication
    const auth = await verifyAuth(event);
    if (!auth) {
        return response(401, { error: 'Unauthorized' });
    }

    const { userId } = auth;

    try {
        // Get user profile with plan
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('plan')
            .eq('id', userId)
            .single();

        // Normalize tier (map enterprise to team, handle legacy values)
        let tier: UserTier = 'free';
        
        if (profileError) {
            if (profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError);
                return response(500, { error: 'Failed to fetch user profile' });
            }
            // If missing (PGRST116), just stay on 'free' tier
        } else {
            const rawPlan = profile?.plan || 'free';
            if (rawPlan === 'pro' || rawPlan === 'starter') {
                tier = 'pro';
            } else if (rawPlan === 'team' || rawPlan === 'enterprise' || rawPlan === 'agency') {
                tier = 'team';
            }
        }

        // Get project count
        const { count: projectCount, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'active');

        if (projectError) {
            console.error('Error counting projects:', projectError);
        }

        // Get coherence scan usage for current month
        const { data: scanUsage } = await supabaseAdmin
            .rpc('get_feature_usage', {
                p_user_id: userId,
                p_feature: 'coherence_scan',
            });

        const limits = TIER_LIMITS[tier];

        return response(200, {
            tier,
            projectCount: projectCount || 0,
            projectLimit: limits.projects === Infinity ? 'unlimited' : limits.projects,
            coherenceScanUsage: scanUsage || 0,
            coherenceScanLimit: limits.coherenceScanPerMonth === Infinity ? 'unlimited' : limits.coherenceScanPerMonth,
            taskExecutionEnabled: limits.taskExecutionEnabled,
        });
    } catch (err) {
        console.error('Handler error:', err);
        return response(500, { error: 'Internal server error' });
    }
};
