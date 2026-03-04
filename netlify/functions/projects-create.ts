// ============================================================
// CODRA PROJECT CREATE - Netlify Function
// netlify/functions/projects-create.ts
// Create a new project during onboarding
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
): Promise<{ userId: string; email: string } | null> {
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user || !user.email) {
            console.error('JWT verification failed:', error);
            return null;
        }

        return { userId: user.id, email: user.email };
    } catch (err) {
        console.error('Auth verification error:', err);
        return null;
    }
}

// Generate slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Valid project types
const VALID_PROJECT_TYPES = ['campaign', 'product', 'content', 'custom'];

// Request body interface
interface CreateProjectRequest {
    name: string;
    type: string;
    summary?: string;
}

// ============================================================
// Main Handler
// ============================================================
export const handler: Handler = async (event: HandlerEvent) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return response(200, {});
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
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

    const { userId, email } = auth;

    try {
        // Parse request body
        if (!event.body) {
            return response(400, { error: 'Request body required' });
        }

        const body: CreateProjectRequest = JSON.parse(event.body);

        // Validate required fields
        if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
            return response(400, { error: 'Project name is required' });
        }

        if (!body.type || !VALID_PROJECT_TYPES.includes(body.type)) {
            return response(400, {
                error: `Invalid project type. Must be one of: ${VALID_PROJECT_TYPES.join(', ')}`,
            });
        }

        const name = body.name.trim();
        const type = body.type;
        const summary = body.summary?.trim() || null;
        const slug = generateSlug(name);

        // ============================================================
        // TIER ENFORCEMENT - Check project limits
        // Fixed: Check subscriptions table for status (ARCH-004)
        // ============================================================
        
        // Get user profile with plan
        let { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('plan')
            .eq('id', userId)
            .single();

        // If profile is missing, create it (handles cases where trigger didn't run)
        if (profileError && profileError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    full_name: email.split('@')[0], // Fallback name
                    plan: 'free',
                })
                .select('plan')
                .single();

            if (createError) {
                console.error('Error creating missing profile:', createError);
                return response(500, { error: 'Failed to create user profile' });
            }
            
            profile = newProfile;
            profileError = null;
        } else if (profileError) {
            console.error('Error fetching profile:', profileError);
            return response(500, { error: 'Failed to verify user tier' });
        }

        // Check subscription status
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('status, plan_id')
            .eq('user_id', userId)
            .single();

        // Normalize tier (map variants to standard tiers)
        type UserTier = 'free' | 'pro' | 'team';
        let tier: UserTier = 'free';

        if (subscription && ['active', 'trialing'].includes(subscription.status)) {
            // Use subscription plan if active
            const planId = subscription.plan_id;
            if (planId === 'pro' || planId === 'starter') {
                tier = 'pro';
            } else if (planId === 'team' || planId === 'enterprise' || planId === 'agency') {
                tier = 'team';
            }
        } else if (profile) {
             // Fallback to profile.plan if no active subscription (legacy users)
             // But verify they aren't past_due in subscription table (handled above by strict status check)
             // If subscription exists but is past_due, we fell through here. 
             // Logic check: if subscription exists, we want to enforce it.
             // If subscription exists and is NOT active/trialing, we force FREE.
             // Only use profile if subscription does NOT exist.
             
             if (!subscription) {
                const rawPlan = profile.plan || 'free';
                if (rawPlan === 'pro' || rawPlan === 'starter') {
                    tier = 'pro';
                } else if (rawPlan === 'team' || rawPlan === 'enterprise' || rawPlan === 'agency') {
                    tier = 'team';
                }
             }
        }

        // Get current project count
        const { count: projectCount, error: countError } = await supabaseAdmin
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'active');

        if (countError) {
            console.error('Error counting projects:', countError);
            return response(500, { error: 'Failed to verify project count' });
        }

        // Define project limits by tier
        const PROJECT_LIMITS: Record<UserTier, number> = {
            free: 1,
            pro: 10,
            team: Infinity,
        };

        const limit = PROJECT_LIMITS[tier];
        const currentCount = projectCount || 0;

        if (currentCount >= limit) {
            console.log(`Project limit reached for user ${userId}: ${currentCount}/${limit} (tier: ${tier})`);
            return response(403, { 
                error: 'Project limit reached',
                message: tier === 'free' 
                    ? 'Free users can create 1 project. Upgrade to Pro for 10.'
                    : 'You have reached your project limit. Upgrade to Team for unlimited.',
                upgradeRequired: true,
                currentCount,
                limit: limit === Infinity ? 'unlimited' : limit,
                tier,
            });
        }

        // ============================================================
        // Insert project into database (support both schemas)
        const summaryText = summary || name;
        const projectDomainMap: Record<string, string> = {
            campaign: 'content_engine',
            product: 'saas',
            content: 'content_engine',
            custom: 'other',
        };
        const domain = projectDomainMap[type] || 'other';

        const architectPayload = {
            user_id: userId,
            title: name,
            summary: summaryText,
            domain,
            primary_goal: summaryText,
            status: 'active',
        };

        let project = null as { id: string; created_at: string } | null;
        let error = null as any;

        ({ data: project, error } = await supabaseAdmin
            .from('projects')
            .insert(architectPayload)
            .select('id, created_at')
            .single());

        // ARCH-015 FIX: Check for correct Postgres error codes for schema mismatch
        // 42P01: undefined_table, 42703: undefined_column
        if (error?.code === '42P01' || error?.code === '42703') {
            // Fallback to legacy schema
            console.log('Architect schema insert failed, falling back to legacy schema');
            ({ data: project, error } = await supabaseAdmin
                .from('projects')
                .insert({
                    user_id: userId,
                    name,
                    slug,
                    status: 'active',
                    settings: {
                        projectType: type,
                        projectSummary: summary,
                        defaultModel: 'gpt-4o',
                        defaultProvider: 'aimlapi',
                    },
                })
                .select('id, created_at')
                .single());
        }

        if (error) {
            console.error('Error creating project:', error);

            // Pattern 6: Handle Database Trigger Violation (Limit Exceeded)
            if (error.code === 'P0001') {
                return response(403, { 
                    error: 'Project limit reached (enforced by database)',
                    message: error.message || 'You have reached your project limit.',
                    upgradeRequired: true
                });
            }

            // Check for duplicate slug (legacy schema)
            if (error.code === '23505') {
                const uniqueSlug = `${slug}-${Date.now()}`;
                const { data: retryProject, error: retryError } = await supabaseAdmin
                    .from('projects')
                    .insert({
                        user_id: userId,
                        name,
                        slug: uniqueSlug,
                        status: 'active',
                        settings: {
                            projectType: type,
                            projectSummary: summary,
                            defaultModel: 'gpt-4o',
                            defaultProvider: 'aimlapi',
                        },
                    })
                    .select('id, created_at')
                    .single();

                if (retryError) {
                    // Handle trigger violation on retry too
                    if (retryError.code === 'P0001') {
                        return response(403, { 
                            error: 'Project limit reached (enforced by database)',
                            message: retryError.message,
                            upgradeRequired: true
                        });
                    }

                    console.error('Error creating project (retry):', retryError);
                    return response(500, { error: 'Failed to create project' });
                }

                return response(201, {
                    projectId: retryProject.id,
                    createdAt: retryProject.created_at,
                });
            }

            return response(500, { error: 'Failed to create project' });
        }

        return response(201, {
            projectId: project.id,
            createdAt: project.created_at,
        });
    } catch (err) {
        console.error('Handler error:', err);
        return response(500, { error: 'Internal server error' });
    }
};
