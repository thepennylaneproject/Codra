/**
 * SPREAD INITIALIZATION ENGINE
 * Core logic for generating a Spread from onboarding data
 */

import {
    Spread,
    SpreadSection,
    TOCEntry,
    EnhancedTOCEntry,
    Project,
    MoodboardImage,
    LyraState,
    ProductionDeskId,
    TOCSectionCategory,
    PRODUCTION_DESKS,
    ProjectContext,
} from '../types';
import { DEFAULT_LYRA_APPEARANCE } from '../../lib/lyra/LyraRegistry';
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
export function generateTableOfContents(sections: SpreadSection[], activeDesks: ProductionDeskId[] = []): (TOCEntry | EnhancedTOCEntry)[] {
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
    activeDesks.forEach((deskId, index) => {
        const desk = PRODUCTION_DESKS.find(d => d.id === deskId);
        if (desk) {
            entries.push({
                id: crypto.randomUUID(),
                sectionId: `desk-${deskId}`,
                title: desk.label,
                order: sections.length + index + 1,
                category: 'production_desk',
                status: 'pending',
                keyboardShortcut: String(index + 1),
            });
        }
    });

    return entries.sort((a, b) => a.order - b.order);
}

/**
 * Generate a complete Spread from project and onboarding profile data
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
export function generateSpreadFromProfile(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null,
    moodboard: MoodboardImage[] = [],
    contextOverride?: ProjectContext
): Spread {
    const sections: SpreadSection[] = [];

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
    let activeDesks = (project.activeDesks || []) as ProductionDeskId[];

    // Healing: Inferred desks if missing but goals are present
    if (activeDesks.length === 0 && project.goals) {
        const goalsStr = project.goals.join(' ').toLowerCase();
        if (goalsStr.includes('brand') || goalsStr.includes('identity')) activeDesks.push('art-design');
        if (goalsStr.includes('website') || goalsStr.includes('app') || goalsStr.includes('engineering')) {
            if (!activeDesks.includes('art-design')) activeDesks.push('art-design');
            if (!activeDesks.includes('engineering')) activeDesks.push('engineering');
        }
        if (goalsStr.includes('content') || goalsStr.includes('write') || goalsStr.includes('marketing')) {
            if (!activeDesks.includes('writing')) activeDesks.push('writing');
            if (!activeDesks.includes('marketing')) activeDesks.push('marketing');
        }
    }

    const toc = generateTableOfContents(sections, activeDesks);

    // Initialize Lyra state
    const lyraState = buildInitialLyraState(project, extendedProfile);

    const now = new Date().toISOString();

    return {
        id: crypto.randomUUID(),
        projectId: project.id,
        sections,
        toc,
        lyraState,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Build initial Lyra state from project context
 */
function buildInitialLyraState(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null
): LyraState {
    // Calculate confidence based on available context
    let confidence = 0.5;

    if (project.description && project.description.length > 20) confidence += 0.1;
    if (project.audience) confidence += 0.1;
    if (project.goals && project.goals.length > 0) confidence += 0.1;
    if (extendedProfile?.visualDirection?.visualStyles?.length) confidence += 0.1;
    if (project.activeDesks && project.activeDesks.length > 0) confidence += 0.1;

    confidence = Math.min(confidence, 1.0);

    // Build suggested artifacts based on active desks
    const suggestedArtifacts: string[] = [];
    const activeDesks = (project.activeDesks || []) as ProductionDeskId[];

    if (project.name === 'AI Playground') {
        suggestedArtifacts.push('playground-guide');
    }

    for (const desk of activeDesks.slice(0, 3)) {
        suggestedArtifacts.push(`${desk}-start`);
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
        appearance: DEFAULT_LYRA_APPEARANCE,
        suggestedArtifacts,
        confidence,
        pendingQuestions,
    };
}

/**
 * Load a Spread from localStorage
 */
export function loadSpread(projectId: string): Spread | null {
    const stored = localStorage.getItem(`codra:spread:${projectId}`);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as Spread;
    } catch {
        return null;
    }
}

/**
 * Save a Spread to localStorage
 */
export function saveSpread(spread: Spread): void {
    localStorage.setItem(`codra:spread:${spread.projectId}`, JSON.stringify(spread));
}

/**
 * Update a specific section in a Spread
 */
export function updateSpreadSection(
    spread: Spread,
    sectionId: string,
    updates: Partial<SpreadSection>
): Spread {
    const updatedSections = spread.sections.map(section =>
        section.id === sectionId
            ? { ...section, ...updates }
            : section
    );

    return {
        ...spread,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Toggle section collapse state
 */
export function toggleSectionCollapse(spread: Spread, sectionId: string): Spread {
    const section = spread.sections.find(s => s.id === sectionId);
    if (!section) return spread;

    return updateSpreadSection(spread, sectionId, {
        collapsed: !section.collapsed,
    });
}
