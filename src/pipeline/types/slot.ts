/**
 * Slot Descriptor - Template Asset Request Contract
 *
 * Templates request assets via slot descriptors.
 * No filenames. No tags. No folders.
 */

import type { AssetRole, Energy, PaletteMode } from './metadata';

/**
 * Aspect ratio constraint for raster assets
 */
export type AspectRatioConstraint =
  | 'square' // 0.9 - 1.1
  | 'portrait' // < 0.9
  | 'landscape' // 1.1 - 2.0
  | 'panorama' // > 2.0
  | 'any';

/**
 * Resolution constraints for raster assets
 */
export interface ResolutionConstraint {
  min_width?: number;
  min_height?: number;
  max_width?: number;
  max_height?: number;
}

/**
 * Slot Descriptor - What templates use to request assets
 */
export interface SlotDescriptor {
  // Required
  asset_role: AssetRole;

  // Optional refinements
  role_variant?: string;
  placement?: string;
  energy?: Energy;
  palette_mode?: PaletteMode;

  // Raster-specific constraints
  aspect_ratio?: AspectRatioConstraint;
  resolution?: ResolutionConstraint;

  // Additional filters
  tone?: string;
  tags?: string[];

  // Fallback behavior
  allow_fallback?: boolean;
  fallback_strategy?: 'closest_match' | 'any_approved';
}

/**
 * Resolution result - What the resolver returns
 */
export interface ResolutionResult {
  // Success or failure
  success: boolean;

  // Selected asset (if success)
  asset?: {
    public_id: string;
    cloudinary_url: string;
    metadata: Record<string, unknown>;
  };

  // Explanation
  reason: string;
  confidence: 'exact' | 'close' | 'fallback' | 'none';

  // Debugging info
  matched_criteria: string[];
  unmet_criteria: string[];
  candidates_considered: number;
}

/**
 * Slot Key - Materialized cache key
 *
 * Format: role[:variant][:energy][:palette][:aspect]
 * Examples:
 *   - hero:marketing:high:light
 *   - icon:nav:low:dark
 *   - texture:panel:medium:neutral
 */
export type SlotKey = string;

/**
 * Generate a slot key from a descriptor
 */
export function generateSlotKey(descriptor: SlotDescriptor): SlotKey {
  const parts: string[] = [descriptor.asset_role];

  if (descriptor.role_variant) {
    parts.push(descriptor.role_variant);
  }
  if (descriptor.energy) {
    parts.push(descriptor.energy);
  }
  if (descriptor.palette_mode) {
    parts.push(descriptor.palette_mode);
  }
  if (descriptor.aspect_ratio && descriptor.aspect_ratio !== 'any') {
    parts.push(descriptor.aspect_ratio);
  }

  return parts.join(':');
}

/**
 * Parse a slot key back into components
 */
export function parseSlotKey(key: SlotKey): Partial<SlotDescriptor> {
  const parts = key.split(':');
  const descriptor: Partial<SlotDescriptor> = {
    asset_role: parts[0] as AssetRole,
  };

  if (parts.length > 1 && parts[1]) descriptor.role_variant = parts[1];
  if (parts.length > 2 && parts[2]) descriptor.energy = parts[2] as Energy;
  if (parts.length > 3 && parts[3])
    descriptor.palette_mode = parts[3] as PaletteMode;
  if (parts.length > 4 && parts[4])
    descriptor.aspect_ratio = parts[4] as AspectRatioConstraint;

  return descriptor;
}
