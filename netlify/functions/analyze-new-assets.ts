/**
 * Netlify Scheduled Function: analyze-new-assets
 * Runs nightly to analyze new Cloudinary assets with Claude AI
 * 
 * Schedule: 2 AM CST daily (8 AM UTC)
 */

import { Handler, schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Formats supported by Claude Vision API
const SUPPORTED_FORMATS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Initialize Supabase with service role
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Tag taxonomy for AI analysis
const TAG_TAXONOMY = `
## Visual Style
minimal, modern, abstract, geometric, gradient-heavy, 3d, flat, line-art, illustrated

## Color Themes  
warm-palette, cool-palette, neutral-palette, gold-accent, teal-accent, purple-accent, translucent, monochrome, vibrant, muted

## Industry/Use Case
tech, saas, corporate, startup, career, ai, professional, creative, finance, healthcare

## Mood/Emotion
professional, innovative, trustworthy, sophisticated, approachable, energetic, calm, bold

## Content/Elements
abstract-shapes, technology, network, glass-effect, glow, circles, lines, geometric-patterns, data-visualization

## Composition
spacious, layered, centered, asymmetric, flowing
`;

const ANALYSIS_PROMPT = `You are an expert visual designer analyzing design assets for a SaaS template library.

Analyze this image and return ONLY a JSON object with the following structure:
{
  "tags": ["tag1", "tag2", ...],
  "primaryColor": "hex or name",
  "mood": "one word",
  "suggestedUseCase": "brief description"
}

Select tags from this taxonomy (only use tags that clearly apply with high confidence):
${TAG_TAXONOMY}

Rules:
- Return 8-15 relevant tags
- Only include tags you're confident about
- Focus on visual characteristics, not guessing content meaning
- Return ONLY valid JSON, no markdown or explanation`;

interface CloudinaryResource {
    public_id: string;
    secure_url: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    created_at: string;
}

interface AnalysisResult {
    tags: string[];
    primaryColor: string;
    mood: string;
    suggestedUseCase: string;
}

// Fetch all Cloudinary resources using Search API
async function fetchCloudinaryResources(): Promise<CloudinaryResource[]> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Missing Cloudinary credentials');
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const allResources: CloudinaryResource[] = [];
    let nextCursor: string | null = null;

    do {
        const body: { expression: string; max_results: number; next_cursor?: string } = {
            expression: 'resource_type:image',
            max_results: 500,
        };
        if (nextCursor) {
            body.next_cursor = nextCursor;
        }

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cloudinary API error: ${error}`);
        }

        const data = await response.json();
        allResources.push(...(data.resources || []));
        nextCursor = data.next_cursor || null;
    } while (nextCursor);

    return allResources;
}

// Get already-analyzed public IDs from Supabase
async function getAnalyzedPublicIds(): Promise<Set<string>> {
    const { data, error } = await supabase
        .from('analyzed_assets')
        .select('cloudinary_public_id');

    if (error) {
        console.error('Error fetching analyzed assets:', error);
        return new Set();
    }

    return new Set(data?.map(row => row.cloudinary_public_id) || []);
}

// Analyze image with Claude
async function analyzeImageWithClaude(imageUrl: string): Promise<AnalysisResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('Missing ANTHROPIC_API_KEY');
    }

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mimeType,
                                data: base64Image,
                            },
                        },
                        {
                            type: 'text',
                            text: ANALYSIS_PROMPT,
                        },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
        throw new Error('No content in Claude response');
    }

    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonStr);
}

// Save analysis result to Supabase
async function saveAnalysisResult(
    publicId: string,
    cloudinaryUrl: string,
    analysis: AnalysisResult
): Promise<void> {
    const { error } = await supabase.from('analyzed_assets').insert({
        cloudinary_public_id: publicId,
        cloudinary_url: cloudinaryUrl,
        tags: analysis.tags,
        primary_color: analysis.primaryColor,
        mood: analysis.mood,
        suggested_use_case: analysis.suggestedUseCase,
    });

    if (error) {
        console.error(`Error saving analysis for ${publicId}:`, error);
        throw error;
    }
}

// Main handler
const analyzeNewAssets: Handler = async (event, context) => {
    console.log('Starting nightly asset analysis...');
    const startTime = Date.now();

    try {
        // 1. Fetch all Cloudinary resources
        console.log('Fetching Cloudinary resources...');
        const resources = await fetchCloudinaryResources();
        console.log(`Found ${resources.length} total resources`);

        // 2. Get already-analyzed IDs
        const analyzedIds = await getAnalyzedPublicIds();
        console.log(`Already analyzed: ${analyzedIds.size} assets`);

        // 3. Filter to only new assets with supported formats
        const newAssets = resources.filter(r => {
            if (analyzedIds.has(r.public_id)) return false;
            const format = (r.format || '').toLowerCase();
            return SUPPORTED_FORMATS.has(format);
        });
        const skippedFormats = resources.filter(r => {
            const format = (r.format || '').toLowerCase();
            return !SUPPORTED_FORMATS.has(format);
        }).length;
        console.log(`Skipping ${skippedFormats} unsupported formats (SVG, etc.)`);
        console.log(`New assets to analyze: ${newAssets.length}`);

        if (newAssets.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No new assets to analyze',
                    totalAssets: resources.length,
                    alreadyAnalyzed: analyzedIds.size,
                }),
            };
        }

        // 4. Analyze each new asset (with rate limiting)
        // Netlify functions have 10 second timeout, so we limit to ~5 assets per run
        const maxAssetsPerRun = 5;
        const assetsToAnalyze = newAssets.slice(0, maxAssetsPerRun);
        let succeeded = 0;
        let failed = 0;

        for (const asset of assetsToAnalyze) {
            try {
                console.log(`Analyzing: ${asset.public_id}`);
                const analysis = await analyzeImageWithClaude(asset.secure_url);
                await saveAnalysisResult(asset.public_id, asset.secure_url, analysis);
                succeeded++;
                console.log(`  ✓ ${asset.public_id}: ${analysis.tags.length} tags`);

                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                failed++;
                console.error(`  ✗ ${asset.public_id}:`, error);
            }
        }

        const duration = Date.now() - startTime;

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Analysis complete',
                totalAssets: resources.length,
                alreadyAnalyzed: analyzedIds.size,
                newAssets: newAssets.length,
                processedThisRun: assetsToAnalyze.length,
                succeeded,
                failed,
                remainingNewAssets: newAssets.length - assetsToAnalyze.length,
                durationMs: duration,
            }),
        };
    } catch (error) {
        console.error('Analysis failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Analysis failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};

// Schedule: Run at 8 AM UTC (2 AM CST) every day
export const handler = schedule('0 8 * * *', analyzeNewAssets);
