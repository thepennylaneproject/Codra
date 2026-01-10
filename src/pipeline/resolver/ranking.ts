/**
 * Deterministic Ranking Algorithms
 *
 * Strict ordering for asset resolution. Same inputs = same output.
 *
 * IMPORTANT: Weights are VERSIONED. If you change weights, increment the version
 * and create new constants. This preserves historical determinism.
 */

import type { AssetMetadata } from '../types/metadata';
import type { SlotDescriptor, AspectRatioConstraint } from '../types/slot';

// ============================================================================
// Ranking Weight Versions
// ============================================================================

/**
 * RASTER_RANKING_WEIGHTS_V1
 *
 * Versioned weight schema for raster asset ranking.
 * Created: 2026-01-10
 *
 * DO NOT MODIFY. To change weights, create V2 and update CURRENT_WEIGHTS.
 */
export const RASTER_RANKING_WEIGHTS_V1 = {
  version: 1,
  energy: 0.3,        // 30% - Primary energy match
  palette: 0.3,       // 30% - Palette mode match
  aspect: 0.2,        // 20% - Aspect ratio fit
  resolution: 0.2,    // 20% - Resolution constraints
  crop_penalty: 0.5,  // Penalty multiplier for >20% crop
} as const;

/**
 * VECTOR_RANKING_WEIGHTS_V1
 *
 * Versioned weight schema for vector asset ranking.
 * Created: 2026-01-10
 *
 * DO NOT MODIFY. To change weights, create V2 and update CURRENT_WEIGHTS.
 */
export const VECTOR_RANKING_WEIGHTS_V1 = {
  version: 1,
  role: 0.4,        // 40% - Role-specific scoring
  palette: 0.3,     // 30% - Palette mode (less critical for vectors)
  complexity: 0.3,  // 30% - Complexity preference
} as const;

/**
 * Current active weight versions
 *
 * Change these to use new weight schemas (e.g., _V2)
 */
export const CURRENT_RASTER_WEIGHTS = RASTER_RANKING_WEIGHTS_V1;
export const CURRENT_VECTOR_WEIGHTS = VECTOR_RANKING_WEIGHTS_V1;

// ============================================================================
// Scoring System
// ============================================================================

export interface RankingScore {
  asset: AssetMetadata;
  score: number;
  breakdown: {
    energy_match: number;
    palette_match: number;
    aspect_match: number;
    resolution_match: number;
    crop_penalty: number;
    tie_breaker: number;
  };
  weights_version?: number; // Track which weight version was used
}

// ============================================================================
// Aspect Ratio Matching
// ============================================================================

/**
 * Calculate aspect ratio match score (0-100)
 */
function scoreAspectRatio(
  assetAspect: number | undefined,
  requestedAspect: AspectRatioConstraint | undefined,
): { score: number; penalty: number } {
  if (!assetAspect || !requestedAspect || requestedAspect === 'any') {
    return { score: 50, penalty: 0 }; // neutral
  }

  // Define aspect ratio ranges
  const ranges: Record<
    AspectRatioConstraint,
    { min: number; max: number; ideal: number }
  > = {
    square: { min: 0.9, max: 1.1, ideal: 1.0 },
    portrait: { min: 0.5, max: 0.89, ideal: 0.75 },
    landscape: { min: 1.11, max: 2.0, ideal: 1.5 },
    panorama: { min: 2.01, max: 4.0, ideal: 2.5 },
    any: { min: 0, max: 999, ideal: 1.5 },
  };

  const range = ranges[requestedAspect];
  if (!range) return { score: 0, penalty: 0 };

  // Check if within range
  if (assetAspect >= range.min && assetAspect <= range.max) {
    // Exact match - score based on distance from ideal
    const distanceFromIdeal = Math.abs(assetAspect - range.ideal);
    const maxDistance = Math.max(
      range.ideal - range.min,
      range.max - range.ideal,
    );
    const score = 100 - (distanceFromIdeal / maxDistance) * 20; // 80-100 range
    return { score, penalty: 0 };
  }

  // Calculate crop penalty
  const cropPenalty = calculateCropPenalty(assetAspect, range.ideal);

  // Out of range - lower score, add penalty
  const distanceFromRange =
    assetAspect < range.min
      ? range.min - assetAspect
      : assetAspect - range.max;
  const score = Math.max(0, 50 - distanceFromRange * 20);

  return { score, penalty: cropPenalty };
}

/**
 * Calculate crop penalty percentage
 */
function calculateCropPenalty(
  actualAspect: number,
  targetAspect: number,
): number {
  // What percentage of the image would need to be cropped?
  const ratio = actualAspect / targetAspect;

  if (ratio > 1) {
    // Image is wider - crop width
    return ((ratio - 1) / ratio) * 100;
  } else {
    // Image is taller - crop height
    return ((1 - ratio) / 1) * 100;
  }
}

// ============================================================================
// Resolution Matching
// ============================================================================

/**
 * Score resolution match (0-100)
 */
function scoreResolution(
  asset: AssetMetadata,
  descriptor: SlotDescriptor,
): number {
  const { resolution } = descriptor;

  // If no constraints, perfect match
  if (!resolution) return 100;

  const width = asset.width || 0;
  const height = asset.height || 0;

  let score = 100;

  // Check minimum constraints
  if (resolution.min_width && width < resolution.min_width) {
    const deficit = resolution.min_width - width;
    score -= (deficit / resolution.min_width) * 50; // up to -50
  }

  if (resolution.min_height && height < resolution.min_height) {
    const deficit = resolution.min_height - height;
    score -= (deficit / resolution.min_height) * 50; // up to -50
  }

  // Check maximum constraints (slight penalty for oversized)
  if (resolution.max_width && width > resolution.max_width) {
    const excess = width - resolution.max_width;
    score -= (excess / width) * 10; // up to -10
  }

  if (resolution.max_height && height > resolution.max_height) {
    const excess = height - resolution.max_height;
    score -= (excess / height) * 10; // up to -10
  }

  return Math.max(0, score);
}

// ============================================================================
// Raster Ranking
// ============================================================================

/**
 * Rank raster assets deterministically
 */
export function rankRasterAssets(
  assets: AssetMetadata[],
  descriptor: SlotDescriptor,
): RankingScore[] {
  const scores: RankingScore[] = assets.map((asset) => {
    const breakdown = {
      energy_match: 0,
      palette_match: 0,
      aspect_match: 0,
      resolution_match: 0,
      crop_penalty: 0,
      tie_breaker: 0,
    };

    // 1. Energy match (100 points for exact, 50 for close, 0 for mismatch)
    if (descriptor.energy) {
      if (asset.energy === descriptor.energy) {
        breakdown.energy_match = 100;
      } else if (
        (asset.energy === 'medium' && descriptor.energy !== 'medium') ||
        (descriptor.energy === 'medium' && asset.energy !== 'medium')
      ) {
        breakdown.energy_match = 50; // medium is close to both high and low
      } else {
        breakdown.energy_match = 0;
      }
    } else {
      breakdown.energy_match = 50; // neutral
    }

    // 2. Palette mode match (100 points for exact, 60 for neutral, 0 for mismatch)
    if (descriptor.palette_mode) {
      if (asset.palette_mode === descriptor.palette_mode) {
        breakdown.palette_match = 100;
      } else if (
        asset.palette_mode === 'neutral' ||
        descriptor.palette_mode === 'neutral'
      ) {
        breakdown.palette_match = 60;
      } else {
        breakdown.palette_match = 0;
      }
    } else {
      breakdown.palette_match = 50; // neutral
    }

    // 3. Aspect ratio match and crop penalty
    const aspectResult = scoreAspectRatio(
      asset.aspect_ratio,
      descriptor.aspect_ratio,
    );
    breakdown.aspect_match = aspectResult.score;
    breakdown.crop_penalty = aspectResult.penalty;

    // 4. Resolution match
    breakdown.resolution_match = scoreResolution(asset, descriptor);

    // 5. Stable tie-breaker (lexical sort by public_id)
    breakdown.tie_breaker = 0; // computed later

    // Calculate total score using versioned weights
    const weights = CURRENT_RASTER_WEIGHTS;
    let totalScore =
      breakdown.energy_match * weights.energy +
      breakdown.palette_match * weights.palette +
      breakdown.aspect_match * weights.aspect +
      breakdown.resolution_match * weights.resolution;

    // Apply crop penalty (deduct from total)
    if (breakdown.crop_penalty > 20) {
      totalScore -= breakdown.crop_penalty * weights.crop_penalty;
    }

    return {
      asset,
      score: totalScore,
      breakdown,
      weights_version: weights.version,
    };
  });

  // Sort by score descending
  scores.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      // Tie-breaker: lexical sort by public_id (deterministic)
      return a.asset.public_id.localeCompare(b.asset.public_id);
    }
    return b.score - a.score;
  });

  return scores;
}

// ============================================================================
// Vector Ranking
// ============================================================================

/**
 * Rank vector assets deterministically
 */
export function rankVectorAssets(
  assets: AssetMetadata[],
  descriptor: SlotDescriptor,
): RankingScore[] {
  const scores: RankingScore[] = assets.map((asset) => {
    const breakdown = {
      energy_match: 0,
      palette_match: 0,
      aspect_match: 0,
      resolution_match: 0, // not used for vectors
      crop_penalty: 0, // not used for vectors
      tie_breaker: 0,
    };

    // 1. Role-specific scoring
    let roleScore = 50;

    if (descriptor.asset_role === 'icon') {
      // Icons: prefer low complexity, themable
      if (asset.complexity === 'low') roleScore += 30;
      if (asset.is_themable) roleScore += 20;
    } else if (descriptor.asset_role === 'spot_illustration') {
      // Illustrations: prefer medium complexity
      if (asset.complexity === 'medium') roleScore += 30;
      // Tone match is important
      if (descriptor.tone && asset.tone === descriptor.tone) roleScore += 20;
    } else {
      // Other roles: use defaults
      roleScore = 50;
    }

    breakdown.energy_match = roleScore;

    // 2. Palette mode match (less critical for vectors)
    if (descriptor.palette_mode) {
      if (asset.palette_mode === descriptor.palette_mode) {
        breakdown.palette_match = 100;
      } else if (asset.is_invertible) {
        breakdown.palette_match = 80; // invertible vectors work in any mode
      } else {
        breakdown.palette_match = 40;
      }
    } else {
      breakdown.palette_match = 50; // neutral
    }

    // 3. Complexity preference (simpler is better)
    const complexityScore = asset.complexity === 'low' ? 100 : asset.complexity === 'medium' ? 70 : 40;
    breakdown.aspect_match = complexityScore;

    // Calculate total score using versioned weights
    const weights = CURRENT_VECTOR_WEIGHTS;
    const totalScore =
      breakdown.energy_match * weights.role +
      breakdown.palette_match * weights.palette +
      breakdown.aspect_match * weights.complexity;

    return {
      asset,
      score: totalScore,
      breakdown,
      weights_version: weights.version,
    };
  });

  // Sort by score descending
  scores.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      // Tie-breaker: lexical sort by public_id (deterministic)
      return a.asset.public_id.localeCompare(b.asset.public_id);
    }
    return b.score - a.score;
  });

  return scores;
}
