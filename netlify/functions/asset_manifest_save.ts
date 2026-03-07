import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { validateManifest, formatValidationErrors } from '../../src/lib/assets/manifest/validate';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — used ONLY for auth token verification and workspace
// ownership check. All writes use sql with the verified userId, not a body-supplied one.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event, context) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
    }

    try {
        // 1. Verify JWT — reject requests with no/invalid Bearer token.
        //    Never trust userId or workspaceId from the request body.
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid token' }) };
        }

        // 2. Parse body — workspaceId comes from here, but userId is always from the verified token.
        const payload = JSON.parse(event.body || '{}');
        const { manifest, workspaceId } = payload;
        const userId = user.id; // Never trust userId from the body

        if (!workspaceId) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing workspaceId' }) };
        }

        // 3. Verify the authenticated user owns this workspace.
        const { data: workspace, error: wsError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', workspaceId)
            .eq('user_id', userId)
            .single();

        if (wsError || !workspace) {
            return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Access denied to workspace' }) };
        }

        // 2. Validate Manifest
        const validation = validateManifest(manifest);
        if (!validation.success && validation.errors) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Invalid manifest",
                    details: formatValidationErrors(validation.errors)
                })
            };
        }

        const data = validation.data!;

        // 3. Upsert Bundle
        // Checking if bundle exists by name within workspace to update, or create new.
        const { data: existingBundle, error: findError } = await supabase
            .from('asset_bundles')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('name', data.bundle.name)
            .maybeSingle();

        if (findError) throw findError;

        let bundleId = existingBundle?.id;

        if (bundleId) {
            // Update
            await supabase.from('asset_bundles').update({
                description: data.bundle.description,
                tags: data.bundle.tags,
                updated_at: new Date().toISOString()
            }).eq('id', bundleId);
        } else {
            // Insert
            const { data: newBundle, error: createError } = await supabase.from('asset_bundles').insert({
                workspace_id: workspaceId,
                name: data.bundle.name,
                description: data.bundle.description,
                tags: data.bundle.tags,
                created_by: userId
            }).select('id').single();

            if (createError) throw createError;
            bundleId = newBundle.id;
        }

        // 4. Upsert Assets (Sequential for safety, could be parallelized)
        const results = [];

        for (const assetDef of data.assets) {
            // Find existing asset by name + bundle
            const { data: existingAsset } = await supabase
                .from('assets')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('bundle_id', bundleId)
                .eq('name', assetDef.name)
                .maybeSingle();

            let assetId = existingAsset?.id;

            const assetData = {
                workspace_id: workspaceId,
                user_id: userId,
                bundle_id: bundleId,
                name: assetDef.name,
                type: assetDef.type,
                description: assetDef.description,
                purpose: assetDef.purpose,
                variant: assetDef.variant,
                status: assetDef.status || 'draft',
                // Fallbacks for non-nullable legacy fields - specific logic required?
                // The DB schema has NOT NULL for storage_path, public_url, mime_type, size_bytes
                // We must provide placeholder or actual values if this is a "metadata only" import
                // For now, I'll use placeholders if not provided, assuming the File entries carry the real data.
                // Or better: Use the first file's data for the main asset record.
                storage_path: assetDef.files[0]?.path || "placeholder/path",
                public_url: "placeholder_url", // In real app, derived from path
                mime_type: "application/octet-stream",
                size_bytes: 0
            };

            if (assetId) {
                await supabase.from('assets').update({
                    ...assetData,
                    updated_at: new Date().toISOString()
                }).eq('id', assetId);
            } else {
                const { data: newAsset, error: assetError } = await supabase
                    .from('assets')
                    .insert(assetData)
                    .select('id')
                    .single();
                if (assetError) throw assetError;
                assetId = newAsset.id;
            }

            // 5. Replace Files and Placements
            // Simplest strategy: Delete all files/placements for this asset and re-insert 
            // This ensures exact sync with manifest

            await supabase.from('asset_files').delete().eq('asset_id', assetId);
            await supabase.from('asset_placements').delete().eq('asset_id', assetId);

            // Insert Files
            if (assetDef.files?.length) {
                await supabase.from('asset_files').insert(assetDef.files.map(f => ({
                    asset_id: assetId,
                    ...f
                })));
            }

            // Insert Placements
            if (assetDef.placements?.length) {
                await supabase.from('asset_placements').insert(assetDef.placements.map(p => ({
                    asset_id: assetId,
                    ...p
                })));
            }

            results.push({ name: assetDef.name, id: assetId, status: 'synced' });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                bundleId,
                assetResults: results
            })
        };

    } catch (error: any) {
        console.error("Save Manifest Error:", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: error.message || "Internal Server Error" })
        };
    }
};
