/**
 * THE TASTE GOVERNOR
 * 
 * "Guardians of the Galaxy meets Apple"
 * 
 * This configuration object serves as the single source of truth for 
 * design intensity, decoration visibility, and "wow" factor constraints.
 * 
 * RULES:
 * 1. Fewer elements beats more detail.
 * 2. Contrast > decoration.
 * 3. One accent at a time.
 * 4. If it feels clever, tone it down.
 * 5. If it feels empty, add rhythm, not noise.
 */

export const TASTE_GOVERNOR = {
    // Global intensity scaler (0.0 - 1.0)
    // Use this to dampen all effects globally if needed
    intensity: 0.9,

    // Glassmorphism constraints
    glass: {
        // Apple-level restraint: subtle blur, never frosted
        blurstrength: 'xl', // 'md' | 'lg' | 'xl'
        opacity: 0.6, // Lower is more premium/Apple
        borderOpacity: 0.08, // Subtle hairline
        highlightOpacity: 0.15, // Top edge highlight
        frosted: false, // NEVER true for this aesthetic
    },

    // Animation constraints
    motion: {
        reduced: false, // User preference override
        speed: {
            instant: 0.1, // Apple snap
            expressive: 0.4, // Guardians flow
        },
        // "Golden Thread" only appears on interaction
        shimmerIntensity: 0.2, // 0-1
    },

    // Layout & Density
    layout: {
        // "Silence where others shout"
        whitespace: 'generous', // 'compact' | 'standard' | 'generous'
        borderRadius: 'xl', // 'lg' | 'xl' | '2xl'
    },

    // Color logic
    color: {
        // "Cosmic without chaos"
        allowGradients: true, // But only controlled ones
        gradientOpacity: 0.12, // Very subtle background blends
        textContrast: {
            primary: 0.98, // Nearly pure white/black
            secondary: 0.6, // Legible hierarchy
            muted: 0.4, // Receded information
        }
    },

    // Asset Generation Prompts (for runtime reference)
    prompts: {
        masterConstraint: `
      Aesthetic Guardrails:
      This design must feel like Guardians of the Galaxy meets Apple.
      
      Guardians:
      - Cosmic, rhythmic, dimensional
      - Slightly playful, musical, human
      - Tech feels alive, not sterile
      - No hard sci-fi clichés
      
      Apple:
      - Extreme restraint
      - Clean hierarchy
      - High legibility
      - Confidence through simplicity
      - Nothing ornamental without purpose
      
      Rule:
      If an element is decorative, it must be subtle enough to disappear when content is present.
    `
    }
} as const;

// Helper type for consumption
export type TasteConfig = typeof TASTE_GOVERNOR;
