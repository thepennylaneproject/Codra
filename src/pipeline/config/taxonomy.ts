/**
 * Asset Taxonomy Constants
 *
 * Centralized definitions for all classification values.
 */

// ============================================================================
// Folder Structure
// ============================================================================

export const FOLDER_STRUCTURE = {
  ROOT: 'codra',
  RASTER: 'codra/raster',
  VECTOR: 'codra/vector',

  // Raster subfolders
  RASTER_HERO: 'codra/raster/hero',
  RASTER_BACKGROUND: 'codra/raster/background',
  RASTER_TEXTURE: 'codra/raster/texture',
  RASTER_PHOTOGRAPHY: 'codra/raster/photography',

  // Vector subfolders
  VECTOR_ICON: 'codra/vector/icon',
  VECTOR_ILLUSTRATION: 'codra/vector/illustration',
  VECTOR_UI: 'codra/vector/ui',
  VECTOR_PATTERN: 'codra/vector/pattern',
  VECTOR_MARK: 'codra/vector/mark',
} as const;

/**
 * Map asset roles to canonical folders
 */
export function getFolderForRole(
  assetClass: 'raster' | 'vector',
  role: string,
): string {
  if (assetClass === 'raster') {
    switch (role) {
      case 'hero':
        return FOLDER_STRUCTURE.RASTER_HERO;
      case 'texture':
        return FOLDER_STRUCTURE.RASTER_TEXTURE;
      case 'ui_screenshot':
      case 'feature_card':
        return FOLDER_STRUCTURE.RASTER_BACKGROUND;
      default:
        return FOLDER_STRUCTURE.RASTER;
    }
  } else {
    switch (role) {
      case 'icon':
        return FOLDER_STRUCTURE.VECTOR_ICON;
      case 'spot_illustration':
      case 'diagram':
        return FOLDER_STRUCTURE.VECTOR_ILLUSTRATION;
      case 'logo':
        return FOLDER_STRUCTURE.VECTOR_MARK;
      case 'texture':
        return FOLDER_STRUCTURE.VECTOR_PATTERN;
      default:
        return FOLDER_STRUCTURE.VECTOR;
    }
  }
}

// ============================================================================
// Upload Presets
// ============================================================================

/**
 * Upload preset configurations
 * These should be created in Cloudinary via Admin API or UI
 */
export const UPLOAD_PRESETS = {
  // Raster presets
  RASTER_HERO: 'preset_raster_hero',
  RASTER_TEXTURE: 'preset_raster_texture',
  RASTER_BACKGROUND: 'preset_raster_background',
  RASTER_FEATURE: 'preset_raster_feature',

  // Vector presets
  VECTOR_ICON: 'preset_vector_icon',
  VECTOR_ILLUSTRATION: 'preset_vector_illustration',
  VECTOR_LOGO: 'preset_vector_logo',
  VECTOR_UI: 'preset_vector_ui',
} as const;

/**
 * Upload preset definitions for programmatic creation
 */
export interface UploadPresetConfig {
  name: string;
  unsigned: false;
  folder: string;
  tags: string[];
  allowed_formats?: string[];
  transformation?: string;
  context?: Record<string, string>;
  // Structured metadata defaults
  metadata?: Record<string, string | number>;
}

export const UPLOAD_PRESET_CONFIGS: UploadPresetConfig[] = [
  // ============================================================================
  // Raster Presets
  // ============================================================================
  {
    name: UPLOAD_PRESETS.RASTER_HERO,
    unsigned: false,
    folder: FOLDER_STRUCTURE.RASTER_HERO,
    tags: ['raster', 'hero', 'auto-uploaded'],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: 'f_auto,q_auto',
    metadata: {
      asset_class: 'raster',
      asset_role: 'hero',
      lifecycle_status: 'draft',
      funnel_stage: 'awareness',
    },
  },
  {
    name: UPLOAD_PRESETS.RASTER_TEXTURE,
    unsigned: false,
    folder: FOLDER_STRUCTURE.RASTER_TEXTURE,
    tags: ['raster', 'texture', 'auto-uploaded'],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: 'f_auto,q_auto',
    metadata: {
      asset_class: 'raster',
      asset_role: 'texture',
      lifecycle_status: 'draft',
      funnel_stage: 'conversion',
    },
  },
  {
    name: UPLOAD_PRESETS.RASTER_BACKGROUND,
    unsigned: false,
    folder: FOLDER_STRUCTURE.RASTER_BACKGROUND,
    tags: ['raster', 'background', 'auto-uploaded'],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: 'f_auto,q_auto',
    metadata: {
      asset_class: 'raster',
      asset_role: 'feature_card',
      lifecycle_status: 'draft',
      funnel_stage: 'consideration',
    },
  },
  {
    name: UPLOAD_PRESETS.RASTER_FEATURE,
    unsigned: false,
    folder: FOLDER_STRUCTURE.RASTER_BACKGROUND,
    tags: ['raster', 'feature', 'auto-uploaded'],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: 'f_auto,q_auto',
    metadata: {
      asset_class: 'raster',
      asset_role: 'feature_card',
      lifecycle_status: 'draft',
      funnel_stage: 'consideration',
    },
  },

  // ============================================================================
  // Vector Presets
  // ============================================================================
  {
    name: UPLOAD_PRESETS.VECTOR_ICON,
    unsigned: false,
    folder: FOLDER_STRUCTURE.VECTOR_ICON,
    tags: ['vector', 'icon', 'auto-uploaded'],
    allowed_formats: ['svg'],
    metadata: {
      asset_class: 'vector',
      asset_role: 'icon',
      lifecycle_status: 'draft',
      funnel_stage: 'conversion',
      complexity: 'low',
    },
  },
  {
    name: UPLOAD_PRESETS.VECTOR_ILLUSTRATION,
    unsigned: false,
    folder: FOLDER_STRUCTURE.VECTOR_ILLUSTRATION,
    tags: ['vector', 'illustration', 'auto-uploaded'],
    allowed_formats: ['svg'],
    metadata: {
      asset_class: 'vector',
      asset_role: 'spot_illustration',
      lifecycle_status: 'draft',
      funnel_stage: 'consideration',
      complexity: 'medium',
    },
  },
  {
    name: UPLOAD_PRESETS.VECTOR_LOGO,
    unsigned: false,
    folder: FOLDER_STRUCTURE.VECTOR_MARK,
    tags: ['vector', 'logo', 'auto-uploaded'],
    allowed_formats: ['svg'],
    metadata: {
      asset_class: 'vector',
      asset_role: 'logo',
      lifecycle_status: 'draft',
      funnel_stage: 'awareness',
      complexity: 'low',
    },
  },
  {
    name: UPLOAD_PRESETS.VECTOR_UI,
    unsigned: false,
    folder: FOLDER_STRUCTURE.VECTOR_UI,
    tags: ['vector', 'ui', 'auto-uploaded'],
    allowed_formats: ['svg'],
    metadata: {
      asset_class: 'vector',
      asset_role: 'icon',
      lifecycle_status: 'draft',
      funnel_stage: 'retention',
      complexity: 'low',
    },
  },
];

// ============================================================================
// AI Enrichment Taxonomy
// ============================================================================

/**
 * Tag vocabulary for AI enrichment
 */
export const TAG_TAXONOMY = {
  VISUAL_STYLE: [
    'minimal',
    'modern',
    'abstract',
    'geometric',
    'gradient-heavy',
    '3d',
    'flat',
    'line-art',
    'illustrated',
    'spacious',
    'layered',
  ],
  COLOR_THEMES: [
    'warm-palette',
    'cool-palette',
    'neutral-palette',
    'gold-accent',
    'teal-accent',
    'purple-accent',
    'translucent',
    'monochrome',
    'vibrant',
    'muted',
  ],
  COMPOSITION: [
    'centered',
    'asymmetric',
    'flowing',
    'structured',
    'organic',
  ],
  EFFECTS: ['glow', 'glass-effect', 'shadow', 'blur', 'gradient'],
} as const;

/**
 * Tone vocabulary (normalized from "mood")
 */
export const TONE_VALUES = [
  'professional',
  'innovative',
  'trustworthy',
  'sophisticated',
  'approachable',
  'energetic',
  'calm',
  'bold',
  'playful',
  'serious',
] as const;

/**
 * AI prompt for visual analysis
 */
export const AI_ENRICHMENT_PROMPT = `You are an expert visual designer analyzing design assets for a production asset management system.

Analyze this image and return ONLY a JSON object with this EXACT structure:
{
  "tags": ["tag1", "tag2", ...],
  "tone": "one word from allowed list",
  "palette_primary": "hex color",
  "usage_notes": "brief description"
}

Select tags from these categories (only use tags that clearly apply):

Visual Style: ${TAG_TAXONOMY.VISUAL_STYLE.join(', ')}
Color Themes: ${TAG_TAXONOMY.COLOR_THEMES.join(', ')}
Composition: ${TAG_TAXONOMY.COMPOSITION.join(', ')}
Effects: ${TAG_TAXONOMY.EFFECTS.join(', ')}

Allowed tone values: ${TONE_VALUES.join(', ')}

Rules:
- Return 8-15 relevant tags
- Only include tags you're confident about
- Tone must be exactly one word from the allowed list
- palette_primary must be a hex color (e.g., "#1A5FB4")
- usage_notes should be 1-2 sentences describing ideal use cases
- Return ONLY valid JSON, no markdown or explanation`;
