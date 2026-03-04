/**
 * SPECIFICATION SECTION BUILDERS
 * Individual builder functions for each section type
 */

import {
    SpecificationSection,
    Project,
    MoodboardImage,
    ProjectContext,
} from '../types';
import { getSignatureLine } from '../signatures';
import {
    ExtendedOnboardingProfile,
    CreativeGoal,
    CREATIVE_GOAL_OPTIONS,
    PERSONALITY_OPTIONS,
    VISUAL_STYLE_OPTIONS,
    LAYOUT_OPTIONS,
    COLOR_DIRECTION_OPTIONS,
    TYPOGRAPHY_OPTIONS,
    IMAGERY_TYPE_OPTIONS,
    PRIMARY_AUDIENCE_OPTIONS,
    VISUAL_AUDIENCE_OPTIONS,
    TOP_PRIORITY_OPTIONS,
} from '../onboarding-types';

// Helper to generate unique IDs
function generateId(): string {
    return crypto.randomUUID();
}

// Helper to format enum values as readable labels
function formatLabel(value: string): string {
    return value
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Helper to get label from options array
function getLabelFromOptions<T extends { id: string; label: string }>(
    options: T[],
    id: string
): string {
    return options.find(o => o.id === id)?.label || formatLabel(id);
}

/**
 * Overview Section - Always present
 */
export function buildOverviewSection(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null,
    context?: ProjectContext
): SpecificationSection {
    const stage = extendedProfile?.importData?.projectStage || 'early-concept';
    const stageLabel = stage === 'early-concept' ? 'Concept' :
        stage === 'mid-project' ? 'Mid-Project' : 'Near-Final';
    const projectIntent = extendedProfile?.projectIntent;

    return {
        id: generateId(),
        type: 'overview',
        title: 'Project Overview',
        description: 'A summary of what this project is about and its current stage.',
        status: 'draft',
        source: context ? 'manual' : 'onboarding',
        editable: true,
        content: {
            summary: context?.identity?.summary || project.description || 'No description provided.',
            oneLineGoal: projectIntent?.coreMessage || '',
            currentStage: stageLabel,
            consultationNote: getSignatureLine('REALITY_CHECK'),
            budgetSummary: extendedProfile?.budgetPreferences?.budgetMode || 'Not specified',
            prioritySummary: extendedProfile?.budgetPreferences?.costQualityPriority || 'Not specified',
        },
        suggestedAction: {
            label: 'Finalize Project Brief',
            actionId: 'finalize-brief'
        }
    };
}

/**
 * Audience Section - Always present
 */
export function buildAudienceSection(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null,
    context?: ProjectContext
): SpecificationSection {
    // Priority: Context -> Profile -> Project
    let primaryLabel = context?.audience?.primary;

    if (!primaryLabel) {
        const primaryAudience = extendedProfile?.context?.primaryAudience;
        primaryLabel = primaryAudience
            ? getLabelFromOptions(PRIMARY_AUDIENCE_OPTIONS, primaryAudience)
            : project.audience || 'General';
    }

    const visualAudiences = extendedProfile?.visualDirection?.visualAudience || [];
    const secondaryLabels = visualAudiences.map(
        (va: string) => getLabelFromOptions(VISUAL_AUDIENCE_OPTIONS, va)
    );

    // Infer emotional response from personality
    const personality = extendedProfile?.visualDirection?.personality || [];
    const desiredFeeling = extendedProfile?.visualDirection?.desiredFeeling || '';
    const emotionalResponse = desiredFeeling ||
        (personality.length > 0
            ? personality.map((p: string) => getLabelFromOptions(PERSONALITY_OPTIONS, p)).join(', ')
            : 'Not specified');

    // Placeholder for priorities, as it's not defined in the original context
    const priorities: string[] = [];

    return {
        id: generateId(),
        type: 'audience',
        title: 'Primary Audience',
        description: 'The key segments and motivations defining the audience.',
        status: 'draft',
        source: 'onboarding',
        editable: true,
        content: {
            primary: primaryLabel,
            secondary: secondaryLabels,
            emotionalResponse: emotionalResponse,
            priorities,
        },
        suggestedAction: {
            label: 'Refine Audience Persona',
            actionId: 'refine-audience'
        }
    };
}

/**
 * Goals Section - Always present
 */
export function buildGoalsSection(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null,
    context?: ProjectContext
): SpecificationSection {
    // Combine project goals with creative goals from onboarding
    // Priority: Context Success Criteria -> Onboarding
    const projectGoals = project.goals || [];
    const creativeGoals = extendedProfile?.context?.creativeGoals || [];
    const topPriority = extendedProfile?.context?.topPriority;

    // Map creative goals to readable labels with priority tags
    const formattedGoals: { text: string; priority: 'primary' | 'secondary' }[] = [];

    // Add Context criteria first if they exist
    const dod = context?.success?.definitionOfDone || [];
    dod.forEach((detail: string) => {
        formattedGoals.push({ text: detail, priority: 'primary' });
    });

    // Add top priority as primary goal if exists
    if (topPriority && dod.length === 0) {
        formattedGoals.push({
            text: getLabelFromOptions(TOP_PRIORITY_OPTIONS, topPriority),
            priority: 'primary',
        });
    }

    // Add project goals
    projectGoals.forEach((goal, index) => {
        formattedGoals.push({
            text: goal,
            priority: index === 0 && !topPriority && dod.length === 0 ? 'primary' : 'secondary',
        });
    });

    // Add creative goals as secondary
    creativeGoals.forEach((goal: CreativeGoal) => {
        formattedGoals.push({
            text: getLabelFromOptions(CREATIVE_GOAL_OPTIONS, goal),
            priority: 'secondary',
        });
    });

    return {
        id: generateId(),
        type: 'goals',
        title: 'Goals & Success',
        description: 'What this project needs to achieve.',
        status: 'draft',
        source: context?.success ? 'manual' : 'onboarding',
        editable: true,
        content: {
            goals: formattedGoals,
            successDefinition: context?.success?.definitionOfDone || [],
        },
        suggestedAction: {
            label: 'Set Key Milestones',
            actionId: 'set-milestones'
        }
    };
}

/**
 * Constraints Section - Only if constraints exist
 */
export function buildConstraintsSection(
    project: Project,
    extendedProfile: ExtendedOnboardingProfile | null,
    context?: ProjectContext
): SpecificationSection | null {
    const boundaries = project.boundaries || [];
    const mustAvoid = extendedProfile?.visualDirection?.mustAvoid || '';
    const riskTolerance = extendedProfile?.permissions?.riskTolerance || 3;
    const approvalRequired = extendedProfile?.permissions?.alwaysRequireApproval || [];
    const existingAssets = extendedProfile?.visualDirection?.existingAssets;

    // Priority: Context Guardrails Must Avoid
    const contextMustAvoids = context?.guardrails?.mustAvoid || [];

    // Only include if there are any constraints
    const hasConstraints =
        boundaries.length > 0 ||
        mustAvoid ||
        approvalRequired.length > 0 ||
        existingAssets ||
        contextMustAvoids.length > 0 ||
        context?.brand?.voiceGuidelines;

    if (!hasConstraints) {
        return null;
    }

    return {
        id: generateId(),
        type: 'constraints',
        title: 'Constraints & Voice',
        description: 'Boundaries and requirements that must be respected.',
        status: 'draft',
        source: context ? 'manual' : 'onboarding',
        editable: true,
        collapsed: true, // Default to collapsed
        content: {
            mustAvoids: contextMustAvoids.length > 0 ? contextMustAvoids : [...boundaries, ...(mustAvoid ? [mustAvoid] : [])],
            brandAssets: existingAssets ? formatLabel(existingAssets) : null,
            riskTolerance: riskTolerance <= 2 ? 'Low' : riskTolerance >= 4 ? 'High' : 'Medium',
            approvalRequired: approvalRequired.map((a: string) => formatLabel(a)),
            voiceGuidelines: context?.brand?.voiceGuidelines || null,
        },
    };
}

/**
 * Visual Direction Section - Only if moodboard inputs exist
 */
export function buildVisualDirectionSection(
    extendedProfile: ExtendedOnboardingProfile | null,
    moodboard: MoodboardImage[]
): SpecificationSection | null {
    if (!extendedProfile?.visualDirection) {
        return null;
    }

    const { visualDirection } = extendedProfile;

    // Check if there's any meaningful visual direction data
    const hasVisualData =
        visualDirection.personality.length > 0 ||
        visualDirection.visualStyles.length > 0 ||
        visualDirection.colorDirections.length > 0 ||
        visualDirection.typographyVibe ||
        visualDirection.imageryTypes.length > 0 ||
        moodboard.length > 0;

    if (!hasVisualData) {
        return null;
    }

    return {
        id: generateId(),
        type: 'visual_direction',
        title: 'Visual Direction',
        description: 'The look, feel, and aesthetic approach for this project.',
        status: 'draft',
        source: 'moodboard',
        editable: true,
        content: {
            personalityTraits: visualDirection.personality.map(
                (p: string) => getLabelFromOptions(PERSONALITY_OPTIONS, p)
            ),
            stylePreferences: visualDirection.visualStyles.map(
                (s: string) => getLabelFromOptions(VISUAL_STYLE_OPTIONS, s)
            ),
            colorExploration: visualDirection.colorDirections.map(
                (c: string) => getLabelFromOptions(COLOR_DIRECTION_OPTIONS, c)
            ),
            typography: visualDirection.typographyVibe
                ? getLabelFromOptions(TYPOGRAPHY_OPTIONS, visualDirection.typographyVibe)
                : null,
            imageryPriorities: visualDirection.imageryTypes.map(
                (i: string) => getLabelFromOptions(IMAGERY_TYPE_OPTIONS, i)
            ),
            inspirationImages: moodboard.map(img => ({
                id: img.id,
                url: img.imageUrl,
                role: img.role,
                caption: img.caption,
            })),
            similarBrands: visualDirection.similarBrands || null,
        },
    };
}

/**
 * Layout Direction Section - Conditionally included
 */
export function buildLayoutDirectionSection(
    extendedProfile: ExtendedOnboardingProfile | null
): SpecificationSection | null {
    if (!extendedProfile) return null;

    const { visualDirection, context } = extendedProfile;
    const layoutPreference = visualDirection?.layoutPreference;

    // Include if layout prefs exist OR outputs include visual deliverables
    const visualOutputs: CreativeGoal[] = [
        'website-app',
        'pitch-deck',
        'social-content',
        'product-packaging',
    ];
    const hasVisualOutputs = context?.creativeGoals?.some(
        (g: CreativeGoal) => visualOutputs.includes(g)
    );

    if (!layoutPreference && !hasVisualOutputs) {
        return null;
    }

    // Determine layout tendencies
    const layoutLabel = layoutPreference
        ? getLabelFromOptions(LAYOUT_OPTIONS, layoutPreference)
        : null;

    // Infer emphasis guidance
    const emphasis = layoutPreference === 'immersive-full-bleed' ||
        layoutPreference === 'magazine-editorial'
        ? 'Visual-led'
        : layoutPreference === 'centered-minimal'
            ? 'Content-led'
            : 'Balanced';

    return {
        id: generateId(),
        type: 'layout_direction',
        title: 'Layout Direction',
        description: 'How content should be structured and emphasized.',
        status: 'draft',
        source: layoutPreference ? 'onboarding' : 'inferred',
        editable: true,
        content: {
            layoutTendency: layoutLabel || 'Flexible',
            emphasis: emphasis,
            notes: null,
        },
    };
}

/**
 * Content Outline Section - For content-heavy outputs
 */
export function buildContentOutlineSection(
    extendedProfile: ExtendedOnboardingProfile | null
): SpecificationSection | null {
    if (!extendedProfile) return null;

    const { context } = extendedProfile;
    const projectIntent = extendedProfile.projectIntent;

    // Content-focused outputs
    const contentOutputs: CreativeGoal[] = [
        'pitch-deck',
        'print-materials',
        'marketing-campaign',
    ];
    const hasContentOutputs = context?.creativeGoals?.some(
        (g: CreativeGoal) => contentOutputs.includes(g)
    );

    if (!hasContentOutputs) {
        return null;
    }

    // Generate suggested outline based on use case
    const useCase = projectIntent?.useCase;
    let suggestedOutline: { item: string; suggested: boolean }[] = [];

    if (context.creativeGoals.includes('pitch-deck')) {
        suggestedOutline = [
            { item: 'Title / Hook', suggested: true },
            { item: 'Problem Statement', suggested: true },
            { item: 'Solution Overview', suggested: true },
            { item: 'Key Features / Benefits', suggested: true },
            { item: 'Market Opportunity', suggested: true },
            { item: 'Traction / Proof Points', suggested: true },
            { item: 'Team', suggested: true },
            { item: 'Ask / Next Steps', suggested: true },
        ];
    } else if (context.creativeGoals.includes('marketing-campaign')) {
        suggestedOutline = [
            { item: 'Campaign Objective', suggested: true },
            { item: 'Target Audience', suggested: true },
            { item: 'Key Message', suggested: true },
            { item: 'Channel Strategy', suggested: true },
            { item: 'Creative Assets', suggested: true },
            { item: 'Timeline', suggested: true },
        ];
    } else {
        suggestedOutline = [
            { item: 'Introduction', suggested: true },
            { item: 'Main Content', suggested: true },
            { item: 'Supporting Details', suggested: true },
            { item: 'Conclusion / CTA', suggested: true },
        ];
    }

    return {
        id: generateId(),
        type: 'content_outline',
        title: 'Content Outline',
        description: 'High-level structure for the content. All items are editable.',
        status: 'draft',
        source: 'inferred',
        editable: true,
        content: {
            outline: suggestedOutline,
            useCase: useCase ? formatLabel(useCase) : null,
        },
    };
}

/**
 * Components / Assets Section - For design system / UI outputs
 */
export function buildComponentsSection(
    extendedProfile: ExtendedOnboardingProfile | null
): SpecificationSection | null {
    if (!extendedProfile) return null;

    const { context, visualDirection } = extendedProfile;

    // UI/Design focused outputs
    const designOutputs: CreativeGoal[] = [
        'website-app',
        'brand-identity',
    ];
    const hasDesignOutputs = context?.creativeGoals?.some(
        (g: CreativeGoal) => designOutputs.includes(g)
    );

    if (!hasDesignOutputs) {
        return null;
    }

    // Generate placeholder component list based on output type
    let components: { name: string; type: string; status: 'empty' }[] = [];

    if (context.creativeGoals.includes('website-app')) {
        components = [
            { name: 'Navigation', type: 'component', status: 'empty' },
            { name: 'Hero Section', type: 'component', status: 'empty' },
            { name: 'Feature Cards', type: 'component', status: 'empty' },
            { name: 'Footer', type: 'component', status: 'empty' },
            { name: 'CTA Buttons', type: 'component', status: 'empty' },
        ];
    }

    if (context.creativeGoals.includes('brand-identity')) {
        components = [
            ...components,
            { name: 'Logo Variations', type: 'asset', status: 'empty' },
            { name: 'Color Palette', type: 'asset', status: 'empty' },
            { name: 'Typography Set', type: 'asset', status: 'empty' },
            { name: 'Icon Library', type: 'asset', status: 'empty' },
        ];
    }

    // Add imagery types if specified
    const imageryTypes = visualDirection?.imageryTypes || [];
    imageryTypes.forEach((type: string) => {
        components.push({
            name: getLabelFromOptions(IMAGERY_TYPE_OPTIONS, type),
            type: 'asset',
            status: 'empty',
        });
    });

    return {
        id: generateId(),
        type: 'components_or_assets',
        title: 'Components & Assets',
        description: 'Placeholder list of components and assets to create.',
        status: 'draft',
        source: 'inferred',
        editable: true,
        content: {
            components: components.slice(0, 8), // Limit to 8 items
        },
        suggestedAction: {
            label: 'Draft First Component',
            actionId: 'draft-components'
        }
    };
}

/**
 * Notes Section - Always present
 */
export function buildNotesSection(): SpecificationSection {
    return {
        id: generateId(),
        type: 'notes',
        title: 'Notes',
        description: 'A space for additional thoughts and context.',
        status: 'draft',
        source: 'inferred',
        editable: true,
        content: {
            notes: '',
        },
    };
}
