import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Initialize Supabase with service key (server-side only)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Max input file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ConvertRequest {
    assetId: string;
    operation: 'resize' | 'crop' | 'convert' | 'compress' | 'thumbnail';
    params: {
        width?: number;
        height?: number;
        format?: 'jpeg' | 'png' | 'webp' | 'avif';
        quality?: number;
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
}

export const handler: Handler = async (event) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Authenticate user
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Invalid token' }),
            };
        }

        // Parse body
        const body = JSON.parse(event.body || '{}') as ConvertRequest;
        const { assetId, operation, params } = body;

        if (!assetId || !operation) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Missing assetId or operation' }),
            };
        }

        // Fetch original asset metadata
        const { data: asset, error: assetError } = await supabase
            .from('assets')
            .select('*')
            .eq('id', assetId)
            .single();

        if (assetError || !asset) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Asset not found' }),
            };
        }

        // Check access
        const { data: hasAccess } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', asset.workspace_id)
            .eq('user_id', user.id)
            .single();

        if (!hasAccess) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Access denied' }),
            };
        }

        // Download original file
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('assets')
            .download(asset.storage_path);

        if (downloadError || !fileData) {
            console.error('Download error:', downloadError);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Failed to download original asset' }),
            };
        }

        // Check size
        if (fileData.size > MAX_FILE_SIZE) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Input file too large (max 10MB)' }),
            };
        }

        // Processing with Sharp
        const buffer = await fileData.arrayBuffer();
        let pipeline = sharp(new Uint8Array(buffer)); // sharp handles array buffers via typed array
        let metadata = await pipeline.metadata();

        // Apply operations
        if (operation === 'resize' || operation === 'thumbnail') {
            pipeline = pipeline.resize({
                width: params.width || undefined,
                height: params.height || undefined,
                fit: params.fit || 'cover',
            });
        }

        // Format conversion & compression
        let format = params.format || metadata.format as keyof import('sharp').FormatEnum;
        // Default to webp for thumbnails/compress if not specified
        if (operation === 'thumbnail' || operation === 'compress') {
            if (!params.format) format = 'webp';
        }

        // Ensure format is supported
        if (!['jpeg', 'png', 'webp', 'avif'].includes(format)) {
            // Fallback to jpeg if unknown
            format = 'jpeg';
        }

        pipeline = pipeline.toFormat(format, {
            quality: params.quality || 80,
        });

        const newBuffer = await pipeline.toBuffer();
        const newMetadata = await sharp(newBuffer).metadata();

        // Upload new version
        // Path: workspace/{workspaceId}/{assetId}/{version}/filename
        // We need to get the next version number first.
        // Actually, let's use the DB function `create_asset_version` which handles version numbering safely?
        // But we need the storage path BEFORE we can upload... chicken and egg.
        // The DB function `create_asset_version` calculates the specific version number.
        // We can manually query the max version here to construct the path.

        const { data: versionData } = await supabase
            .from('asset_versions')
            .select('version')
            .eq('asset_id', assetId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

        const nextVersion = (versionData?.version || 0) + 1;

        // Construct filename
        const originalName = asset.name.substring(0, asset.name.lastIndexOf('.')) || asset.name;
        // Suffix might be nice: name_v2.webp
        const newFilename = `${originalName}_v${nextVersion}.${format}`;
        const newStoragePath = `workspace/${asset.workspace_id}/${assetId}/${nextVersion}/${newFilename}`;

        // Upload
        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(newStoragePath, newBuffer, {
                contentType: `image/${format}`,
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Failed to upload new version' }),
            };
        }

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from('assets')
            .getPublicUrl(newStoragePath);

        // Record in DB
        // Call the helper function provided in migration
        const { data: newVersionId, error: dbError } = await supabase.rpc('create_asset_version', {
            p_asset_id: assetId,
            p_storage_path: newStoragePath,
            p_public_url: publicUrlData.publicUrl,
            p_mime_type: `image/${format}`,
            p_size_bytes: newBuffer.byteLength,
            p_width: newMetadata.width,
            p_height: newMetadata.height
        });

        if (dbError) {
            console.error('DB Insert error:', dbError);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Failed to record version in database' }),
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                versionId: newVersionId,
                publicUrl: publicUrlData.publicUrl,
                width: newMetadata.width,
                height: newMetadata.height,
                sizeBytes: newBuffer.byteLength,
                mimeType: `image/${format}`
            }),
        };

    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        };
    }
};
