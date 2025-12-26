/**
 * IMAGE SEED PRESERVATION
 * src/lib/image/seed-preservation.ts
 * 
 * Stores generation seeds with images for targeted regeneration.
 * Includes anti-slop style controls for authentic image aesthetics.
 */

export interface GenerationSeed {
    id: string;
    projectId: string;
    assetId: string;
    seed: number;
    prompt: string;
    negativePrompt?: string;
    style: ImageStyle;
    model: string;
    provider: string;
    dimensions: { width: number; height: number };
    createdAt: string;
    metadata?: Record<string, unknown>;
}

/**
 * Anti-slop style presets
 * Addresses the "Slop Effect" where AI images look too polished/generic
 */
export type ImageStyle = 
    | 'organic'      // Film grain, lens blur, asymmetry
    | 'editorial'    // High contrast, fashion photography style
    | 'raw'          // Minimal post-processing aesthetic
    | 'cinematic'    // Movie-like color grading
    | 'documentary'  // Authentic, unposed feeling
    | 'default';     // Standard AI aesthetic (polished)

export interface StylePreset {
    id: ImageStyle;
    name: string;
    description: string;
    icon: string;
    promptModifiers: string[];
    negativeModifiers: string[];
    temperature?: number;
}

export const STYLE_PRESETS: Record<ImageStyle, StylePreset> = {
    organic: {
        id: 'organic',
        name: 'Organic',
        description: 'Natural imperfections, film grain, slight blur',
        icon: '🌿',
        promptModifiers: [
            'shot on 35mm film',
            'natural lighting',
            'subtle film grain',
            'slight lens blur',
            'authentic moment',
            'candid',
        ],
        negativeModifiers: [
            'perfect',
            'flawless',
            'airbrushed',
            'ultra sharp',
            'HDR',
            'oversaturated',
        ],
    },
    editorial: {
        id: 'editorial',
        name: 'Editorial',
        description: 'Fashion photography, high contrast, intentional',
        icon: '📸',
        promptModifiers: [
            'editorial photography',
            'high fashion',
            'dramatic lighting',
            'strong contrast',
            'intentional composition',
            'magazine cover quality',
        ],
        negativeModifiers: [
            'amateur',
            'snapshot',
            'low quality',
            'flat lighting',
        ],
    },
    raw: {
        id: 'raw',
        name: 'Raw',
        description: 'Minimal processing, authentic textures',
        icon: '🎞️',
        promptModifiers: [
            'RAW photograph',
            'unedited',
            'natural colors',
            'available light',
            'documentary style',
            'real textures',
        ],
        negativeModifiers: [
            'retouched',
            'filtered',
            'enhanced',
            'color graded',
            'smooth skin',
        ],
    },
    cinematic: {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Movie-like color grading and composition',
        icon: '🎬',
        promptModifiers: [
            'cinematic',
            'anamorphic lens',
            'movie still',
            'color graded',
            'dramatic',
            'widescreen composition',
        ],
        negativeModifiers: [
            'flat',
            'boring composition',
            'amateur',
        ],
    },
    documentary: {
        id: 'documentary',
        name: 'Documentary',
        description: 'Authentic, unposed, real moments',
        icon: '📰',
        promptModifiers: [
            'documentary photography',
            'photojournalism',
            'authentic moment',
            'unposed',
            'natural expression',
            'real life',
        ],
        negativeModifiers: [
            'staged',
            'posed',
            'perfect',
            'artificial',
            'stock photo',
        ],
    },
    default: {
        id: 'default',
        name: 'Standard',
        description: 'Default AI aesthetic (polished)',
        icon: '✨',
        promptModifiers: [],
        negativeModifiers: [],
    },
};

/**
 * Seed Preservation Manager
 */
export class SeedPreservationManager {
    private seeds: Map<string, GenerationSeed> = new Map();
    private storageKey: string;

    constructor(projectId: string) {
        this.storageKey = `codra:seeds:${projectId}`;
        this.loadSeeds();
    }

    /**
     * Store a generation seed
     */
    storeSeed(seed: Omit<GenerationSeed, 'id' | 'createdAt'>): string {
        const id = crypto.randomUUID();
        const entry: GenerationSeed = {
            ...seed,
            id,
            createdAt: new Date().toISOString(),
        };
        
        this.seeds.set(id, entry);
        this.saveSeeds();
        return id;
    }

    /**
     * Get seed by ID
     */
    getSeed(id: string): GenerationSeed | null {
        return this.seeds.get(id) || null;
    }

    /**
     * Get seed by asset ID
     */
    getSeedByAssetId(assetId: string): GenerationSeed | null {
        for (const seed of this.seeds.values()) {
            if (seed.assetId === assetId) {
                return seed;
            }
        }
        return null;
    }

    /**
     * Get all seeds for project
     */
    getAllSeeds(): GenerationSeed[] {
        return Array.from(this.seeds.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    /**
     * Create a variation prompt (keep seed, modify prompt)
     */
    createVariation(seedId: string, newPrompt: string): {
        seed: number;
        prompt: string;
        style: ImageStyle;
    } | null {
        const original = this.getSeed(seedId);
        if (!original) return null;

        return {
            seed: original.seed,
            prompt: newPrompt,
            style: original.style,
        };
    }

    /**
     * Create an exploration (new seed, same prompt)
     */
    createExploration(seedId: string): {
        seed: number;
        prompt: string;
        style: ImageStyle;
    } | null {
        const original = this.getSeed(seedId);
        if (!original) return null;

        return {
            seed: Math.floor(Math.random() * 2147483647), // New random seed
            prompt: original.prompt,
            style: original.style,
        };
    }

    /**
     * Delete a seed
     */
    deleteSeed(id: string): boolean {
        const deleted = this.seeds.delete(id);
        if (deleted) this.saveSeeds();
        return deleted;
    }

    /**
     * Load seeds from localStorage
     */
    private loadSeeds(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as GenerationSeed[];
                this.seeds = new Map(parsed.map(s => [s.id, s]));
            }
        } catch (e) {
            console.error('Failed to load seeds:', e);
        }
    }

    /**
     * Save seeds to localStorage
     */
    private saveSeeds(): void {
        try {
            const seeds = Array.from(this.seeds.values());
            localStorage.setItem(this.storageKey, JSON.stringify(seeds));
        } catch (e) {
            console.error('Failed to save seeds:', e);
        }
    }

    /**
     * Clear all seeds
     */
    clear(): void {
        this.seeds.clear();
        localStorage.removeItem(this.storageKey);
    }
}

/**
 * Apply style preset to a prompt
 */
export function applyStyleToPrompt(
    prompt: string,
    style: ImageStyle,
    existingNegative?: string
): { prompt: string; negativePrompt: string } {
    const preset = STYLE_PRESETS[style];
    
    // Add style modifiers to prompt
    const modifiedPrompt = preset.promptModifiers.length > 0
        ? `${prompt}, ${preset.promptModifiers.slice(0, 3).join(', ')}`
        : prompt;
    
    // Combine negative prompts
    const negativePrompt = [
        existingNegative,
        ...preset.negativeModifiers.slice(0, 3),
    ].filter(Boolean).join(', ');
    
    return { prompt: modifiedPrompt, negativePrompt };
}

/**
 * Generate a random seed
 */
export function generateRandomSeed(): number {
    return Math.floor(Math.random() * 2147483647);
}

/**
 * Create a seed preservation manager instance
 */
export function createSeedManager(projectId: string): SeedPreservationManager {
    return new SeedPreservationManager(projectId);
}
