/**
 * src/lib/image-policy/enrichment-engine.ts
 * 
 * Unified engine for asset analysis and taxonomy mapping.
 * Connects vision analysis to structured metadata and lifecycle promotion.
 */

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

export interface AnalysisResults {
    tags: string[];
    primaryColor: string;
    mood: string;
    suggestedUseCase: string;
    detectedTransparency: boolean;
    transparencyPercent: number;
}

export interface EnrichmentOutput {
    success: boolean;
    publicId: string;
    metadata: Record<string, string>;
    tags: string[];
    promoted: boolean;
    error?: string;
}

export class EnrichmentEngine {
    private anthropicKey: string;

    constructor(anthropicKey: string) {
        this.anthropicKey = anthropicKey;
        
        // Ensure Cloudinary is configured (assumes env vars are loaded)
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
    }

    /**
     * Process a single asset: analyze, map, and update Cloudinary.
     */
    async processAsset(publicId: string, options: { dryRun?: boolean, existingResource?: any } = {}): Promise<EnrichmentOutput> {
        try {
            // 1. Get asset details (use existing if provided, otherwise fetch)
            let resource = options.existingResource;
            
            if (!resource) {
                resource = await cloudinary.api.resource(publicId, {
                    metadata: true,
                    tags: true,
                    context: true
                });
            }

            // 2. Perform Visual Analysis
            const analysis = await this.analyzeAsset(resource);

            // 3. Map to Taxonomy
            const metadata = this.mapToTaxonomy(resource, analysis);
            const tags = this.normalizeTags([...(resource.tags || []), ...analysis.tags]);

            // 4. Determine Lifecycle Status (Promotion Logic)
            const isComputable = this.checkComputableCriteria(metadata);
            if (isComputable && metadata.lifecycle_status === 'draft') {
                metadata.lifecycle_status = 'approved';
            }

            // 5. Update Cloudinary
            if (!options.dryRun) {
                await cloudinary.uploader.explicit(publicId, {
                    type: 'upload',
                    tags,
                    metadata,
                    context: {
                        mood: analysis.mood,
                        primary_color: analysis.primaryColor,
                        suggested_use_case: analysis.suggestedUseCase,
                        enriched_at: new Date().toISOString()
                    }
                });
            }

            return {
                success: true,
                publicId,
                metadata,
                tags,
                promoted: metadata.lifecycle_status === 'approved'
            };

        } catch (error: any) {
            return {
                success: false,
                publicId,
                metadata: {},
                tags: [],
                promoted: false,
                error: error.message || String(error)
            };
        }
    }

    /**
     * Internal: Run AI analysis and transparency detection.
     */
    private async analyzeAsset(resource: any): Promise<AnalysisResults> {
        const imageUrl = resource.secure_url;
        
        // Fetch image for processing
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // Transparency check
        const transparency = await this.detectTransparency(buffer);

        // Claude Vision Analysis
        const analysis = await this.runClaudeAnalysis(buffer, resource.format);

        return {
            ...analysis,
            detectedTransparency: transparency.detected,
            transparencyPercent: transparency.percent
        };
    }

    /**
     * Internal: Map raw data to the structured taxonomy.
     */
    private mapToTaxonomy(resource: any, analysis: AnalysisResults): Record<string, string> {
        const metadata: Record<string, string> = {};
        const pid = resource.public_id || '';
        const tags = analysis.tags.map(t => t.toLowerCase());
        const mood = (analysis.mood || '').toLowerCase();
        const format = (resource.format || '').toLowerCase();

        // 0. Asset Class (Mandatory)
        const isVector = format === 'svg';
        metadata.asset_class = isVector ? 'vector' : 'raster';

        // 1. Product Family
        if (pid.includes('DeepWater')) metadata.product_family = 'deepwater';
        else if (pid.includes('Steel')) metadata.product_family = 'steel';
        else if (pid.includes('Diamond')) metadata.product_family = 'diamond';
        else if (pid.includes('Pro_')) metadata.product_family = 'pro';
        else if (pid.includes('Starter_')) metadata.product_family = 'starter';
        else metadata.product_family = 'relevnt_core';

        // 2. Image Role
        const lcUseCase = (analysis.suggestedUseCase || '').toLowerCase();

        if (isVector) {
            // Vector Roles: icon, ui, illustration, pattern, mark
            if (tags.some(t => t.includes('icon'))) metadata.image_role = 'icon';
            else if (tags.some(t => t.includes('ui'))) metadata.image_role = 'ui';
            else if (tags.some(t => t.includes('illustration') || t.includes('spot'))) metadata.image_role = 'spot_illustration';
            else if (tags.some(t => t.includes('pattern'))) metadata.image_role = 'texture_organic'; // Close enough
            else metadata.image_role = 'other';

            // Vector Specifics
            metadata.vector_type = tags.includes('stroke') ? 'stroke' : (tags.includes('filled') ? 'filled' : 'mixed');
            metadata.is_invertible = 'true'; // SVGs are generally invertible
            metadata.is_themable = 'true';   // SVGs are generally themable
            metadata.complexity = tags.includes('complex') ? 'high' : (tags.includes('simple') ? 'low' : 'medium');
        } else {
            // Raster Roles
            const isBg = pid.toLowerCase().includes('background') || tags.includes('background') || lcUseCase.includes('background');
            const isTexture = pid.toLowerCase().includes('texture') || lcUseCase.includes('texture');

            if (isBg && !isTexture) {
                if (mood.includes('dynamic') || tags.includes('vibrant')) metadata.image_role = 'background-dynamic';
                else if (mood.includes('structured') || tags.includes('geometric')) metadata.image_role = 'background-structured';
                else metadata.image_role = 'background-soft';
            } else if (isTexture) {
                metadata.image_role = 'texture_organic'; // Default
                if (tags.some(t => t.includes('paper'))) metadata.image_role = 'texture_paper';
                else if (tags.some(t => t.includes('grain'))) metadata.image_role = 'texture_grain';
                else if (tags.some(t => t.includes('grid'))) metadata.image_role = 'texture_grid';
            } else if (pid.includes('SpotIllustration') || tags.includes('spot_illustration')) {
                metadata.image_role = 'spot_illustration';
            } else if (pid.includes('FeatureCard')) {
                metadata.image_role = 'feature_card';
            } else if (pid.includes('Hero')) {
                metadata.image_role = 'hero';
            } else if (pid.includes('Icon') || tags.includes('icon')) {
                metadata.image_role = 'icon';
            } else {
                metadata.image_role = 'other';
            }

            // Raster Energy
            const highEnergy = ['dynamic', 'bold', 'vibrant', 'energetic'];
            const lowEnergy = ['calm', 'soft', 'minimal', 'subtle'];
            const score = tags.filter(t => highEnergy.includes(t)).length - tags.filter(t => lowEnergy.includes(t)).length;
            metadata.energy = score > 0 ? 'high' : (score < 0 ? 'low' : 'medium');
            metadata.is_transparent = analysis.detectedTransparency ? 'true' : 'false';
        }

        // 3. Structural (Common)
        const aspect = this.calculateAspectClass(resource.width, resource.height);
        metadata.aspect_class = aspect;
        metadata.mood = analysis.mood;
        
        // Initial status
        metadata.lifecycle_status = 'draft';

        return metadata;
    }

    private checkComputableCriteria(metadata: Record<string, string>): boolean {
        // Assets are computable if they have a non-other role and basic metadata
        const hasRole = metadata.image_role && metadata.image_role !== 'other';
        const hasProduct = !!metadata.product_family;
        const hasAssetClass = !!metadata.asset_class;
        return !!(hasRole && hasProduct && hasAssetClass);
    }

    private async detectTransparency(buffer: Buffer) {
        try {
            const image = sharp(buffer);
            const metadata = await image.metadata();
            if (!metadata.hasAlpha) return { detected: false, percent: 0 };

            const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
            let transparentPixels = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 255) transparentPixels++;
            }
            const percent = (transparentPixels / (info.width! * info.height!)) * 100;
            return { detected: percent > 1, percent };
        } catch {
            return { detected: false, percent: 0 };
        }
    }

    private async runClaudeAnalysis(buffer: Buffer, format: string) {
        const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        const base64 = buffer.toString('base64');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.anthropicKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
                        { type: 'text', text: 'Analyze this image. Return ONLY valid JSON: { "tags": [...], "primaryColor": "...", "mood": "...", "suggestedUseCase": "..." }' }
                    ]
                }]
            })
        });

        if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
        const data = await response.json();
        return JSON.parse(data.content[0].text);
    }

    private calculateAspectClass(w: number, h: number): string {
        const r = w / h;
        if (r > 2.2) return 'panorama';
        if (r > 1.2) return 'landscape';
        if (r < 0.8) return 'portrait';
        return 'square';
    }

    private normalizeTags(tags: string[]): string[] {
        return [...new Set(tags.map(t => t.trim().toLowerCase()).filter(t => t.length > 0))];
    }
}
