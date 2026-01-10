/**
 * Lifecycle Validation Gates
 *
 * Validates asset metadata before promoting from draft → approved.
 * Enforces completeness and consistency.
 */

import type {
  AssetMetadata,
  CoreMetadata,
  VectorMetadata,
} from '../types/metadata';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  canPromote: boolean;
}

export interface PromotionResult {
  success: boolean;
  previous_status: string;
  new_status: string;
  errors?: string[];
}

// ============================================================================
// Field Classification: Core vs Extended
// ============================================================================

/**
 * CORE REQUIRED FIELDS
 *
 * These fields are CRITICAL for:
 * - Asset resolution (resolver must have these)
 * - Lifecycle promotion (cannot approve without these)
 * - System determinism (same inputs → same outputs)
 *
 * Missing any of these = validation error = cannot promote to approved
 */
export const CORE_REQUIRED_FIELDS = [
  'asset_class',      // Immutable: raster | vector
  'asset_role',       // Primary classification
  'lifecycle_status', // Draft | Approved | Deprecated
  'funnel_stage',     // Awareness | Consideration | Conversion | Retention
  'energy',           // Derived deterministically, persisted
  'palette_mode',     // Derived deterministically, persisted
  'enrichment_version', // Must be >= 1 (enrichment completed)
] as const;

/**
 * CORE VECTOR FIELDS
 *
 * Required for vectors (when asset_class = 'vector')
 */
export const CORE_VECTOR_FIELDS = [
  'complexity', // Low | Medium | High
] as const;

/**
 * EXTENDED RECOMMENDED FIELDS
 *
 * These fields enhance ranking, governance, and debugging but are NOT
 * promotion blockers. Missing these = warning, not error.
 */
export const EXTENDED_RECOMMENDED_FIELDS = [
  // Enrichment-derived (enhance ranking)
  'tone',
  'palette_primary',
  'usage_notes',

  // Placement & governance (optional targeting)
  'placement',
  'role_variant',

  // Vector-specific (enhance vector ranking)
  'vector_type',
  'is_themable',
  'is_invertible',

  // Debugging & analytics
  'content_hash',
  'enriched_at',
] as const;

/**
 * Field classification helper
 */
export function classifyField(fieldName: string): 'core' | 'core_vector' | 'extended' | 'unknown' {
  if ((CORE_REQUIRED_FIELDS as readonly string[]).includes(fieldName)) {
    return 'core';
  }
  if ((CORE_VECTOR_FIELDS as readonly string[]).includes(fieldName)) {
    return 'core_vector';
  }
  if ((EXTENDED_RECOMMENDED_FIELDS as readonly string[]).includes(fieldName)) {
    return 'extended';
  }
  return 'unknown';
}

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Validate core metadata (required for ALL assets)
 */
export function validateCoreMetadata(
  metadata: Partial<AssetMetadata>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // CORE REQUIRED FIELDS (errors if missing)
  if (!metadata.asset_class) {
    errors.push('Missing core field: asset_class');
  }
  if (!metadata.asset_role) {
    errors.push('Missing core field: asset_role');
  }
  if (!metadata.funnel_stage) {
    errors.push('Missing core field: funnel_stage');
  }
  if (!metadata.lifecycle_status) {
    errors.push('Missing core field: lifecycle_status');
  }
  if (!metadata.energy) {
    errors.push('Missing core field: energy (must be derived & persisted)');
  }
  if (!metadata.palette_mode) {
    errors.push('Missing core field: palette_mode (must be derived & persisted)');
  }
  if (!metadata.enrichment_version || metadata.enrichment_version < 1) {
    errors.push('Missing core field: enrichment_version (asset not enriched)');
  }

  // EXTENDED RECOMMENDED FIELDS (warnings only, not promotion blockers)
  if (!metadata.tone) {
    warnings.push('Missing recommended field: tone (enhances ranking)');
  }
  if (!metadata.palette_primary) {
    warnings.push('Missing recommended field: palette_primary (enhances ranking)');
  }
  if (!metadata.placement || metadata.placement.length === 0) {
    warnings.push('Missing recommended field: placement (limits targeting)');
  }

  // Validation result
  // valid = no errors (warnings are acceptable)
  // canPromote = valid AND no warnings (ideal state)
  const valid = errors.length === 0;
  const canPromote = valid && warnings.length === 0;

  return { valid, errors, warnings, canPromote };
}

/**
 * Validate vector-specific metadata
 */
export function validateVectorMetadata(
  metadata: Partial<AssetMetadata>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only validate if asset_class is vector
  if (metadata.asset_class !== 'vector') {
    return { valid: true, errors: [], warnings: [], canPromote: true };
  }

  // Vector-specific required fields
  if (!metadata.complexity) {
    errors.push('Missing required vector field: complexity');
  }

  // Recommended fields
  if (typeof metadata.is_themable !== 'boolean') {
    warnings.push('Missing recommended vector field: is_themable');
  }
  if (typeof metadata.is_invertible !== 'boolean') {
    warnings.push('Missing recommended vector field: is_invertible');
  }
  if (!metadata.vector_type) {
    warnings.push('Missing recommended vector field: vector_type');
  }

  const valid = errors.length === 0;
  const canPromote = valid && warnings.length === 0;

  return { valid, errors, warnings, canPromote };
}

/**
 * Validate complete asset metadata
 */
export function validateAsset(metadata: Partial<AssetMetadata>): ValidationResult {
  const coreResult = validateCoreMetadata(metadata);
  const vectorResult = validateVectorMetadata(metadata);

  const errors = [...coreResult.errors, ...vectorResult.errors];
  const warnings = [...coreResult.warnings, ...vectorResult.warnings];

  const valid = errors.length === 0;
  const canPromote = valid && warnings.length === 0;

  return { valid, errors, warnings, canPromote };
}

// ============================================================================
// Promotion Logic
// ============================================================================

/**
 * Check if asset can be promoted to approved
 */
export function canPromoteToApproved(
  metadata: Partial<AssetMetadata>,
): { can: boolean; reason: string } {
  // Must be in draft status
  if (metadata.lifecycle_status !== 'draft') {
    return {
      can: false,
      reason: `Asset is not in draft status (current: ${metadata.lifecycle_status})`,
    };
  }

  // Must pass validation (no errors)
  const validation = validateAsset(metadata);
  if (!validation.valid) {
    return {
      can: false,
      reason: `Validation failed (missing core fields): ${validation.errors.join(', ')}`,
    };
  }

  // Valid = can promote (warnings are acceptable, not blockers)
  if (validation.warnings.length > 0) {
    return {
      can: true,
      reason: `Promotable (core fields complete, ${validation.warnings.length} optional fields missing)`,
    };
  }

  return { can: true, reason: 'All fields complete (core + extended)' };
}

/**
 * Promote asset to approved status
 */
export function promoteToApproved(
  metadata: AssetMetadata,
): PromotionResult {
  const check = canPromoteToApproved(metadata);

  if (!check.can) {
    return {
      success: false,
      previous_status: metadata.lifecycle_status,
      new_status: metadata.lifecycle_status,
      errors: [check.reason],
    };
  }

  return {
    success: true,
    previous_status: metadata.lifecycle_status,
    new_status: 'approved',
  };
}

/**
 * Deprecate asset
 */
export function deprecateAsset(metadata: AssetMetadata): PromotionResult {
  if (metadata.lifecycle_status === 'deprecated') {
    return {
      success: false,
      previous_status: metadata.lifecycle_status,
      new_status: metadata.lifecycle_status,
      errors: ['Asset is already deprecated'],
    };
  }

  return {
    success: true,
    previous_status: metadata.lifecycle_status,
    new_status: 'deprecated',
  };
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate multiple assets
 */
export function validateAssets(
  assets: Partial<AssetMetadata>[],
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (const asset of assets) {
    if (asset.public_id) {
      results.set(asset.public_id, validateAsset(asset));
    }
  }

  return results;
}

/**
 * Get summary of validation results
 */
export function getValidationSummary(
  results: Map<string, ValidationResult>,
): {
  total: number;
  valid: number;
  invalid: number;
  canPromote: number;
  totalErrors: number;
  totalWarnings: number;
} {
  let valid = 0;
  let invalid = 0;
  let canPromote = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results.values()) {
    if (result.valid) valid++;
    else invalid++;

    if (result.canPromote) canPromote++;

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }

  return {
    total: results.size,
    valid,
    invalid,
    canPromote,
    totalErrors,
    totalWarnings,
  };
}
