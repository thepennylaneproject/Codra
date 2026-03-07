import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const handler: Handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
    }

    // 1. Verify JWT — reject unauthenticated requests.
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    const { bundleId } = event.queryStringParameters || {};
    if (!bundleId) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing bundleId' }) };
    }

    try {
        // 2. Fetch the bundle and verify the authenticated user owns its workspace.
        const { data: bundle, error: bundleError } = await supabase
            .from('asset_bundles')
            .select('*, workspace:projects!inner(id, user_id)')
            .eq('id', bundleId)
            .single();

        if (bundleError || !bundle) {
            return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Bundle not found' }) };
        }

        // 3. Ownership check — the authenticated user must own the workspace.
        if (bundle.workspace.user_id !== user.id) {
            return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Access denied' }) };
        }

        // 4. Fetch Assets (safe: we've verified ownership above)
        const { data: assets, error: assetsError } = await supabase
            .from('assets')
            .select(`
                id, type, name, description, purpose, variant, status,
                files:asset_files(path, format, mime_type, width, height, scale),
                placements:asset_placements(kind, file, usage, symbol)
            `)
            .eq('bundle_id', bundleId)
            .is('deleted_at', null);

        if (assetsError) throw assetsError;

        // 5. Construct Manifest
        const manifest = {
            version: '1.0.0',
            bundle: {
                name: bundle.name,
                description: bundle.description,
                tags: bundle.tags
            },
            assets: assets.map(a => ({
                name: a.name,
                type: a.type,
                description: a.description,
                purpose: a.purpose,
                variant: a.variant,
                status: a.status,
                files: a.files.map((f: any) => ({
                    path: f.path,
                    format: f.format,
                    mimeType: f.mime_type,
                    width: f.width,
                    height: f.height,
                    scale: f.scale
                })),
                placements: a.placements.map((p: any) => ({
                    kind: p.kind,
                    file: p.file,
                    usage: p.usage,
                    symbol: p.symbol
                }))
            }))
        };

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(manifest)
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: error.message })
        };
    }
};
