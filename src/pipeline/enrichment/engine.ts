/**
 * Enrichment Engine
 *
 * Orchestrates asset enrichment with AI analysis, deterministic mapping,
 * caching, and lifecycle management.
 */

import { getCloudinary } from '../config/cloudinary';
import type { AssetMetadata } from '../types/metadata';
import { AIEnricher, type EnricherOptions } from './ai-enricher';
import { ContentHashCache } from './cache';
import * as Rules from './rules';

// ============================================================================
// Types
// ============================================================================

export interface EnrichmentInput {
  public_id: string;
  cloudinary_url: string;
  existing_metadata?: Partial<AssetMetadata>;
}

export interface EnrichmentResult {
  public_id: string;
  success: boolean;
  metadata?: AssetMetadata;
  error?: string;
  cached?: boolean;
  skipped?: boolean;
  skip_reason?: string;
}

export interface EnrichmentEngineOptions {
  aiEnricherOptions: EnricherOptions;
  cacheDir?: string;
  skipIfEnriched?: boolean;
  enrichmentVersion?: number;
}

// ============================================================================
// Enrichment Engine
// ============================================================================

export class EnrichmentEngine {
  private aiEnricher: AIEnricher;
  private cache: ContentHashCache;
  private cloudinary: ReturnType<typeof getCloudinary>;
  private skipIfEnriched: boolean;
  private enrichmentVersion: number;

  // Statistics
  private stats = {
    processed: 0,
    enriched: 0,
    cached: 0,
    skipped: 0,
    failed: 0,
  };

  constructor(options: EnrichmentEngineOptions) {
    this.aiEnricher = new AIEnricher(options.aiEnricherOptions);
    this.cache = new ContentHashCache(options.cacheDir);
    this.cloudinary = getCloudinary();
    this.skipIfEnriched = options.skipIfEnriched ?? true;
    this.enrichmentVersion = options.enrichmentVersion ?? 1;
  }

  /**
   * Initialize (load cache)
   */
  async initialize(): Promise<void> {
    await this.cache.load();
    console.log('[EnrichmentEngine] Initialized');
  }

  /**
   * Enrich a single asset
   */
  async enrichAsset(input: EnrichmentInput): Promise<EnrichmentResult> {
    this.stats.processed++;
    const publicId = input.public_id;

    try {
      // Check if already enriched (idempotency)
      if (this.skipIfEnriched && this.isAlreadyEnriched(input.existing_metadata)) {
        this.stats.skipped++;
        return {
          public_id: publicId,
          success: true,
          skipped: true,
          skip_reason: 'already_enriched',
        };
      }

      // Fetch resource metadata from Cloudinary
      const cloudinaryMeta = await this.fetchCloudinaryMetadata(publicId);

      // Compute content hash
      const contentHash = cloudinaryMeta.etag || ContentHashCache.computeHash(publicId);

      // Check cache
      const cachedEnrichment = this.cache.get(contentHash);
      if (cachedEnrichment) {
        this.stats.cached++;
        console.log(`[EnrichmentEngine] Cache hit: ${publicId}`);

        // Update Cloudinary with cached metadata
        await this.updateCloudinaryMetadata(
          publicId,
          cachedEnrichment.metadata as unknown as Partial<AssetMetadata>,
        );

        return {
          public_id: publicId,
          success: true,
          metadata: cachedEnrichment.metadata as unknown as AssetMetadata,
          cached: true,
        };
      }

      // Derive cheap metadata first (no AI)
      const cheapMetadata = this.deriveCheapMetadata(cloudinaryMeta, input.existing_metadata);

      // Determine if AI analysis is needed
      const needsAI = this.needsAIAnalysis(cheapMetadata);

      let enrichedMetadata: AssetMetadata;

      if (needsAI) {
        // Perform AI analysis (single call)
        console.log(`[EnrichmentEngine] Analyzing with AI: ${publicId}`);
        const aiAnalysis = await this.aiEnricher.analyzeImage(input.cloudinary_url);

        // Map AI results to structured metadata
        enrichedMetadata = this.mapToStructuredMetadata(
          cloudinaryMeta,
          cheapMetadata,
          aiAnalysis,
        );
      } else {
        // Skip AI: derive all core fields using rules
        console.log(`[EnrichmentEngine] Deriving without AI: ${publicId}`);
        enrichedMetadata = this.deriveWithoutAI(cloudinaryMeta, cheapMetadata);
      }

      // Add system fields
      enrichedMetadata.enrichment_version = this.enrichmentVersion;
      enrichedMetadata.enriched_at = new Date().toISOString().split('T')[0]; // Cloudinary date: YYYY-MM-DD
      enrichedMetadata.content_hash = contentHash;

      // Update Cloudinary
      await this.updateCloudinaryMetadata(publicId, enrichedMetadata);

      // Cache the result
      this.cache.set({
        content_hash: contentHash,
        public_id: publicId,
        enriched_at: enrichedMetadata.enriched_at,
        enrichment_version: this.enrichmentVersion,
        metadata: enrichedMetadata as unknown as Record<string, unknown>,
      });

      this.stats.enriched++;
      console.log(`[EnrichmentEngine] Enriched: ${publicId}`);

      return {
        public_id: publicId,
        success: true,
        metadata: enrichedMetadata,
      };
    } catch (error) {
      this.stats.failed++;
      console.error(`[EnrichmentEngine] Failed to enrich ${publicId}:`, error);

      return {
        public_id: publicId,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Enrich multiple assets
   */
  async enrichAssets(inputs: EnrichmentInput[]): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];

    for (const input of inputs) {
      const result = await this.enrichAsset(input);
      results.push(result);
    }

    return results;
  }

  /**
   * Finalize (save cache)
   */
  async finalize(): Promise<void> {
    await this.cache.save();
    console.log('[EnrichmentEngine] Finalized');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      engine: { ...this.stats },
      ai: this.aiEnricher.getStats(),
      cache: this.cache.getStats(),
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Check if asset is already enriched
   */
  private isAlreadyEnriched(metadata?: Partial<AssetMetadata>): boolean {
    if (!metadata) return false;

    // Check if all required enrichment fields are present
    return !!(
      metadata.enrichment_version &&
      metadata.energy &&
      metadata.palette_mode &&
      metadata.tone
    );
  }

  /**
   * Fetch metadata from Cloudinary
   */
  private async fetchCloudinaryMetadata(publicId: string): Promise<{
    public_id: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    etag?: string;
    has_alpha?: boolean;
    created_at?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }> {
    const resource = await this.cloudinary.api.resource(publicId, {
      resource_type: 'image',
      type: 'upload',
    });

    return {
      public_id: resource.public_id,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      etag: resource.etag,
      has_alpha: resource.has_alpha,
      created_at: resource.created_at,
      tags: resource.tags || [],
      metadata: resource.metadata || {},
    };
  }

  /**
   * Derive metadata without AI (cheap)
   */
  private deriveCheapMetadata(
    cloudinaryMeta: {
      public_id: string;
      format: string;
      width: number;
      height: number;
      bytes: number;
      has_alpha?: boolean;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
    existingMetadata?: Partial<AssetMetadata>,
  ): Partial<AssetMetadata> {
    const assetClass = cloudinaryMeta.format === 'svg' ? 'vector' : 'raster';

    // Aspect ratio and classification
    const aspectRatio =
      cloudinaryMeta.width && cloudinaryMeta.height
        ? cloudinaryMeta.width / cloudinaryMeta.height
        : undefined;

    Rules.classifyAspectRatio(
      cloudinaryMeta.width,
      cloudinaryMeta.height,
    );

    Rules.analyzeTransparency({
      has_alpha: cloudinaryMeta.has_alpha,
      format: cloudinaryMeta.format,
    });

    return {
      public_id: cloudinaryMeta.public_id,
      cloudinary_url: `https://res.cloudinary.com/${this.cloudinary.config().cloud_name}/image/upload/${cloudinaryMeta.public_id}`,
      asset_class: assetClass,
      format: cloudinaryMeta.format,
      width: cloudinaryMeta.width,
      height: cloudinaryMeta.height,
      bytes: cloudinaryMeta.bytes,
      aspect_ratio: aspectRatio,
      has_alpha: cloudinaryMeta.has_alpha,
      tags: cloudinaryMeta.tags || [],
      // Carry over existing metadata
      ...existingMetadata,
    };
  }

  /**
   * Determine if AI analysis is needed
   *
   * AI SHORT-CIRCUIT OPTIMIZATION:
   * If all CORE required fields can be derived without AI, skip the AI call.
   * This saves 20-30% on costs for simple assets (icons, textures, vectors).
   */
  private needsAIAnalysis(metadata: Partial<AssetMetadata>): boolean {
    // Vectors: never need AI
    if (metadata.asset_class === 'vector') {
      return false;
    }

    // Already enriched: skip AI
    if (metadata.tone && metadata.palette_primary) {
      return false;
    }

    // Check if we can derive core fields without AI
    // Core fields: asset_class, asset_role, lifecycle_status, funnel_stage, energy, palette_mode
    const canDeriveWithoutAI = this.canDeriveAllCoreFields(metadata);

    if (canDeriveWithoutAI) {
      console.log(`[EnrichmentEngine] Short-circuit: deriving without AI (${metadata.public_id})`);
      return false;
    }

    return true;
  }

  /**
   * Check if all core fields can be derived without AI
   *
   * RULES:
   * - asset_class: from format (done)
   * - asset_role: from folder/preset (must exist)
   * - energy: from tags or default to 'medium'
   * - palette_mode: from transparency or default to 'neutral'
   * - funnel_stage: from preset (must exist)
   * - lifecycle_status: always 'draft' on upload
   *
   * If all required fields present → can skip AI
   */
  private canDeriveAllCoreFields(metadata: Partial<AssetMetadata>): boolean {
    // Required: asset_role (must be set by preset)
    if (!metadata.asset_role) return false;

    // Required: funnel_stage (must be set by preset)
    if (!metadata.funnel_stage) return false;

    // Can derive energy from tags or default
    // Can derive palette_mode from transparency or default

    return true; // All core fields can be derived
  }

  /**
   * Derive all metadata WITHOUT AI (short-circuit path)
   *
   * Used when all core fields can be determined from:
   * - File properties (dimensions, transparency)
   * - Upload preset metadata
   * - Folder structure
   * - Tags
   *
   * Saves ~$0.00035 per asset (20-30% cost reduction)
   */
  private deriveWithoutAI(
    cloudinaryMeta: {
      width: number;
      height: number;
      format: string;
      bytes: number;
      has_alpha?: boolean;
      tags?: string[];
    },
    cheapMetadata: Partial<AssetMetadata>,
  ): AssetMetadata {
    const tags = cheapMetadata.tags || [];

    // Derive energy from tags or default
    let energy: 'low' | 'medium' | 'high' = 'medium';
    if (tags.includes('minimal') || tags.includes('simple')) {
      energy = 'low';
    } else if (tags.includes('vibrant') || tags.includes('bold')) {
      energy = 'high';
    }

    // Derive palette_mode from transparency or default
    let paletteMode: 'light' | 'dark' | 'neutral' = 'neutral';
    if (cloudinaryMeta.has_alpha) {
      paletteMode = 'neutral'; // Transparent assets work anywhere
    } else if (tags.includes('dark')) {
      paletteMode = 'dark';
    } else if (tags.includes('light')) {
      paletteMode = 'light';
    }

    // Build complete metadata without AI
    return {
      ...cheapMetadata,
      // Core fields (derived or defaulted)
      asset_class: cheapMetadata.asset_class || 'raster',
      asset_role: cheapMetadata.asset_role || 'hero',
      funnel_stage: cheapMetadata.funnel_stage || 'awareness',
      lifecycle_status: cheapMetadata.lifecycle_status || 'draft',
      energy,
      palette_mode: paletteMode,

      // Extended fields (defaults)
      tone: 'professional', // Default tone
      palette_primary: '#1A5FB4', // Default color
      usage_notes: 'Auto-derived without AI analysis',
      placement: cheapMetadata.placement || ['homepage'],

      // Required system fields
      public_id: cheapMetadata.public_id!,
      cloudinary_url: cheapMetadata.cloudinary_url!,
      format: cloudinaryMeta.format,
      tags,
      enrichment_version: this.enrichmentVersion,
    } as AssetMetadata;
  }

  /**
   * Map AI analysis to structured metadata
   */
  private mapToStructuredMetadata(
    cloudinaryMeta: {
      width: number;
      height: number;
      format: string;
      bytes: number;
      has_alpha?: boolean;
    },
    cheapMetadata: Partial<AssetMetadata>,
    aiAnalysis: {
      tags: string[];
      tone: string;
      palette_primary: string;
      usage_notes: string;
    },
  ): AssetMetadata {
    const tags = aiAnalysis.tags.map((t) => t.toLowerCase());

    // Derive energy (deterministic)
    const energy = Rules.deriveEnergy({
      tags,
      tone: aiAnalysis.tone,
      has_gradient: tags.includes('gradient-heavy'),
      has_3d: tags.includes('3d'),
      has_glow: tags.includes('glow'),
      is_minimal: tags.includes('minimal'),
      is_abstract: tags.includes('abstract'),
    });

    // Derive palette mode (deterministic)
    const paletteMode = Rules.derivePaletteMode({
      tags,
      palette_primary: aiAnalysis.palette_primary,
    });

    // Size classification
    Rules.classifySizeClass(
      cloudinaryMeta.width,
      cloudinaryMeta.height,
      cheapMetadata.asset_role,
    );

    // Merge with cheap metadata and AI results
    return {
      ...cheapMetadata,
      tags: [...(cheapMetadata.tags || []), ...tags],
      tone: aiAnalysis.tone,
      palette_primary: aiAnalysis.palette_primary,
      usage_notes: aiAnalysis.usage_notes,
      energy,
      palette_mode: paletteMode,
      // Required fields (use defaults if not present)
      asset_class: cheapMetadata.asset_class || 'raster',
      asset_role: cheapMetadata.asset_role || 'hero',
      placement: cheapMetadata.placement || ['homepage'],
      funnel_stage: cheapMetadata.funnel_stage || 'awareness',
      lifecycle_status: cheapMetadata.lifecycle_status || 'draft',
      public_id: cheapMetadata.public_id!,
      cloudinary_url: cheapMetadata.cloudinary_url!,
      format: cloudinaryMeta.format,
      enrichment_version: this.enrichmentVersion,
    } as AssetMetadata;
  }

  /**
   * Update Cloudinary structured metadata
   */
  private async updateCloudinaryMetadata(
    publicId: string,
    metadata: Partial<AssetMetadata>,
  ): Promise<void> {
    const structuredMetadata: Record<string, string | number> = {};

    // Map to Cloudinary structured metadata fields
    if (metadata.asset_class) structuredMetadata.asset_class = metadata.asset_class;
    if (metadata.asset_role) structuredMetadata.asset_role = metadata.asset_role;
    if (metadata.role_variant) structuredMetadata.role_variant = metadata.role_variant;
    if (metadata.funnel_stage) structuredMetadata.funnel_stage = metadata.funnel_stage;
    if (metadata.lifecycle_status) structuredMetadata.lifecycle_status = metadata.lifecycle_status;
    if (metadata.energy) structuredMetadata.energy = metadata.energy;
    if (metadata.palette_mode) structuredMetadata.palette_mode = metadata.palette_mode;
    if (metadata.tone) structuredMetadata.tone = metadata.tone;
    if (metadata.palette_primary) structuredMetadata.palette_primary = metadata.palette_primary;
    if (metadata.usage_notes) structuredMetadata.usage_notes = metadata.usage_notes;
    if (metadata.enrichment_version) structuredMetadata.enrichment_version = metadata.enrichment_version;
    if (metadata.enriched_at) structuredMetadata.enriched_at = metadata.enriched_at;
    if (metadata.content_hash) structuredMetadata.content_hash = metadata.content_hash;

    // Vector-specific
    if (metadata.vector_type) structuredMetadata.vector_type = metadata.vector_type;
    if (metadata.complexity) structuredMetadata.complexity = metadata.complexity;
    if (typeof metadata.is_themable === 'boolean') structuredMetadata.is_themable = metadata.is_themable ? 1 : 0;
    if (typeof metadata.is_invertible === 'boolean') structuredMetadata.is_invertible = metadata.is_invertible ? 1 : 0;

    // Update via API
    await this.cloudinary.uploader.update_metadata(structuredMetadata, [publicId]);
  }
}
