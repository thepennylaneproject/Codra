/**
 * ASSISTANT REGISTRY
 * Central repository for Assistant's visual assets and layer taxonomy.
 * 
 * Diversity & Editorial Excellence:
 * Assets are curated to support a global range of identities and a 
 * professional editorial aesthetic.
 */

import { AssistantBase, AssistantVisualLayer, AssistantExpression } from '../../domain/types';

// ============================================
// Bases (Body Shapes & Skin Tones)
// ============================================

export const ASSISTANT_BASES: AssistantBase[] = [
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

export const ASSISTANT_EXPRESSIONS: AssistantExpression[] = [
    'neutral',
    'focused',
    'inspired',
    'thoughtful',
    'playful',
];

// ============================================
// Hair
// ============================================

export const ASSISTANT_HAIR: AssistantVisualLayer[] = [
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

export const ASSISTANT_CLOTHING: AssistantVisualLayer[] = [
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

export const ASSISTANT_ACCESSORIES: AssistantVisualLayer[] = [
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

export const DEFAULT_ASSISTANT_APPEARANCE = {
    baseId: ASSISTANT_BASES[0].id,
    expression: 'neutral' as AssistantExpression,
    layers: {
        hair: ASSISTANT_HAIR[0].id,
        clothing: ASSISTANT_CLOTHING[0].id,
        accessory: null,
    },
};

/**
 * Get all assets for a specific category
 */
export function getAssetsByCategory(category: 'hair' | 'clothing' | 'accessory'): AssistantVisualLayer[] {
    switch (category) {
        case 'hair': return ASSISTANT_HAIR;
        case 'clothing': return ASSISTANT_CLOTHING;
        case 'accessory': return ASSISTANT_ACCESSORIES;
    }
}

/**
 * Get a specific asset by ID
 */
export function getAssetById(id: string): AssistantVisualLayer | AssistantBase | null {
    return [
        ...ASSISTANT_BASES,
        ...ASSISTANT_HAIR,
        ...ASSISTANT_CLOTHING,
        ...ASSISTANT_ACCESSORIES,
    ].find(a => a.id === id) || null;
}
