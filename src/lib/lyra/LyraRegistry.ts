/**
 * LYRA REGISTRY
 * Central repository for Lyra's visual assets and layer taxonomy.
 * 
 * Diversity & Editorial Excellence:
 * Assets are curated to support a global range of identities and a 
 * professional editorial aesthetic.
 */

import { LyraBase, LyraVisualLayer, LyraExpression } from '../../domain/types';

// ============================================
// Bases (Body Shapes & Skin Tones)
// ============================================

export const LYRA_BASES: LyraBase[] = [
    {
        id: 'base-slender-fair',
        label: 'Slender (Fair)',
        bodyShape: 'slender',
        skinTone: 'fair',
        assetUrl: '/assets/lyra/bases/slender_fair.svg',
    },
    {
        id: 'base-curvy-tan',
        label: 'Curvy (Tan)',
        bodyShape: 'curvy',
        skinTone: 'tan',
        assetUrl: '/assets/lyra/bases/curvy_tan.svg',
    },
    {
        id: 'base-broad-warm',
        label: 'Broad (Warm)',
        bodyShape: 'broad',
        skinTone: 'warm',
        assetUrl: '/assets/lyra/bases/broad_warm.svg',
    },
    {
        id: 'base-soft-deep',
        label: 'Soft (Deep)',
        bodyShape: 'soft',
        skinTone: 'deep',
        assetUrl: '/assets/lyra/bases/soft_deep.svg',
    },
    {
        id: 'base-athletic-ebony',
        label: 'Athletic (Ebony)',
        bodyShape: 'athletic',
        skinTone: 'ebony',
        assetUrl: '/assets/lyra/bases/athletic_ebony.svg',
    },
];

// ============================================
// Expressions
// ============================================

export const LYRA_EXPRESSIONS: LyraExpression[] = [
    'neutral',
    'focused',
    'inspired',
    'thoughtful',
    'playful',
];

// ============================================
// Hair
// ============================================

export const LYRA_HAIR: LyraVisualLayer[] = [
    {
        id: 'hair-pixie-black',
        category: 'hair',
        label: 'Pixie (Black)',
        assetUrl: '/assets/lyra/hair/pixie_black.svg',
    },
    {
        id: 'hair-locs-warm',
        category: 'hair',
        label: 'Locs (Warm)',
        assetUrl: '/assets/lyra/hair/locs_warm.svg',
    },
    {
        id: 'hair-bob-silver',
        category: 'hair',
        label: 'Bob (Silver)',
        assetUrl: '/assets/lyra/hair/bob_silver.svg',
    },
    {
        id: 'hair-fade-natural',
        category: 'hair',
        label: 'Fade (Natural)',
        assetUrl: '/assets/lyra/hair/fade_natural.svg',
    },
    {
        id: 'hair-ponytail-auburn',
        category: 'hair',
        label: 'Ponytail (Auburn)',
        assetUrl: '/assets/lyra/hair/ponytail_auburn.svg',
    },
];

// ============================================
// Clothing (Outfits)
// ============================================

export const LYRA_CLOTHING: LyraVisualLayer[] = [
    {
        id: 'outfit-blazer-editorial',
        category: 'clothing',
        label: 'Editorial Blazer',
        assetUrl: '/assets/lyra/clothing/blazer.svg',
    },
    {
        id: 'outfit-turtleneck-minimal',
        category: 'clothing',
        label: 'Minimal Turtleneck',
        assetUrl: '/assets/lyra/clothing/turtleneck.svg',
    },
    {
        id: 'outfit-suit-structured',
        category: 'clothing',
        label: 'Structured Suit',
        assetUrl: '/assets/lyra/clothing/suit.svg',
    },
    {
        id: 'outfit-cardigan-studio',
        category: 'clothing',
        label: 'Studio Cardigan',
        assetUrl: '/assets/lyra/clothing/cardigan.svg',
    },
];

// ============================================
// Accessories
// ============================================

export const LYRA_ACCESSORIES: LyraVisualLayer[] = [
    {
        id: 'acc-glasses-thick',
        category: 'accessory',
        label: 'Thick Frames',
        assetUrl: '/assets/lyra/accessories/glasses_thick.svg',
    },
    {
        id: 'acc-headphones-pro',
        category: 'accessory',
        label: 'Pro Headphones',
        assetUrl: '/assets/lyra/accessories/headphones.svg',
    },
    {
        id: 'acc-camera-vintage',
        category: 'accessory',
        label: 'Vintage Camera',
        assetUrl: '/assets/lyra/accessories/camera.svg',
    },
    {
        id: 'acc-hijab-silk',
        category: 'accessory',
        label: 'Silk Headscarf',
        assetUrl: '/assets/lyra/accessories/hijab.svg',
    },
];

// ============================================
// Registry Helpers
// ============================================

export const DEFAULT_LYRA_APPEARANCE = {
    baseId: LYRA_BASES[0].id,
    expression: 'neutral' as LyraExpression,
    layers: {
        hair: LYRA_HAIR[0].id,
        clothing: LYRA_CLOTHING[0].id,
        accessory: null,
    },
};

/**
 * Get all assets for a specific category
 */
export function getAssetsByCategory(category: 'hair' | 'clothing' | 'accessory'): LyraVisualLayer[] {
    switch (category) {
        case 'hair': return LYRA_HAIR;
        case 'clothing': return LYRA_CLOTHING;
        case 'accessory': return LYRA_ACCESSORIES;
    }
}

/**
 * Get a specific asset by ID
 */
export function getAssetById(id: string): LyraVisualLayer | LyraBase | null {
    return [
        ...LYRA_BASES,
        ...LYRA_HAIR,
        ...LYRA_CLOTHING,
        ...LYRA_ACCESSORIES,
    ].find(a => a.id === id) || null;
}
