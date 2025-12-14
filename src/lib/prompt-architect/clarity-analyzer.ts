/**
 * PROMPT ARCHITECT - Clarity Analyzer
 * src/lib/prompt-architect/clarity-analyzer.ts
 * 
 * Analyzes user intent for clarity and generates targeted clarification questions
 */

import {
    ArchitectContext,
    ClarityAnalysisResult,
    ClarificationQuestion,
    OutputType,
} from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// Output Type Detection
// ============================================================

/** Keywords that suggest specific output types */
const OUTPUT_TYPE_PATTERNS: Record<OutputType, RegExp[]> = {
    code: [
        /\b(function|code|script|implement|program|algorithm|api|endpoint|class|method)\b/i,
        /\b(typescript|javascript|python|react|component|hook)\b/i,
    ],
    icon: [
        /\b(icon|symbol|glyph|badge|favicon)\b/i,
    ],
    image: [
        /\b(image|photo|picture|illustration|artwork|graphic|visual)\b/i,
        /\b(generate|create|draw|design)\s+(an?\s+)?(image|picture|illustration)/i,
    ],
    copy: [
        /\b(copy|text|content|headline|tagline|description|paragraph|article|blog)\b/i,
        /\b(write|draft|compose)\s+(a|an|the)?\s*(copy|text|content|article)/i,
    ],
    video: [
        /\b(video|animation|motion|clip|footage)\b/i,
    ],
    component: [
        /\b(component|widget|ui|interface|button|form|modal|card|panel)\b/i,
        /\b(react|vue|angular)\s+component\b/i,
    ],
    api: [
        /\b(api|endpoint|rest|graphql|webhook|integration)\b/i,
    ],
    documentation: [
        /\b(documentation|docs|readme|guide|tutorial|manual)\b/i,
    ],
    other: [],
};

/** Detect output type from intent text */
function detectOutputType(intent: string): OutputType | undefined {
    const lowerIntent = intent.toLowerCase();

    for (const [type, patterns] of Object.entries(OUTPUT_TYPE_PATTERNS)) {
        if (type === 'other') continue;

        for (const pattern of patterns) {
            if (pattern.test(lowerIntent)) {
                return type as OutputType;
            }
        }
    }

    return undefined;
}

// ============================================================
// Scope Analysis
// ============================================================

/** Check if intent is too vague or broad */
function isIntentTooVague(intent: string): boolean {
    const wordCount = intent.trim().split(/\s+/).length;

    // Very short intents are likely vague
    if (wordCount < 3) return true;

    // Check for vague phrases
    const vaguePatterns = [
        /^(make|create|build|do)\s+(something|stuff|things?)\b/i,
        /^(i want|i need)\s+(a|an|some)\s*$/i,
        /^help\s*(me)?\s*$/i,
    ];

    return vaguePatterns.some(p => p.test(intent.trim()));
}

/** Check for missing critical constraints */
function detectMissingConstraints(intent: string, context: ArchitectContext): string[] {
    const missing: string[] = [];
    const lowerIntent = intent.toLowerCase();

    // For image generation, check for style/dimensions
    if (OUTPUT_TYPE_PATTERNS.image.some(p => p.test(lowerIntent))) {
        if (!/\b(style|aesthetic|realistic|cartoon|minimalist|flat|3d)\b/i.test(lowerIntent)) {
            // Only flag if not obvious from context
            if (!context.designTokens) {
                missing.push('style');
            }
        }
    }

    // For code, check for language/framework
    if (OUTPUT_TYPE_PATTERNS.code.some(p => p.test(lowerIntent))) {
        if (!/\b(typescript|javascript|python|java|go|rust|react|vue|angular|node)\b/i.test(lowerIntent)) {
            missing.push('language');
        }
    }

    // For copy, check for tone/audience
    if (OUTPUT_TYPE_PATTERNS.copy.some(p => p.test(lowerIntent))) {
        if (!/\b(formal|casual|professional|friendly|technical|simple)\b/i.test(lowerIntent)) {
            missing.push('tone');
        }
    }

    return missing;
}

// ============================================================
// Question Generation
// ============================================================

/** Generate clarification questions based on analysis */
function generateQuestions(
    _intent: string,
    context: ArchitectContext,
    detectedType: OutputType | undefined,
    isVague: boolean,
    missingConstraints: string[]
): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    // Limit to max 3 questions
    const MAX_QUESTIONS = 3;

    // Question 1: Output type if not detected
    if (!detectedType && !context.outputType) {
        questions.push({
            id: uuidv4(),
            question: 'What type of output are you looking for?',
            options: ['Code', 'Image', 'Text/Copy', 'UI Component', 'Documentation', 'Other'],
            required: true,
            category: 'output-type',
        });
    }

    // Question 2: Scope if too vague
    if (isVague && questions.length < MAX_QUESTIONS) {
        questions.push({
            id: uuidv4(),
            question: 'Could you provide more details about what you want to create?',
            required: true,
            category: 'scope',
        });
    }

    // Question 3: Missing constraints
    if (missingConstraints.length > 0 && questions.length < MAX_QUESTIONS) {
        const constraint = missingConstraints[0];

        if (constraint === 'style') {
            questions.push({
                id: uuidv4(),
                question: 'What visual style would you prefer?',
                options: ['Minimalist', 'Modern', 'Realistic', 'Illustrated', 'Abstract'],
                required: false,
                category: 'constraints',
            });
        } else if (constraint === 'language') {
            questions.push({
                id: uuidv4(),
                question: 'What programming language or framework should I use?',
                options: ['TypeScript/React', 'JavaScript', 'Python', 'Other'],
                required: true,
                category: 'constraints',
            });
        } else if (constraint === 'tone') {
            questions.push({
                id: uuidv4(),
                question: 'What tone should the content have?',
                options: ['Professional', 'Casual', 'Technical', 'Friendly'],
                required: false,
                category: 'constraints',
            });
        }
    }

    return questions.slice(0, MAX_QUESTIONS);
}

// ============================================================
// Main Analysis Function
// ============================================================

/**
 * Analyze user intent for clarity
 * Returns whether the intent is clear enough to generate a prompt,
 * and if not, what questions to ask
 */
export function analyzeClarity(
    intent: string,
    context: ArchitectContext
): ClarityAnalysisResult {
    // Handle empty intent
    if (!intent.trim()) {
        return {
            isClear: false,
            clarityScore: 0,
            questions: [],
        };
    }

    // Detect output type
    const detectedType = detectOutputType(intent) || context.outputType;

    // Check if intent is too vague
    const isVague = isIntentTooVague(intent);

    // Detect missing constraints
    const missingConstraints = detectMissingConstraints(intent, context);

    // Calculate clarity score
    let clarityScore = 1.0;

    if (!detectedType) clarityScore -= 0.3;
    if (isVague) clarityScore -= 0.4;
    if (missingConstraints.length > 0) clarityScore -= 0.1 * missingConstraints.length;

    clarityScore = Math.max(0, clarityScore);

    // Determine if clear enough (threshold: 0.6)
    const isClear = clarityScore >= 0.6;

    // Generate questions if not clear
    const questions = isClear
        ? []
        : generateQuestions(intent, context, detectedType, isVague, missingConstraints);

    return {
        isClear,
        clarityScore,
        questions,
        detectedOutputType: detectedType,
        detectedConstraints: missingConstraints.length > 0 ? missingConstraints : undefined,
    };
}
