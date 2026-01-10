/**
 * Registry Index Generator
 *
 * Generates the canonical asset registry from Cloudinary.
 * This is the read-only cache of the System of Record.
 */

import fs from 'fs/promises';
import path from 'path';
import { getCloudinary, normalizePublicId } from '../config/cloudinary';
import type { AssetMetadata } from '../types/metadata';

// ============================================================================
// Types
// ============================================================================

export interface IndexGeneratorOptions {
  folder?: string;
  maxResults?: number;
  includeDeprecated?: boolean;
  outputPath?: string;
}

export interface GenerationResult {
  total: number;
  approved: number;
  draft: number;
  deprecated: number;
  outputPath: string;
  version: string;
  generatedAt: string;
}

// ============================================================================
// Index Generator
// ============================================================================

export class RegistryIndexGenerator {
  private cloudinary: ReturnType<typeof getCloudinary>;

  constructor() {
    this.cloudinary = getCloudinary();
  }

  /**
   * Generate registry index from Cloudinary
   */
  async generate(options: IndexGeneratorOptions = {}): Promise<GenerationResult> {
    const folder = options.folder || 'codra';
    const maxResults = options.maxResults || 500;
    const includeDeprecated = options.includeDeprecated ?? false;
    const outputPath = options.outputPath || './out/asset-registry.json';

    console.log('[IndexGenerator] Fetching assets from Cloudinary...');
    console.log(`  Folder: ${folder}`);
    console.log(`  Max results: ${maxResults}`);

    // Fetch all resources from folder
    const assets: AssetMetadata[] = [];
    let nextCursor: string | undefined;

    do {
      const result = await this.cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        prefix: folder,
        max_results: 100,
        next_cursor: nextCursor,
        metadata: true,
        tags: true,
      });

      // Parse resources
      for (const resource of result.resources) {
        const asset = this.parseResource(resource);

        // Filter deprecated if requested
        if (!includeDeprecated && asset.lifecycle_status === 'deprecated') {
          continue;
        }

        assets.push(asset);
      }

      nextCursor = result.next_cursor;

      console.log(`  Fetched ${assets.length} assets...`);

      if (assets.length >= maxResults) {
        break;
      }
    } while (nextCursor);

    // Sort by public_id (deterministic)
    assets.sort((a, b) => a.public_id.localeCompare(b.public_id));

    // Count by lifecycle status
    const approved = assets.filter((a) => a.lifecycle_status === 'approved').length;
    const draft = assets.filter((a) => a.lifecycle_status === 'draft').length;
    const deprecated = assets.filter((a) => a.lifecycle_status === 'deprecated').length;

    // Generate version (timestamp-based)
    const version = new Date().toISOString().replace(/[:.]/g, '-');
    const generatedAt = new Date().toISOString();

    // Write to file
    await this.writeIndex(outputPath, assets, {
      version,
      generatedAt,
      total: assets.length,
      approved,
      draft,
      deprecated,
    });

    console.log('[IndexGenerator] ✓ Complete');
    console.log(`  Total: ${assets.length}`);
    console.log(`  Approved: ${approved}`);
    console.log(`  Draft: ${draft}`);
    console.log(`  Deprecated: ${deprecated}`);
    console.log(`  Output: ${outputPath}`);

    return {
      total: assets.length,
      approved,
      draft,
      deprecated,
      outputPath,
      version,
      generatedAt,
    };
  }

  /**
   * Parse Cloudinary resource into AssetMetadata
   */
  private parseResource(resource: any): AssetMetadata {
    const publicId = normalizePublicId(resource.public_id) || resource.public_id;

    // Extract structured metadata
    const metadata = resource.metadata || {};

    // Determine asset class
    const assetClass =
      metadata.asset_class || (resource.format === 'svg' ? 'vector' : 'raster');

    // Build AssetMetadata
    const asset: AssetMetadata = {
      public_id: publicId,
      cloudinary_url: resource.secure_url,
      asset_class: assetClass,
      asset_role: metadata.asset_role || 'hero',
      placement: this.parseArrayField(metadata.placement) || ['homepage'],
      funnel_stage: metadata.funnel_stage || 'awareness',
      lifecycle_status: metadata.lifecycle_status || 'draft',
      energy: metadata.energy || 'medium',
      palette_mode: metadata.palette_mode || 'neutral',
      tone: metadata.tone || '',
      palette_primary: metadata.palette_primary || '',
      usage_notes: metadata.usage_notes || '',
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      aspect_ratio: resource.width && resource.height ? resource.width / resource.height : undefined,
      has_alpha: resource.has_alpha,
      tags: resource.tags || [],
      enrichment_version: metadata.enrichment_version || 0,
      enriched_at: metadata.enriched_at,
      content_hash: metadata.content_hash,
    };

    // Vector-specific fields
    if (assetClass === 'vector') {
      asset.vector_type = metadata.vector_type;
      asset.complexity = metadata.complexity || 'medium';
      asset.is_themable = this.parseBooleanField(metadata.is_themable);
      asset.is_invertible = this.parseBooleanField(metadata.is_invertible);
    }

    return asset;
  }

  /**
   * Parse array field from metadata
   */
  private parseArrayField(value: any): string[] | undefined {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Handle comma-separated or JSON stringified arrays
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return value.split(',').map((s) => s.trim());
      }
    }
    return undefined;
  }

  /**
   * Parse boolean field (handles Cloudinary's integer encoding)
   */
  private parseBooleanField(value: any): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1') return true;
    if (value === 0 || value === '0') return false;
    return undefined;
  }

  /**
   * Write index to file
   */
  private async writeIndex(
    outputPath: string,
    assets: AssetMetadata[],
    meta: {
      version: string;
      generatedAt: string;
      total: number;
      approved: number;
      draft: number;
      deprecated: number;
    },
  ): Promise<void> {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    const output = {
      _meta: meta,
      assets,
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Load registry from JSON file
 */
export async function loadRegistryFromFile(
  filePath: string,
): Promise<{ assets: AssetMetadata[]; meta: any }> {
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(content);

  return {
    assets: parsed.assets || parsed, // Handle both wrapped and raw arrays
    meta: parsed._meta || {},
  };
}

/**
 * Quick CLI entrypoint
 */
export async function generateRegistryIndex(
  options: IndexGeneratorOptions = {},
): Promise<GenerationResult> {
  const generator = new RegistryIndexGenerator();
  return generator.generate(options);
}
