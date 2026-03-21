/**
 * ASSISTANT PROMPT ENGINE
 * Generates contextual prompts and suggestions from project state
 */

import { ProjectSpecification, SpecificationSection, AssistantState, ProjectToolId, PROJECT_TOOLS, Project } from '../../domain/types';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { DEFAULT_ASSISTANT_APPEARANCE } from '../../lib/assistant/AssistantRegistry';

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
    activeTools?: ProjectToolId[];
    visualDirection?: {
        styles?: string[];
        colorDirections?: string[];
        typographyVibe?: string;
    };
    currentSection?: SpecificationSection;
    pastMemories?: Array<{ title: string; memory: string }>;
    contextArtifacts?: Array<{ title: string; type: string; content: string }>;
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
    toolId: ProjectToolId;
    priority: 'high' | 'medium' | 'low';
    integrationSource?: 'sentry' | 'linear' | 'cloudinary' | 'sanity';
}

/**
 * Suggest next artifacts based on project context and active tools
 */
export function suggestNextArtifacts(
    activeTools: ProjectToolId[],
    completedSections: string[] = []
): ArtifactSuggestion[] {
    const suggestions: ArtifactSuggestion[] = [];

    // Generate suggestions based on active tools
    for (const toolId of activeTools) {
        const tool = PROJECT_TOOLS.find(d => d.id === toolId);
        if (!tool) continue;

        switch (toolId) {
            case 'design':
                suggestions.push({
                    id: `${toolId} -moodboard`,
                    title: 'Refine Moodboard',
                    description: 'Expand and refine your visual references',
                    toolId,
                    priority: 'high',
                });
                suggestions.push({
                    id: `${toolId} -palette`,
                    title: 'Color Palette',
                    description: 'Generate a cohesive color palette',
                    toolId,
                    priority: 'medium',
                });
                break;

            case 'copy':
                suggestions.push({
                    id: `${toolId} -brief`,
                    title: 'Content Brief',
                    description: 'Draft a content strategy brief',
                    toolId,
                    priority: 'high',
                });
                suggestions.push({
                    id: `${toolId} -voice`,
                    title: 'Voice Guidelines',
                    description: 'Define tone and voice guidelines',
                    toolId,
                    priority: 'medium',
                });
                suggestions.push({
                    id: `${toolId} -positioning`,
                    title: 'Positioning Statement',
                    description: 'Draft market positioning',
                    toolId,
                    priority: 'high',
                });
                suggestions.push({
                    id: `${toolId} -resume`,
                    title: 'Resume Draft',
                    description: 'Generate resume content',
                    toolId,
                    priority: 'high',
                });
                break;

            case 'code':
                suggestions.push({
                    id: `${toolId} -architecture`,
                    title: 'Technical Scope',
                    description: 'Outline technical requirements',
                    toolId,
                    priority: 'high',
                });
                break;

            case 'data':
                suggestions.push({
                    id: `${toolId}-research`,
                    title: 'Research Plan',
                    description: 'Outline research approach',
                    toolId,
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

    if (!context.activeTools || context.activeTools.length === 0) {
        questions.push({
            id: 'tools',
            question: 'Which tools will you be using (copy, design, code, data)?',
            context: 'This helps Assistant suggest relevant starting points.',
            priority: 'helpful',
        });
    }

    // Low confidence suggests ambiguity
    if (confidence < 0.4) {
        questions.push({
            id: 'clarify',
            question: 'Could you describe the project in a bit more detail?',
            context: 'More context helps Assistant provide better guidance.',
            priority: 'helpful',
        });
    }

    return questions;
}

// ============================================
// Assistant State Builder
// ============================================

/**
 * Build initial AssistantState from project context
 */
export function buildInitialAssistantState(
    context: PromptContext,
    activeTools: ProjectToolId[] = []
): AssistantState {
    // Calculate confidence based on available context
    let confidence = 0.5;

    if (context.description && context.description.length > 20) confidence += 0.1;
    if (context.audience) confidence += 0.1;
    if (context.goals && context.goals.length > 0) confidence += 0.1;
    if (context.visualDirection?.styles?.length) confidence += 0.1;
    if (activeTools.length > 0) confidence += 0.1;

    confidence = Math.min(confidence, 1.0);

    const suggestions = suggestNextArtifacts(activeTools);
    const questions = generateClarifyingQuestions(context, confidence);

    return {
        visible: true,
        appearance: DEFAULT_ASSISTANT_APPEARANCE,
        currentPrompt: generateContextualPrompt(context),
        suggestedArtifacts: suggestions.map(s => s.id),
        confidence,
        pendingQuestions: questions.map(q => q.question),
    };
}

/**
 * Build PromptContext from Specification and profile
 */
export function buildPromptContext(
    specification: ProjectSpecification,
    profile: ExtendedOnboardingProfile | null,
    currentSectionId?: string,
    tasks?: SpecificationTask[],
    activeTask?: SpecificationTask
): PromptContext {
    const currentSection = currentSectionId
        ? specification.sections.find(s => s.id === currentSectionId)
        : undefined;

    // Extract memories from completed tasks
    const pastMemories = tasks
        ? tasks.filter(t => t.status === 'complete' && t.memory).map(t => ({
            title: t.title,
            memory: t.memory as string
        }))
        : undefined;

    const contextArtifacts = activeTask?.contextArtifactIds && tasks
        ? tasks
            .filter(t => activeTask.contextArtifactIds?.includes(t.artifactId || ''))
            .map(t => ({
                title: t.title,
                type: t.toolId,
                content: t.output || ''
            }))
        : undefined;

    return {
        projectName: profile?.context?.firstProjectDescription || 'Untitled Project',
        description: profile?.context?.firstProjectDescription,
        audience: profile?.visualDirection?.visualAudience?.[0],
        goals: profile?.context?.creativeGoals || [],
        activeTools: (profile?.context?.creativeGoals || []) as unknown as ProjectToolId[],
        visualDirection: profile?.visualDirection ? {
            styles: profile.visualDirection.visualStyles,
            colorDirections: profile.visualDirection.colorDirections,
            typographyVibe: profile.visualDirection.typographyVibe || undefined,
        } : undefined,
        currentSection,
        pastMemories,
        contextArtifacts,
    };
}

/**
 * Build PromptContext from a full Project object (New Way)
 */
export function buildPromptContextFromProject(
    project: Project,
    currentSection?: SpecificationSection,
    tasks?: SpecificationTask[],
    activeTask?: SpecificationTask
): PromptContext {
    const pastMemories = tasks
        ? tasks.filter(t => t.status === 'complete' && t.memory).map(t => ({
            title: t.title,
            memory: t.memory as string
        }))
        : undefined;

    const contextArtifacts = activeTask?.contextArtifactIds && tasks
        ? tasks
            .filter(t => activeTask.contextArtifactIds?.includes(t.artifactId || ''))
            .map(t => ({
                title: t.title,
                type: t.toolId,
                content: t.output || ''
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
        activeTools: (project.deliverables ? [...new Set(project.deliverables.map(d => d.type))] : []) as unknown as ProjectToolId[],
        currentSection,
        pastMemories,
        contextArtifacts,
    };
}

// ============================================
// Task-Specific Prompt Generation
// ============================================

import { SpecificationTask } from '../../domain/task-queue';

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
    /** Assistant's message explaining the prompt */
    assistantMessage: string;
}

/**
 * Generate a context-aware prompt for a specific task.
 * Uses the Project Context as the primary context anchor.
 */
export function generatePromptForTask(
    task: SpecificationTask,
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

    // Add Specific Context Artifacts (Explicit Injection)
    if (projectContext.contextArtifacts && projectContext.contextArtifacts.length > 0) {
        systemParts.push('');
        systemParts.push('## Reference Artifacts (Approved Content)');
        systemParts.push('The following specific artifacts have been provided as direct references for this task:');

        for (const item of projectContext.contextArtifacts) {
            systemParts.push(`### ${item.title} (${item.type})`);
            systemParts.push('```');
            systemParts.push(item.content);
            systemParts.push('```');
        }
    }

    // Add visual direction if relevant
    if (projectContext.visualDirection &&
        (task.toolId === 'design' || task.toolId === 'copy')) {
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

    // Tool-specific framing
    const toolFraming = getToolFraming(task.toolId);
    promptParts.push(toolFraming);
    promptParts.push('');

    // Task specific instruction
    promptParts.push(`** Task:** ${task.title} `);
    promptParts.push('');
    promptParts.push(task.description);

    // Add quality expectations
    promptParts.push('');
    promptParts.push('Please provide a high-quality, production-ready output that aligns with the project context and goals.');

    // Determine suggested task type for router
    const suggestedTaskType = getTaskTypeForTool(task.toolId);

    // Generate Assistant's message
    const assistantMessage = generateAssistantTaskMessage(task);

    return {
        prompt: promptParts.join('\n'),
        systemContext: systemParts.join('\n'),
        suggestedTaskType,
        assistantMessage,
    };
}

/**
 * Get tool-specific framing for prompts
 */
function getToolFraming(toolId: ProjectToolId): string {
    const framings: Record<ProjectToolId, string> = {
        'design': 'You are a senior art director with expertise in visual design, brand identity, and creative direction.',
        'code': 'You are a principal software engineer with expertise in architecture, clean code, and scalable systems.',
        'copy': 'You are a senior copywriter with expertise in compelling narratives, clear communication, and brand voice.',
        'data': 'You are a research analyst with expertise in data synthesis, market analysis, and strategic insights.',
    };

    return framings[toolId] || 'You are a creative professional.';
}

/**
 * Map tool to SmartRouter task type
 */
function getTaskTypeForTool(toolId: ProjectToolId): TaskPromptResult['suggestedTaskType'] {
    const mapping: Record<ProjectToolId, TaskPromptResult['suggestedTaskType']> = {
        'design': 'image',
        'code': 'code',
        'copy': 'summary',
        'data': 'reasoning',
    };

    return mapping[toolId] || 'chat';
}

/**
 * Generate Assistant's message explaining the prompt
 */
function generateAssistantTaskMessage(task: SpecificationTask): string {
    const tool = PROJECT_TOOLS.find(d => d.id === task.toolId);
    const toolName = tool?.label || task.toolId;

    const messages = [
        `I've prepared a prompt for the ${toolName} tool to work on "${task.title}". The prompt includes all relevant context from your project brief.`,
        `This task is routed to ${toolName}. I've anchored the prompt to your Specification so nothing gets lost.`,
        `Ready to execute "${task.title}" via ${toolName}. All project context is included.`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Translate plain user input into an effective prompt
 */
export function translateUserInput(
    plainText: string,
    task: SpecificationTask,
    projectContext: PromptContext
): string {
    // This is where Assistant acts as a "prompt architect"
    // taking plain language and making it effective

    const parts: string[] = [];

    // Add context-aware framing
    parts.push(getToolFraming(task.toolId));
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
