// ============================================================
// USER TIER API - Netlify Function
// netlify/functions/user-tier.ts
// Returns user tier and usage data for feature gating
// ============================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const createSupabaseAdmin = () => {
    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

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
async function verifyAuth(
    event: HandlerEvent,
    supabaseAdmin: ReturnType<typeof createClient>
): Promise<{ userId: string } | null> {
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

    const supabaseAdmin = createSupabaseAdmin();
    if (!supabaseAdmin) {
        return response(500, {
            error: 'Server misconfiguration',
            missing: [
                ...(supabaseUrl ? [] : ['SUPABASE_URL']),
                ...(supabaseServiceKey ? [] : ['SUPABASE_SERVICE_ROLE_KEY']),
            ],
        });
    }

    // Verify authentication
    const auth = await verifyAuth(event, supabaseAdmin);
    if (!auth) {
        return response(401, { error: 'Unauthorized' });
    }

    const { userId } = auth;

    try {
        // ARCH-004 FIX: Query subscription status to enforce downgrade on past_due
        // ARCH-017 FIX: Only default to free on PGRST116 error, fail on other errors
        
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('plan')
            .eq('id', userId)
            .single();

        // ARCH-017: Check error type before defaulting
        if (profileError) {
            if (profileError.code === 'PGRST116') {
                // Missing profile (not found) - default to free tier
                console.log(`Profile not found for user ${userId}, defaulting to free tier`);
            } else {
                // Other error (e.g., RLS policy, network) - return error
                console.error('Error fetching profile:', profileError);
                return response(500, { error: 'Failed to fetch user profile' });
            }
        }

        // Get subscription status
        const { data: subscription, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('status, plan_id')
            .eq('user_id', userId)
            .single();

        // Normalize tier (map variants to standard tiers)
        let tier: UserTier = 'free';
        
        if (subscription && !subError) {
            // ARCH-004: Check subscription status
            const status = subscription.status;
            const planId = subscription.plan_id;

            // Downgrade to free if subscription is not active
            if (status === 'past_due' || status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
                console.log(`User ${userId} subscription status is ${status}, downgrading to free tier`);
                tier = 'free';
            } else {
                // Active subscription - use plan_id
                if (planId === 'pro' || planId === 'starter') {
                    tier = 'pro';
                } else if (planId === 'team' || planId === 'enterprise' || planId === 'agency') {
                    tier = 'team';
                } else {
                    tier = 'free';
                }
            }
        } else if (profile) {
            // Fallback to profile.plan if no subscription record
            const rawPlan = profile.plan || 'free';
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
