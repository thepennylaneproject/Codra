/**
 * BRAND VOICE
 * src/lib/copy/brand-voice.ts
 * 
 * Brand voice memory system to solve the "homogenization" pain point.
 * Trains AI on specific tone, vocabulary, and approved examples.
 */

export interface BrandVoiceConfig {
    id: string;
    projectId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    
    // Core personality
    personality: {
        descriptors: string[]; // e.g., ["witty", "professional", "conversational"]
        avoidDescriptors: string[]; // e.g., ["corporate", "stiff", "salesy"]
    };
    
    // Vocabulary preferences
    vocabulary: {
        preferred: string[]; // Words/phrases to use
        avoid: string[]; // Words/phrases to never use
        brandTerms: Record<string, string>; // Term mappings, e.g., "customers" -> "creators"
    };
    
    // Tone settings
    tone: {
        formality: 'casual' | 'conversational' | 'professional' | 'formal';
        humor: 'none' | 'subtle' | 'playful' | 'irreverent';
        confidence: 'humble' | 'balanced' | 'bold' | 'authoritative';
        warmth: 'cool' | 'neutral' | 'warm' | 'enthusiastic';
    };
    
    // Examples for training
    examples: {
        approved: ApprovedExample[];
        rejected: RejectedExample[];
    };
    
    // AI-specific anti-patterns
    aiPatterns: {
        avoidPhrases: string[]; // Generic AI phrases to avoid
        avoidStructures: string[]; // Patterns like "In today's fast-paced world..."
    };
}

export interface ApprovedExample {
    id: string;
    category: 'headline' | 'body' | 'cta' | 'tagline' | 'email' | 'social';
    content: string;
    notes?: string;
}

export interface RejectedExample {
    id: string;
    category: string;
    content: string;
    reason: string;
}

// Default AI phrases to avoid (the "AI voice" problem)
export const DEFAULT_AI_AVOID_PHRASES = [
    "In today's fast-paced world",
    "In the ever-evolving landscape",
    "It's not just about",
    "At the end of the day",
    "Let's dive in",
    "Without further ado",
    "Game-changer",
    "Cutting-edge",
    "Best-in-class",
    "Leverage",
    "Synergy",
    "Delve into",
    "Paradigm shift",
    "Elevate your",
    "Unlock the power of",
    "Seamlessly",
    "Robust",
    "Holistic approach",
    "Move the needle",
    "Circle back",
    "Low-hanging fruit",
    "Take it to the next level",
    "Empower",
    "Revolutionary",
    "Transformative",
];

// Default patterns to avoid
export const DEFAULT_AI_AVOID_STRUCTURES = [
    "Are you tired of [problem]?",
    "Imagine a world where...",
    "But wait, there's more!",
    "What if I told you...",
    "[Topic] is not just [X], it's [Y]",
];

/**
 * Brand Voice Manager
 */
export class BrandVoiceManager {
    private config: BrandVoiceConfig | null = null;
    private storageKey: string;

    constructor(projectId: string) {
        this.storageKey = `codra:brandVoice:${projectId}`;
        this.config = this.loadConfig();
    }

    /**
     * Initialize or create brand voice config
     */
    initialize(name: string = 'Default Voice'): BrandVoiceConfig {
        if (this.config) return this.config;

        const now = new Date().toISOString();
        this.config = {
            id: crypto.randomUUID(),
            projectId: this.storageKey.replace('codra:brandVoice:', ''),
            name,
            createdAt: now,
            updatedAt: now,
            personality: {
                descriptors: [],
                avoidDescriptors: [],
            },
            vocabulary: {
                preferred: [],
                avoid: [],
                brandTerms: {},
            },
            tone: {
                formality: 'conversational',
                humor: 'subtle',
                confidence: 'balanced',
                warmth: 'warm',
            },
            examples: {
                approved: [],
                rejected: [],
            },
            aiPatterns: {
                avoidPhrases: [...DEFAULT_AI_AVOID_PHRASES],
                avoidStructures: [...DEFAULT_AI_AVOID_STRUCTURES],
            },
        };

        this.saveConfig();
        return this.config;
    }

    /**
     * Get current config
     */
    getConfig(): BrandVoiceConfig | null {
        return this.config;
    }

    /**
     * Update personality descriptors
     */
    setPersonality(descriptors: string[], avoidDescriptors: string[]): void {
        if (!this.config) this.initialize();
        this.config!.personality = { descriptors, avoidDescriptors };
        this.touch();
    }

    /**
     * Update tone settings
     */
    setTone(tone: Partial<BrandVoiceConfig['tone']>): void {
        if (!this.config) this.initialize();
        this.config!.tone = { ...this.config!.tone, ...tone };
        this.touch();
    }

    /**
     * Add preferred term
     */
    addPreferredTerm(term: string): void {
        if (!this.config) this.initialize();
        if (!this.config!.vocabulary.preferred.includes(term)) {
            this.config!.vocabulary.preferred.push(term);
            this.touch();
        }
    }

    /**
     * Add term to avoid
     */
    addAvoidTerm(term: string): void {
        if (!this.config) this.initialize();
        if (!this.config!.vocabulary.avoid.includes(term)) {
            this.config!.vocabulary.avoid.push(term);
            this.touch();
        }
    }

    /**
     * Add brand term mapping
     */
    addBrandTerm(generic: string, branded: string): void {
        if (!this.config) this.initialize();
        this.config!.vocabulary.brandTerms[generic.toLowerCase()] = branded;
        this.touch();
    }

    /**
     * Add approved example
     */
    addApprovedExample(category: ApprovedExample['category'], content: string, notes?: string): string {
        if (!this.config) this.initialize();
        const id = crypto.randomUUID();
        this.config!.examples.approved.push({ id, category, content, notes });
        this.touch();
        return id;
    }

    /**
     * Add rejected example
     */
    addRejectedExample(category: string, content: string, reason: string): string {
        if (!this.config) this.initialize();
        const id = crypto.randomUUID();
        this.config!.examples.rejected.push({ id, category, content, reason });
        this.touch();
        return id;
    }

    /**
     * Generate prompt instructions from brand voice
     */
    generatePromptInstructions(): string {
        if (!this.config) return '';

        const sections: string[] = [];

        // Personality
        if (this.config.personality.descriptors.length > 0) {
            sections.push(`## Brand Personality
Be: ${this.config.personality.descriptors.join(', ')}
${this.config.personality.avoidDescriptors.length > 0 ? `Avoid being: ${this.config.personality.avoidDescriptors.join(', ')}` : ''}`);
        }

        // Tone
        sections.push(`## Tone Settings
- Formality: ${this.config.tone.formality}
- Humor: ${this.config.tone.humor}
- Confidence: ${this.config.tone.confidence}
- Warmth: ${this.config.tone.warmth}`);

        // Vocabulary
        if (this.config.vocabulary.preferred.length > 0) {
            sections.push(`## Preferred Language
Use these words/phrases: ${this.config.vocabulary.preferred.join(', ')}`);
        }

        if (this.config.vocabulary.avoid.length > 0) {
            sections.push(`## Words to Avoid
Never use: ${this.config.vocabulary.avoid.join(', ')}`);
        }

        // Brand terms
        const brandTerms = Object.entries(this.config.vocabulary.brandTerms);
        if (brandTerms.length > 0) {
            sections.push(`## Brand Terminology
${brandTerms.map(([generic, branded]) => `- Say "${branded}" instead of "${generic}"`).join('\n')}`);
        }

        // AI anti-patterns
        if (this.config.aiPatterns.avoidPhrases.length > 0) {
            sections.push(`## Anti-Patterns (Critical)
NEVER use these generic AI phrases:
${this.config.aiPatterns.avoidPhrases.slice(0, 10).map(p => `- "${p}"`).join('\n')}`);
        }

        // Examples
        const approvedExamples = this.config.examples.approved.slice(-3);
        if (approvedExamples.length > 0) {
            sections.push(`## Example Copy (Match This Style)
${approvedExamples.map(e => `[${e.category.toUpperCase()}] "${e.content}"`).join('\n')}`);
        }

        return sections.join('\n\n');
    }

    /**
     * Quick voice check - does content match brand voice?
     */
    quickCheck(content: string): {
        score: number;
        issues: Array<{ type: string; found: string; suggestion?: string }>;
    } {
        if (!this.config) return { score: 100, issues: [] };

        const issues: Array<{ type: string; found: string; suggestion?: string }> = [];
        const lowerContent = content.toLowerCase();

        // Check for avoided phrases
        for (const phrase of this.config.aiPatterns.avoidPhrases) {
            if (lowerContent.includes(phrase.toLowerCase())) {
                issues.push({
                    type: 'ai-phrase',
                    found: phrase,
                    suggestion: 'Rephrase to be more authentic',
                });
            }
        }

        // Check for avoided vocabulary
        for (const word of this.config.vocabulary.avoid) {
            if (lowerContent.includes(word.toLowerCase())) {
                issues.push({
                    type: 'avoided-word',
                    found: word,
                    suggestion: `Find an alternative to "${word}"`,
                });
            }
        }

        // Check for brand term opportunities
        for (const [generic, branded] of Object.entries(this.config.vocabulary.brandTerms)) {
            if (lowerContent.includes(generic) && !lowerContent.includes(branded.toLowerCase())) {
                issues.push({
                    type: 'brand-term',
                    found: generic,
                    suggestion: `Use "${branded}" instead`,
                });
            }
        }

        // Calculate score
        const maxIssues = 10;
        const score = Math.max(0, 100 - (issues.length * (100 / maxIssues)));

        return { score: Math.round(score), issues };
    }

    /**
     * Update lastModified and save
     */
    private touch(): void {
        if (this.config) {
            this.config.updatedAt = new Date().toISOString();
            this.saveConfig();
        }
    }

    /**
     * Load config from localStorage
     */
    private loadConfig(): BrandVoiceConfig | null {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Save config to localStorage
     */
    private saveConfig(): void {
        if (this.config) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.config));
            } catch (e) {
                console.error('Failed to save brand voice:', e);
            }
        }
    }

    /**
     * Clear brand voice
     */
    clear(): void {
        this.config = null;
        localStorage.removeItem(this.storageKey);
    }
}

/**
 * Create brand voice manager instance
 */
export function createBrandVoiceManager(projectId: string): BrandVoiceManager {
    return new BrandVoiceManager(projectId);
}
