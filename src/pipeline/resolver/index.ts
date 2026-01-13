/**
 * Deterministic Asset Resolver
 *
 * Pure function: same inputs = same outputs
 */

import type { AssetMetadata } from '../types/metadata';
import type { SlotDescriptor, ResolutionResult } from '../types/slot';
import { rankRasterAssets, rankVectorAssets } from './ranking';

// ============================================================================
// Resolver
// ============================================================================

export class AssetResolver {
  private registry: AssetMetadata[];

  constructor(registry: AssetMetadata[], _registryVersion: string = 'latest') {
    this.registry = registry;
  }

  /**
   * Resolve a slot descriptor to an asset
   */
  resolve(descriptor: SlotDescriptor): ResolutionResult {
    // Filter candidates
    const candidates = this.filterCandidates(descriptor);

    if (candidates.length === 0) {
      return this.noMatchResult(descriptor);
    }

    // Determine asset class from candidates
    const assetClass = candidates[0].asset_class;

    // Rank candidates
    const ranked =
      assetClass === 'raster'
        ? rankRasterAssets(candidates, descriptor)
        : rankVectorAssets(candidates, descriptor);

    // Select best match
    const best = ranked[0];

    // Determine confidence level
    const confidence = this.determineConfidence(best.score, descriptor);

    return {
      success: true,
      asset: {
        public_id: best.asset.public_id,
        cloudinary_url: best.asset.cloudinary_url,
        metadata: best.asset as unknown as Record<string, unknown>,
      },
      reason: this.explainSelection(best, descriptor, candidates.length),
      confidence,
      matched_criteria: this.getMatchedCriteria(best, descriptor),
      unmet_criteria: this.getUnmetCriteria(best, descriptor),
      candidates_considered: candidates.length,
    };
  }

  /**
   * Resolve multiple slots
   */
  resolveMany(descriptors: SlotDescriptor[]): ResolutionResult[] {
    return descriptors.map((d) => this.resolve(d));
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Filter candidates based on descriptor
   */
  private filterCandidates(descriptor: SlotDescriptor): AssetMetadata[] {
    return this.registry.filter((asset) => {
      // Must be approved
      if (asset.lifecycle_status !== 'approved') return false;

      // Must match asset_role
      if (asset.asset_role !== descriptor.asset_role) return false;

      // Optional: role_variant
      if (
        descriptor.role_variant &&
        asset.role_variant !== descriptor.role_variant
      ) {
        return false;
      }

      // Optional: placement
      if (descriptor.placement) {
        if (
          !asset.placement ||
          !asset.placement.includes(descriptor.placement as any)
        ) {
          return false;
        }
      }

      // Optional: tone
      if (descriptor.tone && asset.tone !== descriptor.tone) {
        return false;
      }

      // Optional: tags
      if (descriptor.tags && descriptor.tags.length > 0) {
        const assetTags = asset.tags.map((t) => t.toLowerCase());
        const hasAllTags = descriptor.tags.every((tag) =>
          assetTags.includes(tag.toLowerCase()),
        );
        if (!hasAllTags) return false;
      }

      return true;
    });
  }

  /**
   * Generate result when no candidates match
   */
  private noMatchResult(descriptor: SlotDescriptor): ResolutionResult {
    const unmetCriteria: string[] = [];

    unmetCriteria.push(`asset_role: ${descriptor.asset_role}`);
    if (descriptor.role_variant) unmetCriteria.push(`role_variant: ${descriptor.role_variant}`);
    if (descriptor.placement) unmetCriteria.push(`placement: ${descriptor.placement}`);
    if (descriptor.energy) unmetCriteria.push(`energy: ${descriptor.energy}`);
    if (descriptor.palette_mode) unmetCriteria.push(`palette_mode: ${descriptor.palette_mode}`);

    return {
      success: false,
      reason: `No approved assets found matching criteria: ${unmetCriteria.join(', ')}`,
      confidence: 'none',
      matched_criteria: [],
      unmet_criteria: unmetCriteria,
      candidates_considered: 0,
    };
  }

  /**
   * Determine confidence level based on score
   */
  private determineConfidence(
    score: number,
    descriptor: SlotDescriptor,
  ): 'exact' | 'close' | 'fallback' | 'none' {
    if (score >= 90) return 'exact';
    if (score >= 70) return 'close';
    if (descriptor.allow_fallback) return 'fallback';
    return 'none';
  }

  /**
   * Explain why this asset was selected
   */
  private explainSelection(
    ranked: { asset: AssetMetadata; score: number; breakdown: Record<string, number> },
    descriptor: SlotDescriptor,
    totalCandidates: number,
  ): string {
    const reasons: string[] = [];

    reasons.push(
      `Selected from ${totalCandidates} approved ${descriptor.asset_role} assets`,
    );

    // Highlight strong matches
    if (ranked.breakdown.energy_match >= 90) {
      reasons.push(`exact energy match (${ranked.asset.energy})`);
    }
    if (ranked.breakdown.palette_match >= 90) {
      reasons.push(`exact palette match (${ranked.asset.palette_mode})`);
    }
    if (ranked.breakdown.aspect_match >= 80) {
      reasons.push('aspect ratio within optimal range');
    }
    if (ranked.breakdown.resolution_match >= 90) {
      reasons.push('resolution meets all requirements');
    }

    // Warn about penalties
    if (ranked.breakdown.crop_penalty > 20) {
      reasons.push(
        `⚠️  requires ${ranked.breakdown.crop_penalty.toFixed(0)}% crop`,
      );
    }

    reasons.push(`confidence: ${ranked.score.toFixed(1)}%`);

    return reasons.join('; ');
  }

  /**
   * List matched criteria
   */
  private getMatchedCriteria(
    ranked: { asset: AssetMetadata; breakdown: Record<string, number> },
    descriptor: SlotDescriptor,
  ): string[] {
    const matched: string[] = [];

    matched.push(`asset_role: ${descriptor.asset_role}`);
    matched.push('lifecycle_status: approved');

    if (descriptor.role_variant && ranked.asset.role_variant === descriptor.role_variant) {
      matched.push(`role_variant: ${descriptor.role_variant}`);
    }
    if (descriptor.energy && ranked.asset.energy === descriptor.energy) {
      matched.push(`energy: ${descriptor.energy}`);
    }
    if (descriptor.palette_mode && ranked.asset.palette_mode === descriptor.palette_mode) {
      matched.push(`palette_mode: ${descriptor.palette_mode}`);
    }
    if (descriptor.tone && ranked.asset.tone === descriptor.tone) {
      matched.push(`tone: ${descriptor.tone}`);
    }

    return matched;
  }

  /**
   * List unmet criteria
   */
  private getUnmetCriteria(
    ranked: { asset: AssetMetadata; breakdown: Record<string, number> },
    descriptor: SlotDescriptor,
  ): string[] {
    const unmet: string[] = [];

    if (descriptor.role_variant && ranked.asset.role_variant !== descriptor.role_variant) {
      unmet.push(`role_variant: ${descriptor.role_variant}`);
    }
    if (descriptor.energy && ranked.asset.energy !== descriptor.energy) {
      unmet.push(`energy: ${descriptor.energy}`);
    }
    if (descriptor.palette_mode && ranked.asset.palette_mode !== descriptor.palette_mode) {
      unmet.push(`palette_mode: ${descriptor.palette_mode}`);
    }
    if (descriptor.tone && ranked.asset.tone !== descriptor.tone) {
      unmet.push(`tone: ${descriptor.tone}`);
    }

    if (ranked.breakdown.crop_penalty > 20) {
      unmet.push(`aspect_ratio: excessive crop required (${ranked.breakdown.crop_penalty.toFixed(0)}%)`);
    }

    return unmet;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Load resolver from registry JSON
 */
export function loadResolverFromJson(
  registryJson: AssetMetadata[],
  version: string = 'latest',
): AssetResolver {
  return new AssetResolver(registryJson, version);
}

/**
 * Filter registry to approved assets only
 */
export function filterApprovedAssets(
  registry: AssetMetadata[],
): AssetMetadata[] {
  return registry.filter((asset) => asset.lifecycle_status === 'approved');
}
