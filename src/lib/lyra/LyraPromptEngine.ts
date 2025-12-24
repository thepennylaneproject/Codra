/**
 * LYRA PROMPT ENGINE
 * Generates contextual prompts and suggestions from project state
 */

import { Spread, SpreadSection, LyraState, ProductionDeskId, PRODUCTION_DESKS, Project } from '../../domain/types';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { DEFAULT_LYRA_APPEARANCE } from '../../lib/lyra/LyraRegistry';

// ============================================
// Prompt Generation
// ============================================

export interface PromptContext {
    projectName: string;
    description?: string;
    audience?: string;
    audienceContext?: Project['audienceContext'];
    deliverables?: Project['deliverables'];
    brand?: Project['brandConstraints'];
    success?: Project['successCriteria'];
    guardrails?: Project['guardrails'];
    goals?: string[]; // Legacy
    activeDesks?: ProductionDeskId[];
    visualDirection?: {
        styles?: string[];
        colorDirections?: string[];
        typographyVibe?: string;
    };
    currentSection?: SpreadSection;
    pastMemories?: Array<{ title: string; memory: string }>;
}

/**
 * Generate a contextual prompt for the current project state
 */
export function generateContextualPrompt(context: PromptContext): string {
    const parts: string[] = [];

    // Project context
    parts.push(`Project: ${context.projectName} `);

    if (context.description) {
        parts.push(`Description: ${context.description} `);
    }

    if (context.audience) {
        parts.push(`Target Audience: ${context.audience} `);
    }

    if (context.audienceContext?.segment) {
        parts.push(`Audience Segment: ${context.audienceContext.segment} `);
    }

    if (context.deliverables && context.deliverables.length > 0) {
        parts.push(`Deliverables: ${context.deliverables.map((d: any) => d.name).join(', ')} `);
    }

    if (context.success?.definitionOfDone && context.success.definitionOfDone.length > 0) {
        parts.push(`Success Criteria: ${context.success.definitionOfDone.join(', ')} `);
    }

    if (context.guardrails?.mustAvoid && context.guardrails.mustAvoid.length > 0) {
        parts.push(`Must Avoid: ${context.guardrails.mustAvoid.join(', ')} `);
    }

    if (context.brand?.voiceGuidelines) {
        parts.push(`Voice & Tone: ${context.brand.voiceGuidelines} `);
    }

    if (context.goals && context.goals.length > 0) {
        parts.push(`Legacy Goals: ${context.goals.join(', ')} `);
    }

    // Visual direction context
    if (context.visualDirection) {
        const visual: string[] = [];
        if (context.visualDirection.styles?.length) {
            visual.push(`Styles: ${context.visualDirection.styles.join(', ')} `);
        }
        if (context.visualDirection.colorDirections?.length) {
            visual.push(`Colors: ${context.visualDirection.colorDirections.join(', ')} `);
        }
        if (context.visualDirection.typographyVibe) {
            visual.push(`Typography: ${context.visualDirection.typographyVibe} `);
        }
        if (visual.length > 0) {
            parts.push(`Visual Direction: ${visual.join('; ')} `);
        }
    }

    // Current section context
    if (context.currentSection) {
        parts.push(`Current Focus: ${context.currentSection.title} `);
    }

    return parts.join('\n');
}

// ============================================
// Artifact Suggestions
// ============================================

export interface ArtifactSuggestion {
    id: string;
    title: string;
    description: string;
    deskId: ProductionDeskId;
    priority: 'high' | 'medium' | 'low';
    integrationSource?: 'sentry' | 'linear' | 'cloudinary' | 'sanity';
}

/**
 * Suggest next artifacts based on project context and active desks
 */
export function suggestNextArtifacts(
    activeDesks: ProductionDeskId[],
    completedSections: string[] = []
): ArtifactSuggestion[] {
    const suggestions: ArtifactSuggestion[] = [];

    // Generate suggestions based on active desks
    for (const deskId of activeDesks) {
        const desk = PRODUCTION_DESKS.find(d => d.id === deskId);
        if (!desk) continue;

        switch (deskId) {
            case 'art-design':
                suggestions.push({
                    id: `${deskId} -moodboard`,
                    title: 'Refine Moodboard',
                    description: 'Expand and refine your visual references',
                    deskId,
                    priority: 'high',
                });
                suggestions.push({
                    id: `${deskId} -palette`,
                    title: 'Color Palette',
                    description: 'Generate a cohesive color palette',
                    deskId,
                    priority: 'medium',
                });
                break;

            case 'writing':
                suggestions.push({
                    id: `${deskId} -brief`,
                    title: 'Content Brief',
                    description: 'Draft a content strategy brief',
                    deskId,
                    priority: 'high',
                });
                suggestions.push({
                    id: `${deskId} -voice`,
                    title: 'Voice Guidelines',
                    description: 'Define tone and voice guidelines',
                    deskId,
                    priority: 'medium',
                });
                break;

            case 'engineering':
                suggestions.push({
                    id: `${deskId} -architecture`,
                    title: 'Technical Scope',
                    description: 'Outline technical requirements',
                    deskId,
                    priority: 'high',
                });
                break;

            case 'marketing':
                suggestions.push({
                    id: `${deskId} -positioning`,
                    title: 'Positioning Statement',
                    description: 'Draft market positioning',
                    deskId,
                    priority: 'high',
                });
                break;

            case 'career-assets':
                suggestions.push({
                    id: `${deskId} -resume`,
                    title: 'Resume Draft',
                    description: 'Generate resume content',
                    deskId,
                    priority: 'high',
                });
                break;

            case 'data-analysis':
                suggestions.push({
                    id: `${deskId}-research`,
                    title: 'Research Plan',
                    description: 'Outline research approach',
                    deskId,
                    priority: 'high',
                });
                break;
        }
    }

    // Filter out completed suggestions
    return suggestions.filter(s => !completedSections.includes(s.id));
}

// ============================================
// Clarifying Questions
// ============================================

export interface ClarifyingQuestion {
    id: string;
    question: string;
    context: string;
    priority: 'blocking' | 'helpful';
}

/**
 * Generate clarifying questions when confidence is low
 */
export function generateClarifyingQuestions(
    context: PromptContext,
    confidence: number
): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];

    // Only generate questions when confidence is below threshold
    if (confidence > 0.7) return questions;

    // Check for missing critical information
    if (!context.audience) {
        questions.push({
            id: 'audience',
            question: 'Who is the primary audience for this project?',
            context: 'Understanding your audience helps tailor the output.',
            priority: 'blocking',
        });
    }

    if (!context.goals || context.goals.length === 0) {
        questions.push({
            id: 'goals',
            question: 'What are the main objectives of this project?',
            context: 'Clear goals help prioritize work.',
            priority: 'blocking',
        });
    }

    if (!context.activeDesks || context.activeDesks.length === 0) {
        questions.push({
            id: 'desks',
            question: 'Which production areas will you be working in?',
            context: 'This helps Lyra suggest relevant starting points.',
            priority: 'helpful',
        });
    }

    // Low confidence suggests ambiguity
    if (confidence < 0.4) {
        questions.push({
            id: 'clarify',
            question: 'Could you describe the project in a bit more detail?',
            context: 'More context helps Lyra provide better guidance.',
            priority: 'helpful',
        });
    }

    return questions;
}

// ============================================
// Lyra State Builder
// ============================================

/**
 * Build initial LyraState from project context
 */
export function buildInitialLyraState(
    context: PromptContext,
    activeDesks: ProductionDeskId[] = []
): LyraState {
    // Calculate confidence based on available context
    let confidence = 0.5;

    if (context.description && context.description.length > 20) confidence += 0.1;
    if (context.audience) confidence += 0.1;
    if (context.goals && context.goals.length > 0) confidence += 0.1;
    if (context.visualDirection?.styles?.length) confidence += 0.1;
    if (activeDesks.length > 0) confidence += 0.1;

    confidence = Math.min(confidence, 1.0);

    const suggestions = suggestNextArtifacts(activeDesks);
    const questions = generateClarifyingQuestions(context, confidence);

    return {
        visible: true,
        appearance: DEFAULT_LYRA_APPEARANCE,
        currentPrompt: generateContextualPrompt(context),
        suggestedArtifacts: suggestions.map(s => s.id),
        confidence,
        pendingQuestions: questions.map(q => q.question),
    };
}

/**
 * Build PromptContext from Spread and profile
 */
export function buildPromptContext(
    spread: Spread,
    profile: ExtendedOnboardingProfile | null,
    currentSectionId?: string,
    tasks?: SpreadTask[]
): PromptContext {
    const currentSection = currentSectionId
        ? spread.sections.find(s => s.id === currentSectionId)
        : undefined;

    // Extract memories from completed tasks
    const pastMemories = tasks
        ? tasks.filter(t => t.status === 'complete' && t.memory).map(t => ({
            title: t.title,
            memory: t.memory as string
        }))
        : undefined;

    return {
        projectName: profile?.context?.firstProjectDescription || 'Untitled Project',
        description: profile?.context?.firstProjectDescription,
        audience: profile?.visualDirection?.visualAudience?.[0],
        goals: profile?.context?.creativeGoals || [],
        activeDesks: (profile?.context?.creativeGoals || []) as unknown as ProductionDeskId[],
        visualDirection: profile?.visualDirection ? {
            styles: profile.visualDirection.visualStyles,
            colorDirections: profile.visualDirection.colorDirections,
            typographyVibe: profile.visualDirection.typographyVibe || undefined,
        } : undefined,
        currentSection,
        pastMemories,
    };
}

/**
 * Build PromptContext from a full Project object (New Way)
 */
export function buildPromptContextFromProject(
    project: Project,
    currentSection?: SpreadSection,
    tasks?: SpreadTask[]
): PromptContext {
    const pastMemories = tasks
        ? tasks.filter(t => t.status === 'complete' && t.memory).map(t => ({
            title: t.title,
            memory: t.memory as string
        }))
        : undefined;

    return {
        projectName: project.name,
        description: project.summary,
        audience: project.audience,
        audienceContext: project.audienceContext,
        deliverables: project.deliverables,
        brand: project.brandConstraints,
        success: project.successCriteria,
        guardrails: project.guardrails,
        activeDesks: (project.deliverables?.map(d => d.type).filter((v, i, a) => a.indexOf(v) === i) || []) as unknown as ProductionDeskId[],
        currentSection,
        pastMemories,
    };
}

// ============================================
// Task-Specific Prompt Generation
// ============================================

import { SpreadTask } from '../../domain/task-queue';

/**
 * Result from generating a task-specific prompt
 */
export interface TaskPromptResult {
    /** The generated user prompt */
    prompt: string;
    /** System context for the AI model */
    systemContext: string;
    /** Suggested model based on task type */
    suggestedTaskType: 'chat' | 'code' | 'summary' | 'reasoning' | 'image' | 'retrieval';
    /** Lyra's message explaining the prompt */
    lyraMessage: string;
}

/**
 * Generate a context-aware prompt for a specific task.
 * Uses the Project Context as the primary context anchor.
 */
export function generatePromptForTask(
    task: SpreadTask,
    projectContext: PromptContext
): TaskPromptResult {
    // Build the system context
    const systemParts: string[] = [
        'You are working on a creative project.',
        '',
        '## Project Context',
    ];

    if (projectContext.projectName) {
        systemParts.push(`** Project:** ${projectContext.projectName} `);
    }

    if (projectContext.description) {
        systemParts.push(`** Description:** ${projectContext.description} `);
    }

    if (projectContext.audience) {
        systemParts.push(`** Target Audience:** ${projectContext.audience} `);
    }

    if (projectContext.audienceContext?.segment) {
        systemParts.push(`** Audience Segment:** ${projectContext.audienceContext.segment} `);
    }

    if (projectContext.deliverables && projectContext.deliverables.length > 0) {
        systemParts.push(`** Deliverables:** ${projectContext.deliverables.map((d: any) => d.name).join(', ')} `);
    }

    if (projectContext.brand?.voiceGuidelines) {
        systemParts.push(`** Voice & Tone:** ${projectContext.brand.voiceGuidelines} `);
    }

    if (projectContext.success?.definitionOfDone && projectContext.success.definitionOfDone.length > 0) {
        systemParts.push(`** Success Criteria:** ${projectContext.success.definitionOfDone.join(', ')} `);
    }

    if (projectContext.guardrails?.mustAvoid && projectContext.guardrails.mustAvoid.length > 0) {
        systemParts.push(`** Must Avoid:** ${projectContext.guardrails.mustAvoid.join(', ')} `);
    }

    // Add Production Memories (Artifact Injection)
    if (projectContext.pastMemories && projectContext.pastMemories.length > 0) {
        systemParts.push('');
        systemParts.push('## Production Memories (Completed Tasks)');
        systemParts.push('The following outcomes were established in previous tasks. Use them to maintain narrative and visual consistency.');

        for (const item of projectContext.pastMemories) {
            systemParts.push(`### ${item.title}`);
            systemParts.push(`> ${item.memory}`);
        }
    }

    // Add visual direction if relevant
    if (projectContext.visualDirection &&
        (task.deskId === 'art-design' || task.deskId === 'marketing')) {
        systemParts.push('');
        systemParts.push('## Visual Direction');

        if (projectContext.visualDirection.styles?.length) {
            systemParts.push(`** Styles:** ${projectContext.visualDirection.styles.join(', ')} `);
        }
        if (projectContext.visualDirection.colorDirections?.length) {
            systemParts.push(`** Colors:** ${projectContext.visualDirection.colorDirections.join(', ')} `);
        }
        if (projectContext.visualDirection.typographyVibe) {
            systemParts.push(`** Typography:** ${projectContext.visualDirection.typographyVibe} `);
        }
    }

    // Build the user prompt based on task
    const promptParts: string[] = [];

    // Desk-specific framing
    const deskFraming = getDeskFraming(task.deskId);
    promptParts.push(deskFraming);
    promptParts.push('');

    // Task specific instruction
    promptParts.push(`** Task:** ${task.title} `);
    promptParts.push('');
    promptParts.push(task.description);

    // Add quality expectations
    promptParts.push('');
    promptParts.push('Please provide a high-quality, production-ready output that aligns with the project context and goals.');

    // Determine suggested task type for router
    const suggestedTaskType = getTaskTypeForDesk(task.deskId);

    // Generate Lyra's message
    const lyraMessage = generateLyraTaskMessage(task);

    return {
        prompt: promptParts.join('\n'),
        systemContext: systemParts.join('\n'),
        suggestedTaskType,
        lyraMessage,
    };
}

/**
 * Get desk-specific framing for prompts
 */
function getDeskFraming(deskId: ProductionDeskId): string {
    const framings: Record<ProductionDeskId, string> = {
        'art-design': 'You are a senior art director with expertise in visual design, brand identity, and creative direction.',
        'engineering': 'You are a principal software engineer with expertise in architecture, clean code, and scalable systems.',
        'writing': 'You are a senior copywriter with expertise in compelling narratives, clear communication, and brand voice.',
        'marketing': 'You are a marketing strategist with expertise in positioning, messaging, and campaign development.',
        'career-assets': 'You are a career coach with expertise in resumes, personal branding, and professional development.',
        'data-analysis': 'You are a research analyst with expertise in data synthesis, market analysis, and strategic insights.',
        'workflow': 'You are a project manager with expertise in workflow optimization, task prioritization, and team coordination.',
    };

    return framings[deskId] || 'You are a creative professional.';
}

/**
 * Map desk to SmartRouter task type
 */
function getTaskTypeForDesk(deskId: ProductionDeskId): TaskPromptResult['suggestedTaskType'] {
    const mapping: Record<ProductionDeskId, TaskPromptResult['suggestedTaskType']> = {
        'art-design': 'image',
        'engineering': 'code',
        'writing': 'summary',
        'marketing': 'summary',
        'career-assets': 'summary',
        'data-analysis': 'reasoning',
        'workflow': 'summary',
    };

    return mapping[deskId] || 'chat';
}

/**
 * Generate Lyra's message explaining the prompt
 */
function generateLyraTaskMessage(task: SpreadTask): string {
    const desk = PRODUCTION_DESKS.find(d => d.id === task.deskId);
    const deskName = desk?.label || task.deskId;

    const messages = [
        `I've prepared a prompt for the ${deskName} desk to work on "${task.title}". The prompt includes all relevant context from your project brief.`,
        `This task is routed to ${deskName}. I've anchored the prompt to your Tear Sheet so nothing gets lost.`,
        `Ready to execute "${task.title}" via ${deskName}. All project context is included.`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Translate plain user input into an effective prompt
 */
export function translateUserInput(
    plainText: string,
    task: SpreadTask,
    projectContext: PromptContext
): string {
    // This is where Lyra acts as a "prompt architect"
    // taking plain language and making it effective

    const parts: string[] = [];

    // Add context-aware framing
    parts.push(getDeskFraming(task.deskId));
    parts.push('');

    // Enhance the user's plain text with project context
    parts.push('The user has requested:');
    parts.push(`"${plainText}"`);
    parts.push('');

    // Add relevant context
    if (projectContext.audience) {
        parts.push(`Keep in mind the target audience: ${projectContext.audience}`);
    }

    if (projectContext.goals && projectContext.goals.length > 0) {
        parts.push(`Align with project goals: ${projectContext.goals.slice(0, 2).join(', ')}`);
    }

    // Add quality instruction
    parts.push('');
    parts.push('Provide a thoughtful, high-quality response that addresses the request while maintaining alignment with the overall project direction.');

    return parts.join('\n');
}
