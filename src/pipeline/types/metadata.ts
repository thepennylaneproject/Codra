/**
 * Asset Taxonomy - Structured Metadata Type Definitions
 *
 * These types define the canonical structure for all asset metadata.
 * They map directly to Cloudinary Structured Metadata fields.
 */

// ============================================================================
// Core Metadata Fields (ALL assets)
// ============================================================================

export type AssetClass = 'raster' | 'vector';

export type AssetRole =
  | 'hero'
  | 'spot_illustration'
  | 'texture'
  | 'icon'
  | 'feature_card'
  | 'logo'
  | 'ui_screenshot'
  | 'diagram';

export type Placement =
  | 'homepage'
  | 'pricing'
  | 'onboarding'
  | 'blog'
  | 'email'
  | 'ads'
  | 'docs'
  | 'app';

export type FunnelStage =
  | 'awareness'
  | 'consideration'
  | 'conversion'
  | 'retention';

export type LifecycleStatus = 'draft' | 'approved' | 'deprecated';

export type Energy = 'low' | 'medium' | 'high';

export type PaletteMode = 'light' | 'dark' | 'neutral';

// Renamed fields (normalized taxonomy)
export type Tone = string; // Free-form but encouraged: 'professional', 'innovative', 'calm', etc.

// ============================================================================
// Vector-Specific Metadata
// ============================================================================

export type VectorType = 'stroke' | 'filled' | 'mixed';

export type Complexity = 'low' | 'medium' | 'high';

// ============================================================================
// Structured Metadata Schema
// ============================================================================

/**
 * Core metadata fields required for ALL assets
 */
export interface CoreMetadata {
  // Immutable after upload
  asset_class: AssetClass;

  // Required fields
  asset_role: AssetRole;
  placement: Placement[];
  funnel_stage: FunnelStage;
  lifecycle_status: LifecycleStatus;

  // Deterministically derived and persisted
  energy: Energy;
  palette_mode: PaletteMode;

  // Optional but encouraged
  role_variant?: string; // e.g., 'hero_marketing', 'icon_nav'

  // Normalized naming
  tone: Tone;
  palette_primary: string; // hex color
  usage_notes: string;
}

/**
 * Vector-specific metadata extensions
 */
export interface VectorMetadata {
  vector_type: VectorType;
  complexity: Complexity;
  is_themable: boolean;
  is_invertible: boolean;
}

/**
 * Complete asset metadata (superset)
 */
export interface AssetMetadata extends CoreMetadata {
  // Vector-specific (only when asset_class = 'vector')
  vector_type?: VectorType;
  complexity?: Complexity;
  is_themable?: boolean;
  is_invertible?: boolean;

  // System fields
  enrichment_version: number;
  enriched_at?: string; // ISO timestamp

  // Cloudinary identifiers
  public_id: string;
  cloudinary_url: string;

  // File properties
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
  aspect_ratio?: number;
  has_alpha?: boolean;

  // Tags (for backwards compatibility and additional metadata)
  tags: string[];

  // Content hash for deduplication
  content_hash?: string;
}

// ============================================================================
// Cloudinary Structured Metadata Field Definitions
// ============================================================================

/**
 * Schema for Cloudinary structured metadata fields.
 * Use this to programmatically create fields via Admin API.
 */
export interface CloudinaryMetadataField {
  external_id: string;
  type: 'string' | 'integer' | 'date' | 'enum' | 'set';
  label: string;
  mandatory?: boolean;
  default_value?: string | number;
  datasource?: {
    values: Array<{ external_id: string; value: string }>;
  };
}

export const CLOUDINARY_METADATA_SCHEMA: CloudinaryMetadataField[] = [
  // ============================================================================
  // Core Fields
  // ============================================================================
  {
    external_id: 'asset_class',
    type: 'enum',
    label: 'Asset Class',
    mandatory: true,
    datasource: {
      values: [
        { external_id: 'raster', value: 'Raster' },
        { external_id: 'vector', value: 'Vector' },
      ],
    },
  },
  {
    external_id: 'asset_role',
    type: 'enum',
    label: 'Asset Role',
    mandatory: true,
    datasource: {
      values: [
        { external_id: 'hero', value: 'Hero' },
        { external_id: 'spot_illustration', value: 'Spot Illustration' },
        { external_id: 'texture', value: 'Texture' },
        { external_id: 'icon', value: 'Icon' },
        { external_id: 'feature_card', value: 'Feature Card' },
        { external_id: 'logo', value: 'Logo' },
        { external_id: 'ui_screenshot', value: 'UI Screenshot' },
        { external_id: 'diagram', value: 'Diagram' },
      ],
    },
  },
  {
    external_id: 'role_variant',
    type: 'string',
    label: 'Role Variant',
    mandatory: false,
  },
  {
    external_id: 'placement',
    type: 'set',
    label: 'Placement',
    mandatory: false,
    datasource: {
      values: [
        { external_id: 'homepage', value: 'Homepage' },
        { external_id: 'pricing', value: 'Pricing' },
        { external_id: 'onboarding', value: 'Onboarding' },
        { external_id: 'blog', value: 'Blog' },
        { external_id: 'email', value: 'Email' },
        { external_id: 'ads', value: 'Ads' },
        { external_id: 'docs', value: 'Docs' },
        { external_id: 'app', value: 'App' },
      ],
    },
  },
  {
    external_id: 'funnel_stage',
    type: 'enum',
    label: 'Funnel Stage',
    mandatory: true,
    datasource: {
      values: [
        { external_id: 'awareness', value: 'Awareness' },
        { external_id: 'consideration', value: 'Consideration' },
        { external_id: 'conversion', value: 'Conversion' },
        { external_id: 'retention', value: 'Retention' },
      ],
    },
  },
  {
    external_id: 'lifecycle_status',
    type: 'enum',
    label: 'Lifecycle Status',
    mandatory: true,
    default_value: 'draft',
    datasource: {
      values: [
        { external_id: 'draft', value: 'Draft' },
        { external_id: 'approved', value: 'Approved' },
        { external_id: 'deprecated', value: 'Deprecated' },
      ],
    },
  },
  {
    external_id: 'energy',
    type: 'enum',
    label: 'Energy',
    mandatory: false,
    datasource: {
      values: [
        { external_id: 'low', value: 'Low' },
        { external_id: 'medium', value: 'Medium' },
        { external_id: 'high', value: 'High' },
      ],
    },
  },
  {
    external_id: 'palette_mode',
    type: 'enum',
    label: 'Palette Mode',
    mandatory: false,
    datasource: {
      values: [
        { external_id: 'light', value: 'Light' },
        { external_id: 'dark', value: 'Dark' },
        { external_id: 'neutral', value: 'Neutral' },
      ],
    },
  },
  {
    external_id: 'tone',
    type: 'string',
    label: 'Tone',
    mandatory: false,
  },
  {
    external_id: 'palette_primary',
    type: 'string',
    label: 'Primary Palette Color',
    mandatory: false,
  },
  {
    external_id: 'usage_notes',
    type: 'string',
    label: 'Usage Notes',
    mandatory: false,
  },

  // ============================================================================
  // Vector-Specific Fields
  // ============================================================================
  {
    external_id: 'vector_type',
    type: 'enum',
    label: 'Vector Type',
    mandatory: false,
    datasource: {
      values: [
        { external_id: 'stroke', value: 'Stroke' },
        { external_id: 'filled', value: 'Filled' },
        { external_id: 'mixed', value: 'Mixed' },
      ],
    },
  },
  {
    external_id: 'complexity',
    type: 'enum',
    label: 'Complexity',
    mandatory: false,
    datasource: {
      values: [
        { external_id: 'low', value: 'Low' },
        { external_id: 'medium', value: 'Medium' },
        { external_id: 'high', value: 'High' },
      ],
    },
  },
  {
    external_id: 'is_themable',
    type: 'integer',
    label: 'Is Themable',
    mandatory: false,
  },
  {
    external_id: 'is_invertible',
    type: 'integer',
    label: 'Is Invertible',
    mandatory: false,
  },

  // ============================================================================
  // System Fields
  // ============================================================================
  {
    external_id: 'enrichment_version',
    type: 'integer',
    label: 'Enrichment Version',
    mandatory: false,
    default_value: 1,
  },
  {
    external_id: 'enriched_at',
    type: 'date',
    label: 'Enriched At',
    mandatory: false,
  },
  {
    external_id: 'content_hash',
    type: 'string',
    label: 'Content Hash',
    mandatory: false,
  },
];

// ============================================================================
// Validation Helpers
// ============================================================================

export function isVectorAsset(metadata: AssetMetadata): boolean {
  return metadata.asset_class === 'vector';
}

export function isRasterAsset(metadata: AssetMetadata): boolean {
  return metadata.asset_class === 'raster';
}

export function requiresVectorMetadata(metadata: AssetMetadata): boolean {
  return isVectorAsset(metadata);
}

export function isApproved(metadata: AssetMetadata): boolean {
  return metadata.lifecycle_status === 'approved';
}

export function isDraft(metadata: AssetMetadata): boolean {
  return metadata.lifecycle_status === 'draft';
}

export function isDeprecated(metadata: AssetMetadata): boolean {
  return metadata.lifecycle_status === 'deprecated';
}
