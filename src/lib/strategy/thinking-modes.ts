/**
 * THINKING MODES
 * src/lib/strategy/thinking-modes.ts
 * 
 * Different AI behavior modes to combat "atrophied creativity" and "groupthink."
 * Allows switching between convergent (efficient) and divergent (exploratory) thinking.
 */

export type ThinkingMode = 'convergent' | 'divergent' | 'devils-advocate' | 'chaos';

export interface ThinkingModeConfig {
    id: ThinkingMode;
    name: string;
    description: string;
    icon: string;
    promptPrefix: string;
    outputFormat?: 'single' | 'multiple' | 'ranked';
    temperature?: number; // Higher = more creative
}

export const THINKING_MODES: Record<ThinkingMode, ThinkingModeConfig> = {
    convergent: {
        id: 'convergent',
        name: 'Convergent',
        description: 'Direct, efficient, best answer first',
        icon: '',
        promptPrefix: `You are in CONVERGENT mode. Focus on THE BEST answer:
- Give one clear, well-reasoned response
- Prioritize practicality and proven approaches
- Be concise and actionable
- Skip enumeration, go straight to the recommendation`,
        outputFormat: 'single',
        temperature: 0.3,
    },
    divergent: {
        id: 'divergent',
        name: 'Divergent',
        description: 'Generate 5+ distinct approaches',
        icon: '',
        promptPrefix: `You are in DIVERGENT mode. Enumerate MULTIPLE different directions:
- Generate at least 5 distinctly different approaches
- Include at least one unconventional/unexpected option
- Don't pre-judge - include ideas that might seem risky
- Briefly explain the unique angle of each approach
- Format as numbered list with short descriptions`,
        outputFormat: 'multiple',
        temperature: 0.9,
    },
    'devils-advocate': {
        id: 'devils-advocate',
        name: "Devil's Advocate",
        description: 'Challenge every assumption',
        icon: '',
        promptPrefix: `You are in DEVIL'S ADVOCATE mode. Challenge and critique:
- Identify weaknesses, risks, and potential failures
- Question assumptions that seem "obvious"
- Play the role of a skeptical stakeholder
- Suggest what could go wrong
- Be constructively critical, not destructive
- End with "How might we address these concerns?"`,
        outputFormat: 'single',
        temperature: 0.6,
    },
    chaos: {
        id: 'chaos',
        name: 'Chaos',
        description: 'Intentionally absurd ideas to break patterns',
        icon: '',
        promptPrefix: `You are in CHAOS mode. Break all patterns:
- Generate deliberately unusual, unexpected ideas
- Combine unrelated concepts
- Suggest approaches that might seem "wrong" at first
- Include at least one idea that makes you uncomfortable
- Don't self-censor - the goal is to break conventional thinking
- These are prompts for further analysis, not final solutions`,
        outputFormat: 'multiple',
        temperature: 1.0,
    },
};

/**
 * Get prompt prefix for a thinking mode
 */
export function getThinkingModePrompt(mode: ThinkingMode): string {
    return THINKING_MODES[mode].promptPrefix;
}

/**
 * Get recommended temperature for a thinking mode
 */
export function getThinkingModeTemperature(mode: ThinkingMode): number {
    return THINKING_MODES[mode].temperature || 0.7;
}

/**
 * Format output based on thinking mode expectations
 */
export function formatForThinkingMode(mode: ThinkingMode, response: string): {
    items: string[];
    isSingleAnswer: boolean;
} {
    const config = THINKING_MODES[mode];
    
    if (config.outputFormat === 'single') {
        return { items: [response], isSingleAnswer: true };
    }
    
    // Try to parse numbered list
    const lines = response.split('\n').filter(l => l.trim());
    const items: string[] = [];
    let currentItem = '';
    
    for (const line of lines) {
        if (/^\d+[.)]\s/.test(line)) {
            if (currentItem) items.push(currentItem.trim());
            currentItem = line.replace(/^\d+[.)]\s/, '');
        } else if (currentItem) {
            currentItem += ' ' + line;
        }
    }
    if (currentItem) items.push(currentItem.trim());
    
    return { items: items.length > 0 ? items : [response], isSingleAnswer: false };
}

// ============================================
// Disagreement Preservation
// ============================================

export interface DisagreementPoint {
    id: string;
    topic: string;
    positions: Array<{
        stance: string;
        reasoning: string;
        strength: 'strong' | 'moderate' | 'weak';
    }>;
    resolved: boolean;
    resolution?: string;
}

export interface SynthesisView {
    consensus: string;
    tensions: DisagreementPoint[];
    outliers: string[];
}

/**
 * Extract disagreement points from a discussion
 */
export function extractDisagreements(content: string): DisagreementPoint[] {
    // This would ideally use AI to extract, but for now we look for patterns
    const disagreements: DisagreementPoint[] = [];
    
    // Look for "however", "but", "on the other hand", "alternatively"
    const contrastPatterns = [
        /however[,\s]+(.+?)(?:\.|$)/gi,
        /on the other hand[,\s]+(.+?)(?:\.|$)/gi,
        /alternatively[,\s]+(.+?)(?:\.|$)/gi,
        /some argue[,\s]+(.+?)while others[,\s]+(.+?)(?:\.|$)/gi,
    ];
    
    for (const pattern of contrastPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            disagreements.push({
                id: crypto.randomUUID(),
                topic: 'Detected tension',
                positions: [
                    { stance: match[1], reasoning: 'Extracted from content', strength: 'moderate' },
                ],
                resolved: false,
            });
        }
    }
    
    return disagreements;
}

/**
 * Create a synthesis view from content
 */
export function createSynthesisView(
    consensusContent: string,
    allContent: string[]
): SynthesisView {
    const tensions = extractDisagreements(allContent.join('\n'));
    
    // Outliers would be populated by AI semantic analysis in production
    
    return {
        consensus: consensusContent,
        tensions,
        outliers: [], // Would be populated by AI analysis
    };
}
