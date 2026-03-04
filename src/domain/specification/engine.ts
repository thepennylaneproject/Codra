/**
 * SPECIFICATION INITIALIZATION ENGINE
 * Core logic for generating a Specification from onboarding data
 */

import {
    ProjectSpecification,
    SpecificationSection,
    TOCEntry,
    EnhancedTOCEntry,
    Project,
    MoodboardImage,
    AssistantState,
    ProjectToolId,
    TOCSectionCategory,
    PROJECT_TOOLS,
    ProjectContext,
} from '../types';
import { DEFAULT_ASSISTANT_APPEARANCE } from '../../lib/assistant/AssistantRegistry';
import { ExtendedOnboardingProfile } from '../onboarding-types';
import {
    buildOverviewSection,
    buildAudienceSection,
    buildGoalsSection,
    buildConstraintsSection,
    buildVisualDirectionSection,
    buildLayoutDirectionSection,
    buildContentOutlineSection,
    buildComponentsSection,
    buildNotesSection,
} from './section-builders';

/**
 * Generate a TOC from sections and active desks
 */
export function generateTableOfContents(sections: SpecificationSection[], activeTools: ProjectToolId[] = []): (TOCEntry | EnhancedTOCEntry)[] {
    const entries: (TOCEntry | EnhancedTOCEntry)[] = [];

    // Map base sections to categories
    sections.forEach((section, index) => {
        let category: TOCSectionCategory = 'assignment';

        switch (section.type) {
            case 'overview':
            case 'audience':
            case 'goals':
            case 'constraints':
                category = 'assignment';
                break;
            case 'visual_direction':
                category = 'visual_direction';
                break;
            case 'layout_direction':
            case 'content_outline':
            case 'components_or_assets':
                category = 'editorial_direction';
                break;
            case 'notes':
                category = 'open_questions';
                break;
        }

        entries.push({
            id: crypto.randomUUID(),
            sectionId: section.id,
            title: section.title,
            order: index + 1,
            category,
            status: 'pending',
        });
    });

    // Add Task Workspaces
    activeTools.forEach((toolId, index) => {
        const tool = PROJECT_TOOLS.find(t => t.id === toolId);
        if (tool) {
            entries.push({
                id: crypto.randomUUID(),
                sectionId: `tool-${toolId}`,
                title: tool.label,
                order: sections.length + index + 1,
                category: 'project_tool',
                status: 'pending',
                keyboardShortcut: String(index + 1),
            });
        }
    });

    return entries.sort((a, b) => a.order - b.order);
}

/**
 * Generate a complete ProjectSpecification from project and onboarding profile data
 * 
 * Section ordering rules:
 * 1. Overview (always)
 * 2. Audience (always)
 * 3. Goals (always)
 * 4. Visual Direction (if moodboard inputs exist)
 * 5. Layout Direction (if layout prefs or visual outputs)
 * 6. Content Outline (if content-heavy outputs)
 * 7. Components / Assets (if design outputs)
 * 8. Constraints (if any exist) - collapsed by default
 * 9. Notes (always)
 */
export function generateSpecificationFromProfile(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null,
    moodboard: MoodboardImage[] = [],
    contextOverride?: ProjectContext
): ProjectSpecification {
    const sections: SpecificationSection[] = [];

    // 1. Overview - Always present
    sections.push(buildOverviewSection(project, extendedProfile, contextOverride));

    // 2. Audience - Always present
    sections.push(buildAudienceSection(project, extendedProfile, contextOverride));

    // 3. Goals - Always present
    sections.push(buildGoalsSection(project, extendedProfile, contextOverride));

    // 4. Visual Direction - Only if moodboard inputs exist
    const visualSection = buildVisualDirectionSection(extendedProfile, moodboard);
    if (visualSection) {
        sections.push(visualSection);
    }

    // 5. Layout Direction - Conditionally
    const layoutSection = buildLayoutDirectionSection(extendedProfile);
    if (layoutSection) {
        sections.push(layoutSection);
    }

    // 6. Content Outline - For content-heavy outputs
    const contentSection = buildContentOutlineSection(extendedProfile);
    if (contentSection) {
        sections.push(contentSection);
    }

    // 7. Components / Assets - For design outputs
    const componentsSection = buildComponentsSection(extendedProfile);
    if (componentsSection) {
        sections.push(componentsSection);
    }

    // 8. Constraints - If any exist (collapsed by default)
    const constraintsSection = buildConstraintsSection(project, extendedProfile, contextOverride);
    if (constraintsSection) {
        sections.push(constraintsSection);
    }

    // 9. Notes - Always present
    sections.push(buildNotesSection());

    // Generate TOC
    const activeTools = (project.activeTools || []) as ProjectToolId[];

    // Healing: Inferred tools if missing but goals are present
    if (activeTools.length === 0 && project.goals) {
        const goalsStr = project.goals.join(' ').toLowerCase();
        if (goalsStr.includes('brand') || goalsStr.includes('identity')) activeTools.push('design');
        if (goalsStr.includes('website') || goalsStr.includes('app') || goalsStr.includes('code')) {
            if (!activeTools.includes('design')) activeTools.push('design');
            if (!activeTools.includes('code')) activeTools.push('code');
        }
        if (goalsStr.includes('content') || goalsStr.includes('copy') || goalsStr.includes('marketing')) {
            if (!activeTools.includes('copy')) activeTools.push('copy');
        }
    }

    const toc = generateTableOfContents(sections, activeTools);

    // Initialize Assistant state
    const assistantState = buildInitialAssistantState(project, extendedProfile);

    const now = new Date().toISOString();

    return {
        id: crypto.randomUUID(),
        projectId: project.id,
        sections,
        toc,
        assistantState,
        version: 1,
        lastModifiedBy: '',
        lastModifiedAt: now,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Build initial Assistant state from project context
 */
function buildInitialAssistantState(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null
): AssistantState {
    // Calculate confidence based on available context
    let confidence = 0.5;

    if (project.description && project.description.length > 20) confidence += 0.1;
    if (project.audience) confidence += 0.1;
    if (project.goals && project.goals.length > 0) confidence += 0.1;
    if (extendedProfile?.visualDirection?.visualStyles?.length) confidence += 0.1;
    if (project.activeTools && project.activeTools.length > 0) confidence += 0.1;

    confidence = Math.min(confidence, 1.0);

    // Build suggested artifacts based on active tools
    const suggestedArtifacts: string[] = [];
    const activeTools = (project.activeTools || []) as ProjectToolId[];

    if (project.name === 'Execution workspace') {
        suggestedArtifacts.push('playground-guide');
    }

    for (const tool of activeTools.slice(0, 3)) {
        suggestedArtifacts.push(`${tool}-start`);
    }

    // Build pending questions for low confidence
    const pendingQuestions: string[] = [];
    if (!project.audience) {
        pendingQuestions.push('Who is the primary audience for this project?');
    }
    if (!project.goals || project.goals.length === 0) {
        pendingQuestions.push('What are the main objectives?');
    }

    return {
        visible: true,
        appearance: DEFAULT_ASSISTANT_APPEARANCE,
        suggestedArtifacts,
        confidence,
        pendingQuestions,
    };
}

/**
 * Load a Specification from localStorage
 */
export function loadSpecification(projectId: string): ProjectSpecification | null {
    const stored = localStorage.getItem(`codra:specification:${projectId}`);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as ProjectSpecification;
    } catch {
        return null;
    }
}

/**
 * Save a Specification to localStorage
 */
export function saveSpecification(specification: ProjectSpecification): void {
    localStorage.setItem(`codra:specification:${specification.projectId}`, JSON.stringify(specification));
}

/**
 * Update a specific section in a Specification
 */
export function updateSpecificationSection(
    specification: ProjectSpecification,
    sectionId: string,
    updates: Partial<SpecificationSection>
): ProjectSpecification {
    const updatedSections = specification.sections.map(section =>
        section.id === sectionId
            ? { ...section, ...updates }
            : section
    );

    return {
        ...specification,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Toggle section collapse state
 */
export function toggleSectionCollapse(specification: ProjectSpecification, sectionId: string): ProjectSpecification {
    const section = specification.sections.find(s => s.id === sectionId);
    if (!section) return specification;

    return updateSpecificationSection(specification, sectionId, {
        collapsed: !section.collapsed,
    });
}
