import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { bundleId } = event.queryStringParameters || {};
    if (!bundleId) {
        return { statusCode: 400, body: 'Missing bundleId' };
    }

    try {
        // Fetch Bundle
        const { data: bundle, error: bundleError } = await supabase
            .from('asset_bundles')
            .select('*')
            .eq('id', bundleId)
            .single();

        if (bundleError || !bundle) {
            return { statusCode: 404, body: 'Bundle not found' };
        }

        // Fetch Assets
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

        // Construct Manifest
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
            body: JSON.stringify(manifest)
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
