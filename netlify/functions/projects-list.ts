// ============================================================
// CODRA PROJECT LIST - Netlify Function
// netlify/functions/projects-list.ts
// List projects for the authenticated user (supports both schemas)
// ============================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

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

const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const response = (statusCode: number, body: object) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
    },
    body: JSON.stringify(body),
});

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

export const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod === 'OPTIONS') {
        return response(200, {});
    }

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

    const auth = await verifyAuth(event, supabaseAdmin);
    if (!auth) {
        return response(401, { error: 'Unauthorized' });
    }

    const { userId } = auth;

    try {
        let data = null as any[] | null;
        let error = null as any;

        ({ data, error } = await supabaseAdmin
            .from('projects')
            .select('id,title,summary,domain,status,created_at,updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }));

        if (error?.code === 'PGRST204') {
            ({ data, error } = await supabaseAdmin
                .from('projects')
                .select('id,name,description,settings,status,created_at,updated_at')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false }));
        }

        if (error) {
            console.error('Error fetching projects:', error);
            return response(500, { error: 'Failed to fetch projects' });
        }

        const projects = (data || []).map((row: any) => {
            const name = row.title ?? row.name ?? 'Untitled';
            const summary = row.summary ?? row.description ?? row.settings?.projectSummary ?? '';
            const type = row.domain ?? row.settings?.projectType ?? null;
            return {
                id: row.id,
                name,
                summary,
                description: summary || undefined,
                type,
                status: row.status ?? 'active',
                createdAt: row.created_at,
                updatedAt: row.updated_at ?? row.created_at,
            };
        });

        return response(200, { projects });
    } catch (err) {
        console.error('Handler error:', err);
        return response(500, { error: 'Internal server error' });
    }
};
