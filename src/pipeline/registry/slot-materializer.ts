/**
 * Slot Materializer
 *
 * Pre-computes slot_key → public_id mappings for fast lookups.
 * Rebuilds nightly or on asset changes.
 */

import fs from 'fs/promises';
import path from 'path';
import type { AssetMetadata } from '../types/metadata';
import { generateSlotKey, type SlotDescriptor } from '../types/slot';
import { AssetResolver } from '../resolver';

// ============================================================================
// Types
// ============================================================================

export interface SlotMapping {
  slot_key: string;
  public_id: string;
  cloudinary_url: string;
  confidence: 'exact' | 'close' | 'fallback' | 'none';
  reason: string;
}

export interface MaterializedRegistry {
  version: string;
  generated_at: string;
  total_slots: number;
  mappings: SlotMapping[];
}

// ============================================================================
// Slot Materializer
// ============================================================================

export class SlotMaterializer {
  private registry: AssetMetadata[];
  private resolver: AssetResolver;

  constructor(registry: AssetMetadata[]) {
    this.registry = registry;
    this.resolver = new AssetResolver(registry);
  }

  /**
   * Materialize common slot patterns
   */
  materialize(): MaterializedRegistry {
    console.log('[SlotMaterializer] Generating slot mappings...');

    const mappings: SlotMapping[] = [];

    // Generate common slot patterns
    const patterns = this.generateSlotPatterns();

    for (const descriptor of patterns) {
      const result = this.resolver.resolve(descriptor);

      if (result.success && result.asset) {
        const slotKey = generateSlotKey(descriptor);

        mappings.push({
          slot_key: slotKey,
          public_id: result.asset.public_id,
          cloudinary_url: result.asset.cloudinary_url,
          confidence: result.confidence,
          reason: result.reason,
        });
      }
    }

    console.log(`[SlotMaterializer] Generated ${mappings.length} slot mappings`);

    return {
      version: new Date().toISOString().replace(/[:.]/g, '-'),
      generated_at: new Date().toISOString(),
      total_slots: mappings.length,
      mappings,
    };
  }

  /**
   * Write materialized registry to file
   */
  async writeToFile(outputPath: string): Promise<void> {
    const registry = this.materialize();

    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(
      outputPath,
      JSON.stringify(registry, null, 2),
      'utf-8',
    );

    console.log(`[SlotMaterializer] Wrote to ${outputPath}`);
  }

  /**
   * Generate common slot patterns to pre-compute
   */
  private generateSlotPatterns(): SlotDescriptor[] {
    const descriptors: SlotDescriptor[] = [];

    // Get unique roles from registry
    const roles = new Set(this.registry.map((a) => a.asset_role));

    for (const role of roles) {
      // Base slot (no constraints)
      descriptors.push({ asset_role: role });

      // Energy variants
      for (const energy of ['low', 'medium', 'high'] as const) {
        descriptors.push({ asset_role: role, energy });

        // Palette variants
        for (const palette of ['light', 'dark', 'neutral'] as const) {
          descriptors.push({ asset_role: role, energy, palette_mode: palette });
        }
      }

      // Palette-only variants
      for (const palette of ['light', 'dark', 'neutral'] as const) {
        descriptors.push({ asset_role: role, palette_mode: palette });
      }

      // Aspect ratio variants (rasters only)
      if (this.hasRasterAssets(role)) {
        for (const aspect of [
          'square',
          'landscape',
          'portrait',
          'panorama',
        ] as const) {
          descriptors.push({ asset_role: role, aspect_ratio: aspect });
        }
      }
    }

    return descriptors;
  }

  /**
   * Check if role has raster assets
   */
  private hasRasterAssets(role: string): boolean {
    return this.registry.some(
      (a) => a.asset_role === role && a.asset_class === 'raster',
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Load materialized registry from file
 */
export async function loadMaterializedRegistry(
  filePath: string,
): Promise<MaterializedRegistry> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Quick lookup from materialized registry
 */
export function quickLookup(
  registry: MaterializedRegistry,
  slotKey: string,
): SlotMapping | undefined {
  return registry.mappings.find((m) => m.slot_key === slotKey);
}

/**
 * CLI entrypoint
 */
export async function materializeSlots(
  assetsRegistry: AssetMetadata[],
  outputPath: string,
): Promise<void> {
  const materializer = new SlotMaterializer(assetsRegistry);
  await materializer.writeToFile(outputPath);
}
