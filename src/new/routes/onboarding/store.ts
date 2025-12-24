import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    ExtendedOnboardingProfile,
    ContextIntentData,
    VisualDirectionData,
    TearSheetIntentData,
    AIPreferencesData,
    ProjectImportData,
    BudgetPreferencesData,
    PermissionsData,
    DEFAULT_EXTENDED_PROFILE,
    ProjectType,
} from '../../../domain/onboarding-types';
import { OnboardingProfile, BudgetPolicy, EditorialPreferences, MoodboardImage, Project, ProjectContext } from '../../../domain/types';

// Step identifiers for the new flow
export type OnboardingStep =
    | 'mode'              // Step 0: Start Mode
    | 'context'           // Step 1a: Context & Intent (new project)
    | 'import'            // Step 1b: Project Import (import flow)
    | 'ai-preferences'    // Step 2: AI Preferences
    | 'budget'            // Step 3: Budget Preferences
    | 'permissions'       // Step 4: Permissions (optional)
    | 'visual'            // Step 5: Visual Direction (new project only)
    | 'tear-sheet-intent' // Step 6: Tear Sheet Intent (new project only)
    | 'generating'        // Generation Step (automatic)
    | 'complete';         // Done - redirect to tear sheet

// Progress tracking for new project flow
export const STEP_ORDER: OnboardingStep[] = ['mode', 'context', 'ai-preferences', 'budget', 'visual', 'generating', 'complete'];

// Progress tracking for import flow
export const IMPORT_STEP_ORDER: OnboardingStep[] = ['mode', 'import', 'ai-preferences', 'budget', 'generating', 'complete'];

export const STEP_METADATA: Record<OnboardingStep, {
    title: string;
    description: string;
    helperText: string;
    progressLabel: string;
}> = {
    mode: {
        title: 'What are you building?',
        description: 'Pick the type that best describes your project.',
        helperText: 'This helps Codra generate the right prompts for you.',
        progressLabel: 'Start',
    },
    context: {
        title: 'Context & Intent',
        description: 'Help us understand what you are building and for whom.',
        helperText: 'This shapes how Codra assists you throughout the project.',
        progressLabel: 'Intent',
    },
    import: {
        title: 'Import Your Project',
        description: 'Tell us about the project you\'re bringing in.',
        helperText: 'We\'ll be careful with your existing work.',
        progressLabel: 'Import',
    },
    'ai-preferences': {
        title: 'AI Preferences',
        description: 'How should AI models work for you?',
        helperText: 'These become your defaults—adjust per-task anytime.',
        progressLabel: 'AI',
    },
    budget: {
        title: 'Budget & Costs',
        description: 'How should we manage spending?',
        helperText: 'You\'re always in control—we\'ll never surprise you.',
        progressLabel: 'Budget',
    },
    permissions: {
        title: 'Permissions & Guardrails',
        description: 'What can the AI do automatically?',
        helperText: 'Set limits on autonomy and risk.',
        progressLabel: 'Permissions',
    },
    visual: {
        title: 'Visual Direction',
        description: 'Define the look and feel of your project.',
        helperText: 'These preferences generate your initial moodboard.',
        progressLabel: 'Visual',
    },
    'tear-sheet-intent': {
        title: 'Project Brief',
        description: 'Finalize the purpose and detail of your Tear Sheet.',
        helperText: 'The Tear Sheet becomes your project\'s source of truth.',
        progressLabel: 'Brief',
    },
    generating: {
        title: 'Generating Your Project',
        description: 'Creating your Moodboard and Tear Sheet...',
        helperText: 'This takes just a moment.',
        progressLabel: 'Generate',
    },
    complete: {
        title: 'Complete',
        description: 'Your project is ready for review.',
        helperText: '',
        progressLabel: 'Review',
    },
};

// Legacy support - build OnboardingProfile from new extended profile
const DEFAULT_BUDGET: BudgetPolicy = {
    maxCostPerRun: 50,
    dailyLimit: 500,
    approvalRequired: true,
};

const DEFAULT_EDITORIAL: EditorialPreferences = {
    tone: 'neutral',
    pacing: 'steady',
};

const INITIAL_LEGACY_DATA: OnboardingProfile = {
    projectName: '',
    description: '',
    audience: '',
    goals: [],
    boundaries: [],
    budgetPolicy: DEFAULT_BUDGET,
    editorialPreferences: DEFAULT_EDITORIAL,
    selectedDesks: [],
    moodboard: [],
};

interface OnboardingState {
    // Current step in the flow
    step: OnboardingStep;

    // Extended profile (new structure)
    profile: ExtendedOnboardingProfile;

    // Legacy data (for backward compatibility with existing systems)
    legacyData: OnboardingProfile;

    // Generated outputs
    generatedMoodboard: MoodboardImage[];

    // Project ID after creation
    createdProjectId: string | null;

    // Actions
    setStep: (step: OnboardingStep) => void;
    nextStep: () => void;
    prevStep: () => void;

    // Profile updates
    updateContext: (updates: Partial<ContextIntentData>) => void;
    updateVisualDirection: (updates: Partial<VisualDirectionData>) => void;
    updateTearSheetIntent: (updates: Partial<TearSheetIntentData>) => void;
    updateAIPreferences: (updates: Partial<AIPreferencesData>) => void;
    updateImportData: (updates: Partial<ProjectImportData>) => void;
    updateBudgetPreferences: (updates: Partial<BudgetPreferencesData>) => void;
    updatePermissions: (updates: Partial<PermissionsData>) => void;
    setManualSetup: (isManual: boolean) => void;
    setImportFlow: (isImport: boolean) => void;
    setProjectType: (type: ProjectType) => void;

    // Legacy data updates (for compatibility)
    updateLegacyData: (updates: Partial<OnboardingProfile>) => void;
    updateBudget: (updates: Partial<BudgetPolicy>) => void;
    updateEditorial: (updates: Partial<EditorialPreferences>) => void;

    // Output actions
    setGeneratedMoodboard: (moodboard: MoodboardImage[]) => void;
    setCreatedProjectId: (id: string) => void;

    // Reset
    reset: () => void;

    // Computed: Get project-level data
    buildProjectData: () => Partial<Project>;

    // Computed: Get context-revision snapshot data
    buildProjectContextSnapshot: () => Partial<ProjectContext>;

    // Legacy alias for compatibility
    buildLegacyProfile: () => OnboardingProfile;

    // Helper: Get current step order based on flow type
    getStepOrder: () => OnboardingStep[];
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            step: 'mode',
            profile: DEFAULT_EXTENDED_PROFILE,
            legacyData: INITIAL_LEGACY_DATA,
            generatedMoodboard: [],
            createdProjectId: null,

            setStep: (step) => set({ step }),

            getStepOrder: () => {
                const state = get();
                return state.profile.isImportFlow ? IMPORT_STEP_ORDER : STEP_ORDER;
            },

            nextStep: () => {
                const state = get();
                const stepOrder = state.profile.isImportFlow ? IMPORT_STEP_ORDER : STEP_ORDER;
                const currentIndex = stepOrder.indexOf(state.step);
                if (currentIndex < stepOrder.length - 1) {
                    set({ step: stepOrder[currentIndex + 1] });
                }
            },

            prevStep: () => {
                const state = get();
                const stepOrder = state.profile.isImportFlow ? IMPORT_STEP_ORDER : STEP_ORDER;
                const currentIndex = stepOrder.indexOf(state.step);
                if (currentIndex > 0) {
                    set({ step: stepOrder[currentIndex - 1] });
                }
            },

            updateContext: (updates) => set((state) => ({
                profile: {
                    ...state.profile,
                    context: { ...state.profile.context, ...updates }
                }
            })),

            updateVisualDirection: (updates) => set((state) => ({
                profile: {
                    ...state.profile,
                    visualDirection: { ...state.profile.visualDirection, ...updates }
                }
            })),

            updateTearSheetIntent: (updates) => set((state) => ({
                profile: {
                    ...state.profile,
                    tearSheetIntent: { ...state.profile.tearSheetIntent, ...updates }
                }
            })),

            updateAIPreferences: (updates) => set((state) => ({
                profile: {
                    ...state.profile,
                    aiPreferences: { ...state.profile.aiPreferences, ...updates }
                }
            })),

            updateImportData: (updates) => set((state) => ({
                profile: {
                    ...state.profile,
                    importData: { ...state.profile.importData, ...updates }
                }
            })),

            updateBudgetPreferences: (updates) => set((state) => ({
                profile: {
                    ...state.profile,
                    budgetPreferences: { ...state.profile.budgetPreferences, ...updates }
                }
            })),

            updatePermissions: (updates) => set((state) => ({
                profile: {
                    ...state.profile,
                    permissions: { ...state.profile.permissions, ...updates }
                }
            })),

            setManualSetup: (isManual) => set((state) => ({
                profile: { ...state.profile, isManualSetup: isManual }
            })),

            setImportFlow: (isImport) => set((state) => ({
                profile: { ...state.profile, isImportFlow: isImport }
            })),

            setProjectType: (type) => set((state) => ({
                profile: { ...state.profile, projectType: type }
            })),

            updateLegacyData: (updates) => set((state) => ({
                legacyData: { ...state.legacyData, ...updates }
            })),

            updateBudget: (updates) => set((state) => ({
                legacyData: {
                    ...state.legacyData,
                    budgetPolicy: { ...state.legacyData.budgetPolicy, ...updates }
                }
            })),

            updateEditorial: (updates) => set((state) => ({
                legacyData: {
                    ...state.legacyData,
                    editorialPreferences: {
                        ...(state.legacyData.editorialPreferences || DEFAULT_EDITORIAL),
                        ...updates
                    }
                }
            })),

            setGeneratedMoodboard: (moodboard) => set({ generatedMoodboard: moodboard }),

            setCreatedProjectId: (id) => set({ createdProjectId: id }),

            reset: () => set({
                step: 'mode',
                profile: DEFAULT_EXTENDED_PROFILE,
                legacyData: INITIAL_LEGACY_DATA,
                generatedMoodboard: [],
                createdProjectId: null,
            }),

            // Build project-level data
            buildProjectData: () => {
                const state = get();
                const { profile, legacyData } = state;

                const projectName = legacyData.projectName ||
                    (profile.context.firstProjectDescription.split('\n')[0].slice(0, 50) || 'Untitled Project');
                const summary = profile.tearSheetIntent.storyStatement || profile.context.firstProjectDescription;
                const audience = profile.context.primaryAudience || legacyData.audience || 'General';

                // Map onboarding type to domain type
                const domainType: Project['type'] =
                    profile.projectType === 'landing-page' ? 'website' :
                        profile.projectType === 'web-app' ? 'app' :
                            profile.projectType === 'marketing-site' ? 'website' :
                                profile.projectType === 'api-backend' ? 'app' :
                                    profile.projectType === 'mobile-app' ? 'app' : 'brand-identity';

                return {
                    name: projectName,
                    description: legacyData.description || summary,
                    summary,
                    type: domainType,
                    audience,
                    audienceContext: {
                        segment: profile.context.role?.includes('founder') ? 'B2B' : 'B2C',
                        sophistication: profile.context.aiFamiliarity === 'advanced' ? 'expert' : 'intermediate',
                    },
                    deliverables: profile.context.creativeGoals.map((goal, i) => ({
                        id: `deliv-${i}`,
                        name: goal.replace(/-/g, ' '),
                        type: goal.includes('website') ? 'website' :
                            goal.includes('marketing') ? 'campaign' :
                                goal.includes('content') ? 'copy' : 'design',
                        status: 'planned',
                    })),
                    brandConstraints: {
                        brandName: profile.context.role?.split(' ')[0] || 'My Brand',
                        voiceGuidelines: profile.visualDirection.personality.join(', '),
                        colors: {
                            primary: '#1A1A1A',
                            secondary: '#FFFAF0',
                            accent: '#FF4D4D',
                        },
                    },
                    successCriteria: {
                        definitionOfDone: ['Initial research completed', 'Moodboard approved'],
                        stakeholders: [{ name: 'Owner', role: 'Main decision maker' }],
                    },
                    guardrails: {
                        mustInclude: profile.context.creativeGoals,
                        mustAvoid: profile.visualDirection.mustAvoid ? [profile.visualDirection.mustAvoid] : [],
                        autonomyLevel: profile.permissions.defaultAutonomy || 'suggest-only',
                    },
                    budgetPolicy: {
                        ...legacyData.budgetPolicy,
                        dailyLimit: profile.budgetPreferences.dailyBudgetLimit || 50,
                        budgetMode: profile.budgetPreferences.budgetMode || 'smart-balance',
                    },
                };
            },

            // Build context-revision snapshot data
            buildProjectContextSnapshot: () => {
                const state = get();
                const projectData = state.buildProjectData();
                const { generatedMoodboard } = state;

                return {
                    title: projectData.name || 'Project Context',
                    identity: {
                        name: projectData.name || '',
                        summary: projectData.summary || '',
                        type: projectData.type,
                    },
                    deliverables: projectData.deliverables || [],
                    audience: {
                        primary: projectData.audience || 'General',
                        context: projectData.audienceContext,
                    },
                    brand: projectData.brandConstraints || {},
                    success: projectData.successCriteria || {},
                    guardrails: projectData.guardrails || {},
                    // Add moodboard for backwards compatibility in the UI for now
                    moodboard: generatedMoodboard,
                } as any;
            },

            // Legacy alias for compatibility
            buildLegacyProfile: () => {
                return (get() as any).buildProjectData();
            },
        }),
        {
            name: 'codra-onboarding',
            partialize: (state) => ({
                profile: state.profile,
                legacyData: state.legacyData,
                step: state.step,
            }),
        }
    )
);

// Helper: Check if step requirements are met
export function canProceedFromStep(step: OnboardingStep, state: OnboardingState): boolean {
    switch (step) {
        case 'mode':
            return true; // Always can proceed from mode selection

        case 'context':
            const ctx = state.profile.context;
            const tsi = state.profile.tearSheetIntent;
            return !!(
                ctx.firstProjectDescription &&
                state.profile.projectType &&
                ctx.primaryAudience &&
                ctx.creativeGoals.length > 0 &&
                tsi.storyStatement &&
                tsi.coreMessage
            );

        case 'import':
            const imp = state.profile.importData;
            return !!(
                imp.projectType &&
                imp.projectSummary.trim().length > 0 &&
                imp.projectStage &&
                imp.importGoals.length > 0 &&
                imp.cautionLevel &&
                imp.aiDisagreementBehavior
            );

        case 'ai-preferences':
            const ai = state.profile.aiPreferences;
            return !!(
                ai.qualityPriority &&
                ai.dataSensitivity &&
                ai.multiModelStrategy
            );

        case 'budget':
            const budget = state.profile.budgetPreferences;
            return !!(
                budget.budgetMode
            );

        case 'permissions':
            // Permissions is optional - always can proceed
            return true;

        case 'visual':
            const vis = state.profile.visualDirection;
            return !!(
                vis.personality.length > 0 &&
                vis.visualAudience.length > 0 &&
                vis.visualStyles.length > 0 &&
                vis.colorDirections.length > 0
            );

        default:
            return true;
    }
}

// Helper: Get step progress percentage
export function getStepProgress(step: OnboardingStep, isImportFlow: boolean = false): number {
    const stepOrder = isImportFlow ? IMPORT_STEP_ORDER : STEP_ORDER;
    const index = stepOrder.indexOf(step);
    return Math.round((index / (stepOrder.length - 1)) * 100);
}
