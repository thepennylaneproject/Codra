// ============================================================
// CODRA SPREAD SAVE - Netlify Function
// netlify/functions/spread-save.ts
// Handles version-based conflict detection for spread saves
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
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

// Auth verification helper
async function verifyAuth(event: HandlerEvent): Promise<{ userId: string } | null> {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.replace('Bearer ', '');
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return { userId: user.id };
    } catch (err) {
        return null;
    }
}

// ============================================================
// Main Handler
// ============================================================
export const handler: Handler = async (event: HandlerEvent) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return response(200, {});
    }

    // Only allow PUT
    if (event.httpMethod !== 'PUT') {
        return response(405, { error: 'Method not allowed' });
    }

    // Verify authentication
    const auth = await verifyAuth(event);
    if (!auth) {
        return response(401, { error: 'Unauthorized' });
    }

    const { userId } = auth;

    try {
        if (!event.body) {
            return response(400, { error: 'Request body required' });
        }

        const { projectId, spreadId, data, version: clientVersion, force } = JSON.parse(event.body);

        if (!projectId || !spreadId || !data) {
            return response(400, { error: 'Missing required fields: projectId, spreadId, or data' });
        }

        // 1. Fetch current version from database
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('spreads')
            .select('version, sections, toc, lyra_state')
            .eq('id', spreadId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is not found
            console.error('Fetch error:', fetchError);
            return response(500, { error: 'Failed to fetch existing spread' });
        }

        const serverVersion = existing?.version || 0;

        // 2. Conflict Detection Logic
        // Skip check if force is true OR if this is a new spread (serverVersion 0)
        if (!force && serverVersion > 0 && clientVersion !== serverVersion) {
            return response(409, {
                error: 'Conflict detected',
                serverVersion,
                serverData: {
                    sections: existing.sections,
                    toc: existing.toc,
                    lyra_state: existing.lyra_state,
                }
            });
        }

        // 3. Apply Update
        const nextVersion = serverVersion + 1;
        const dbRow = {
            project_id: projectId,
            user_id: userId,
            sections: data.sections,
            toc: data.toc,
            lyra_state: data.lyraState || data.lyra_state,
            version: nextVersion,
            last_modified_by: userId,
            last_modified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data: updated, error: upsertError } = await supabaseAdmin
            .from('spreads')
            .upsert(dbRow, { onConflict: 'project_id' })
            .select('version, updated_at')
            .single();

        if (upsertError) {
            console.error('Upsert error:', upsertError);
            return response(500, { error: 'Failed to save spread' });
        }

        return response(200, {
            success: true,
            version: updated.version,
            updatedAt: updated.updated_at
        });

    } catch (err) {
        console.error('Handler error:', err);
        return response(500, { error: 'Internal server error' });
    }
};
