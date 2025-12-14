/**
 * PROMPT ARCHITECT - Prompt Generator
 * src/lib/prompt-architect/prompt-generator.ts
 * 
 * Generates optimized prompts from user intent based on mode and context
 */

import {
    ArchitectMode,
    ArchitectContext,
    GeneratedPrompt,
    OutputType,
    MODE_CONFIGS,
    RetrievedSource,
} from './types';
import { costEngine } from '../ai/cost';
import { formatSourcesBlock, getGroundingInstructions } from '../retrieval/client';

// ============================================================
// Types
// ============================================================

interface GeneratePromptOptions {
    intent: string;
    mode: ArchitectMode;
    context: ArchitectContext;
    clarificationAnswers: Record<string, string>;
    selectedModel: string;
    detectedOutputType?: OutputType;
    /** Retrieved sources for grounding (optional) */
    sources?: RetrievedSource[];
    /** Whether grounding mode is enabled */
    groundingEnabled?: boolean;
}

// ============================================================
// Prompt Templates by Mode
// ============================================================

const MODE_PREFIXES: Record<ArchitectMode, string> = {
    fast: '',
    precise: 'Be clear and specific. ',
    production: 'Follow these instructions precisely. Ensure consistency and repeatability. ',
};

const MODE_SUFFIXES: Record<ArchitectMode, string> = {
    fast: '',
    precise: '\n\nProvide a well-structured response.',
    production: '\n\nEnsure the output is production-ready, well-documented, and follows best practices.',
};

// ============================================================
// System Prompt Templates
// ============================================================

const OUTPUT_TYPE_SYSTEM_PROMPTS: Partial<Record<OutputType, string>> = {
    code: `You are an expert software engineer. Write clean, well-documented, and maintainable code. Follow best practices and modern conventions.`,
    image: `You are a skilled visual artist and designer. Create vivid, detailed image descriptions that can be used for image generation.`,
    copy: `You are an experienced copywriter. Write compelling, clear, and engaging content that resonates with the target audience.`,
    component: `You are a senior UI/UX developer. Create accessible, reusable, and well-structured components following modern design patterns.`,
    api: `You are an API design expert. Create RESTful, well-documented, and secure API endpoints following OpenAPI conventions.`,
    documentation: `You are a technical writer. Create clear, comprehensive, and well-organized documentation.`,
};

// ============================================================
// Context Integration
// ============================================================

function buildContextSection(context: ArchitectContext): string {
    const sections: string[] = [];

    if (context.projectTitle) {
        sections.push(`Project: ${context.projectTitle}`);
    }

    if (context.taskDescription) {
        sections.push(`Task: ${context.taskDescription}`);
    }

    if (context.brandGuidance) {
        sections.push(`Brand Guidelines: ${context.brandGuidance}`);
    }

    if (context.designTokens && Object.keys(context.designTokens).length > 0) {
        const tokens = Object.entries(context.designTokens)
            .map(([key, value]) => `  - ${key}: ${value}`)
            .join('\n');
        sections.push(`Design Tokens:\n${tokens}`);
    }

    if (sections.length === 0) return '';

    return `\n\n--- Context ---\n${sections.join('\n')}\n---`;
}

function buildClarificationSection(answers: Record<string, string>): string {
    if (Object.keys(answers).length === 0) return '';

    const lines = Object.entries(answers)
        .filter(([, value]) => value.trim())
        .map(([, value]) => `- ${value}`);

    if (lines.length === 0) return '';

    return `\n\nAdditional Requirements:\n${lines.join('\n')}`;
}

// ============================================================
// Assumption Generation
// ============================================================

function generateAssumptions(
    intent: string,
    mode: ArchitectMode,
    context: ArchitectContext,
    outputType?: OutputType
): string[] {
    const assumptions: string[] = [];

    // Output type assumption
    if (outputType && !context.outputType) {
        assumptions.push(`Output type: ${outputType}`);
    }

    // Mode-based assumptions
    if (mode === 'production') {
        assumptions.push('Following production-grade standards');
        assumptions.push('Including error handling and edge cases');
    }

    // Context assumptions
    if (context.projectId && !context.projectTitle) {
        assumptions.push('Using project context for styling decisions');
    }

    // Language/framework for code
    if (outputType === 'code' && !/typescript|javascript|python/i.test(intent)) {
        assumptions.push('Using TypeScript (Codra default)');
    }

    // Style for visuals
    if ((outputType === 'image' || outputType === 'icon') && context.designTokens) {
        assumptions.push('Applying project design tokens');
    }

    return assumptions;
}

// ============================================================
// Token Estimation
// ============================================================

function estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
}

// ============================================================
// Model Recommendation
// ============================================================

function recommendModel(outputType?: OutputType, mode?: ArchitectMode): string {
    // For image generation, recommend image models
    if (outputType === 'image' || outputType === 'icon') {
        return 'dall-e-3'; // or 'stable-diffusion' depending on available models
    }

    // For production mode, recommend higher quality models
    if (mode === 'production') {
        return 'gpt-4o';
    }

    // For fast mode, recommend faster/cheaper models
    if (mode === 'fast') {
        return 'gpt-4o-mini';
    }

    // Default balanced choice
    return 'gpt-4o-mini';
}

// ============================================================
// Main Generation Function
// ============================================================

/**
 * Generate an optimized prompt from user intent
 */
export async function generatePromptFromIntent(
    options: GeneratePromptOptions
): Promise<GeneratedPrompt> {
    const {
        intent,
        mode,
        context,
        clarificationAnswers,
        selectedModel,
        detectedOutputType,
        sources = [],
        groundingEnabled = false,
    } = options;

    const modeConfig = MODE_CONFIGS[mode];
    const outputType = detectedOutputType || context.outputType;

    // Build the primary prompt
    let primaryPrompt = MODE_PREFIXES[mode] + intent;

    // Add clarification answers
    primaryPrompt += buildClarificationSection(clarificationAnswers);

    // Add context section for precise and production modes
    if (mode !== 'fast') {
        primaryPrompt += buildContextSection(context);
    }

    // Add SOURCES block if grounding is enabled and sources are available
    let sourcesBlock: string | undefined;
    if (groundingEnabled && sources.length > 0) {
        // Format sources for prompt injection
        sourcesBlock = formatSourcesBlock(sources);
        primaryPrompt += '\n\n' + sourcesBlock;
    }

    // Add mode suffix
    primaryPrompt += MODE_SUFFIXES[mode];

    // Build system prompt based on output type
    let systemPrompt: string | undefined;
    if (outputType && OUTPUT_TYPE_SYSTEM_PROMPTS[outputType]) {
        systemPrompt = OUTPUT_TYPE_SYSTEM_PROMPTS[outputType];

        // Enhance for production mode
        if (mode === 'production') {
            systemPrompt += ' Ensure all outputs are thoroughly tested and production-ready.';
        }
    }

    // Add grounding instructions to system prompt if sources are present
    if (groundingEnabled && sources.length > 0) {
        const groundingInstructions = getGroundingInstructions();
        systemPrompt = systemPrompt
            ? groundingInstructions + '\n' + systemPrompt
            : groundingInstructions;
    }

    // Build negative prompt for relevant output types
    let negativePrompt: string | undefined;
    if (outputType === 'image' || outputType === 'icon') {
        negativePrompt = 'blurry, low quality, distorted, watermark, text overlay';

        if (mode === 'production') {
            negativePrompt += ', inconsistent style, amateur, stock photo look';
        }
    }

    // Generate assumptions
    const assumptions = generateAssumptions(intent, mode, context, outputType);

    // Add grounding-related assumptions
    if (groundingEnabled) {
        if (sources.length > 0) {
            assumptions.push(`Using ${sources.length} retrieved source(s) for grounding`);
            assumptions.push('Response will cite sources by number [1], [2], etc.');
            assumptions.push('Will acknowledge if sources are insufficient');
        } else {
            assumptions.push('Grounding was requested but no sources were retrieved');
        }
    }

    // Estimate tokens (include sources block in estimate)
    const combinedText = [primaryPrompt, systemPrompt, negativePrompt]
        .filter(Boolean)
        .join(' ');
    const baseTokens = estimateTokens(combinedText);
    const estimatedTokens = Math.round(baseTokens * modeConfig.tokenMultiplier);

    // Estimate cost
    const model = selectedModel || recommendModel(outputType, mode);
    const estimatedCost = costEngine.estimateCost(model, estimatedTokens);

    // Recommend model
    const recommendedModel = recommendModel(outputType, mode);

    // Convert sources to RetrievedSource format for storage
    const storedSources: RetrievedSource[] = sources.map(s => ({
        title: s.title,
        url: s.url,
        snippet: s.snippet,
        source: s.source,
    }));

    return {
        primary: primaryPrompt.trim(),
        system: systemPrompt,
        negative: negativePrompt,
        assumptions,
        sources: storedSources.length > 0 ? storedSources : undefined,
        sourcesBlock,
        estimatedTokens,
        estimatedCost,
        recommendedModel,
        generatedAt: new Date(),
    };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Re-estimate cost for edited prompt content
 */
export function reEstimateCost(
    primary: string,
    system?: string,
    negative?: string,
    model?: string
): { tokens: number; cost: number } {
    const combinedText = [primary, system, negative]
        .filter(Boolean)
        .join(' ');
    const tokens = estimateTokens(combinedText);
    const cost = costEngine.estimateCost(model || 'gpt-4o-mini', tokens);

    return { tokens, cost };
}
