/**
 * ONBOARDING TYPES
 * Domain types for the consultative intake system
 * Produces Moodboard v1 and Tear Sheet v1 as project source of truth
 */
import type { 
    QualityCostLatencyPriority, 
    DataSensitivity, 
    MultiModelStrategy, 
    LowConfidenceBehavior, 
    AIPreferencesData,
    ProductionDeskId
} from './types';

export type { 
    QualityCostLatencyPriority, 
    DataSensitivity, 
    MultiModelStrategy, 
    LowConfidenceBehavior, 
    AIPreferencesData,
    ProductionDeskId
};

// ============================================
// Step 1: Context & Intent
// ============================================

export type UserRole =
    | 'founder-ceo'
    | 'marketer'
    | 'designer'
    | 'developer'
    | 'content-creator'
    | 'agency-consultant'
    | 'student-hobbyist';

export type CreativeGoal =
    | 'brand-identity'
    | 'client-brand-execution'
    | 'marketing-campaign'
    | 'social-content'
    | 'product-packaging'
    | 'website-app'
    | 'pitch-deck'
    | 'print-materials'
    | 'video-motion';

// ============================================
// Project Type (for streamlined onboarding)
// ============================================

export type ProjectType =
    | 'landing-page'
    | 'web-app'
    | 'marketing-site'
    | 'api-backend'
    | 'mobile-app'
    | 'other';

export const PROJECT_TYPE_OPTIONS: { id: ProjectType; label: string; description: string; icon: string }[] = [
    { id: 'marketing-site', label: 'Marketing Campaign', description: 'Full-funnel campaign production', icon: '🚀' },
    { id: 'landing-page', label: 'Brand System', description: 'Complete visual and verbal identity', icon: '🎨' },
    { id: 'web-app', label: 'Product / SaaS', description: 'Interactive application experience', icon: '🖥️' },
    { id: 'mobile-app', label: 'Mobile App', description: 'iOS or Android implementation', icon: '📱' },
    { id: 'other', label: 'Custom Project', description: 'Bespoke production work', icon: '✨' },
];

export type AIFamiliarity =
    | 'beginner'
    | 'some-experience'
    | 'regular-user'
    | 'advanced';

export type AIWorkStyle =
    | 'full-automation'
    | 'suggest-then-approve'
    | 'collaborate-back-forth'
    | 'manual-plus-assist';

export type TopPriorityOutcome =
    | 'speed'
    | 'quality'
    | 'originality'
    | 'brand-consistency'
    | 'cost-efficiency';

export type PrimaryAudienceToImpress =
    | 'customers'
    | 'investors'
    | 'internal-team'
    | 'partners'
    | 'personal-portfolio';

export interface ContextIntentData {
    role: UserRole | null;
    creativeGoals: CreativeGoal[]; // Up to 3
    aiFamiliarity: AIFamiliarity | null;
    aiWorkStyle: AIWorkStyle | null;
    topPriority: TopPriorityOutcome | null;
    primaryAudience: PrimaryAudienceToImpress | null;
    firstProjectDescription: string; // One sentence
}

// ============================================
// Step 2: Visual Direction (Moodboard Inputs)
// ============================================

export type ProductPersonality =
    | 'bold-confident'
    | 'minimal-refined'
    | 'warm-approachable'
    | 'playful-energetic'
    | 'premium-luxurious'
    | 'technical-precise'
    | 'organic-natural'
    | 'edgy-provocative'
    | 'not-sure';

export type VisualAudience =
    | 'gen-z'
    | 'millennials'
    | 'gen-x'
    | 'boomers'
    | 'enterprise-professionals'
    | 'creative-professionals'
    | 'families'
    | 'luxury-consumers';

export type VisualStyle =
    | 'clean-modern'
    | 'vintage-retro'
    | 'maximalist'
    | 'brutalist'
    | 'organic-flowing'
    | 'geometric-structured'
    | 'photographic-realistic'
    | 'illustrated-artistic'
    | 'not-sure';

export type LayoutPreference =
    | 'asymmetric-dynamic'
    | 'grid-structured'
    | 'centered-minimal'
    | 'magazine-editorial'
    | 'immersive-full-bleed'
    | 'not-sure';

export type ColorDirection =
    | 'neutral-monochrome'
    | 'warm-earth-tones'
    | 'cool-blues-greens'
    | 'vibrant-saturated'
    | 'pastel-soft'
    | 'dark-moody'
    | 'brand-specific'
    | 'not-sure';

export type TypographyVibe =
    | 'classic-serif'
    | 'modern-sans'
    | 'display-statement'
    | 'handwritten-organic'
    | 'technical-mono'
    | 'mixed-eclectic'
    | 'not-sure';

export type ImageryType =
    | 'photography-lifestyle'
    | 'photography-product'
    | 'illustration-flat'
    | 'illustration-detailed'
    | '3d-renders'
    | 'abstract-textures'
    | 'icons-graphics'
    | 'data-visualization'
    | 'not-sure';

export type ExistingBrandAssets =
    | 'full-brand-guidelines'
    | 'logo-colors-only'
    | 'some-existing-materials'
    | 'starting-fresh';

export interface VisualDirectionData {
    personality: ProductPersonality[]; // Up to 3
    visualAudience: VisualAudience[]; // Multi-select
    desiredFeeling: string; // Short text
    visualStyles: VisualStyle[]; // Up to 3
    layoutPreference: LayoutPreference | null;
    similarBrands: string; // Short text
    colorAdventurousness: number; // 1-5 scale
    colorDirections: ColorDirection[]; // Up to 3
    typographyVibe: TypographyVibe | null;
    imageryTypes: ImageryType[]; // Up to 3
    mustAvoid: string; // Short text
    existingAssets: ExistingBrandAssets | null;
}

// ============================================
// Step 3: Tear Sheet Intent
// ============================================

export type ProductStoryStatement =
    | 'disrupt-innovate'
    | 'trusted-reliable'
    | 'accessible-for-all'
    | 'premium-exclusive'
    | 'community-driven'
    | 'efficiency-focused';

export type MoodboardUseCase =
    | 'internal-alignment'
    | 'client-presentation'
    | 'designer-handoff'
    | 'ai-generation-guide'
    | 'personal-reference';

export interface TearSheetIntentData {
    storyStatement: ProductStoryStatement | null;
    coreMessage: string; // Single most important idea
    useCase: MoodboardUseCase | null;
    detailLevel: number; // 1-5 scale
}

// ============================================
// Step 4: AI Preferences (Router Defaults)
// ============================================

// Preferences are now imported from types.ts

// ============================================
// Project Import
// ============================================

export type ImportProjectType =
    | 'design'
    | 'codebase'
    | 'content'
    | 'mixed';

export type ImportProjectStage =
    | 'early-concept'
    | 'mid-project'
    | 'nearly-finished';

export type ImportCautionLevel = 1 | 2 | 3 | 4 | 5;

export type ImportSourceOfTruth =
    | 'design-tool'
    | 'code-repo'
    | 'document-deck'
    | 'mixed'
    | 'undefined';

export type AIDisagreementBehavior =
    | 'adapt-quietly'
    | 'suggest-gently'
    | 'propose-boldly';

export type ImportGoal =
    | 'clean-refactor'
    | 'add-features'
    | 'improve-design'
    | 'improve-narrative'
    | 'generate-assets'
    | 'get-feedback';

export type ImportPainPoint =
    | 'visual-inconsistency'
    | 'code-quality'
    | 'narrative-clarity'
    | 'cohesion'
    | 'iteration-speed'
    | 'onboarding-others';

export type ImportOffLimitsArea =
    | 'visual-identity'
    | 'key-layouts'
    | 'production-code'
    | 'legal-copy'
    | 'none';

export interface ProjectImportData {
    projectType: ImportProjectType | null;
    projectSummary: string; // 1-2 sentences
    projectStage: ImportProjectStage | null;
    importGoals: ImportGoal[]; // Up to 3
    successCriteria: string; // Short text
    cautionLevel: ImportCautionLevel;
    offLimitsAreas: ImportOffLimitsArea[]; // Up to 3
    offLimitsOther: string; // Optional "other" text
    sourceOfTruth: ImportSourceOfTruth | null;
    hasExistingStyles: boolean | null;
    painPoints: ImportPainPoint[]; // Up to 3
    aiDisagreementBehavior: AIDisagreementBehavior | null;
    doNotBreak: string; // Single sentence
}

// ============================================
// Budget Preferences (Plain Language)
// ============================================

export type CostQualityPriority = 'cost-first' | 'balanced' | 'quality-first';

export type UsageIntent = 'trying-out' | 'few-per-week' | 'daily' | 'heavy';

export type BudgetFraming = 'monthly' | 'per-project' | 'auto-safe';

export type BudgetMode = 'budget' | 'smart-balance' | 'performance';

export type OverageBehavior = 'hard-stop' | 'soft-warning' | 'allow-small';

export type NearLimitBehavior = 'banner' | 'ask-switch' | 'auto-switch';

export type CostVisibility = 'progress-bar' | 'currency-estimate' | 'detailed';

export type PriorityTaskType =
    | 'client-facing'
    | 'production-code'
    | 'portfolio-resume'
    | 'none';

export interface BudgetPreferencesData {
    costQualityPriority: CostQualityPriority | null;
    usageIntent: UsageIntent | null;
    budgetFraming: BudgetFraming | null;
    budgetMode: BudgetMode | null;
    overageBehavior: OverageBehavior | null;
    nearLimitBehavior: NearLimitBehavior | null;
    priorityTasks: PriorityTaskType[]; // max 3
    costVisibility: CostVisibility | null;
    dailyBudgetLimit: number; // Simplified budget setting
}

// ============================================
// Permissions & Guardrails
// ============================================

export type AutonomyLevel = 'suggest-only' | 'apply-with-approval' | 'auto-apply';

export type ApprovalRequired =
    | 'deploy'
    | 'client-facing'
    | 'pricing-changes'
    | 'production-db'
    | 'external-emails'
    | 'legal-copy';

export type MaxStepsBeforePause = 5 | 10 | 25 | 0; // 0 = unlimited

export type RiskTolerance = 1 | 2 | 3 | 4 | 5;

export type UnacceptableMistake =
    | 'breaking-builds'
    | 'legal-copy-changes'
    | 'data-loss'
    | 'security-issues'
    | 'client-visible-errors';

export type DataAccessMode = 'ephemeral' | 'session-logs' | 'persistent';

export type ConflictResolution = 'ask-user' | 'follow-config' | 'abort';

export interface PermissionsData {
    defaultAutonomy: AutonomyLevel | null;
    alwaysRequireApproval: ApprovalRequired[];
    maxStepsBeforePause: MaxStepsBeforePause;
    riskTolerance: RiskTolerance;
    neverAcceptableMistakes: UnacceptableMistake[];
    dataAccessMode: DataAccessMode | null;
    conflictResolution: ConflictResolution | null;
}

// ============================================
// Combined Onboarding Profile (Extended)
// ============================================

export interface ExtendedOnboardingProfile {
    // Step 0: Mode
    isManualSetup: boolean;
    isImportFlow: boolean;

    // Project Type (for streamlined onboarding)
    projectType: ProjectType | null;

    // Step 1: Context & Intent (new project) or Import (import flow)
    context: ContextIntentData;
    importData: ProjectImportData;

    // Step 2: AI Preferences
    aiPreferences: AIPreferencesData;

    // Step 3: Budget Preferences
    budgetPreferences: BudgetPreferencesData;

    // Step 4: Permissions & Guardrails (optional)
    permissions: PermissionsData;

    // Step 5: Visual Direction (new project only)
    visualDirection: VisualDirectionData;

    // Step 6: Tear Sheet Intent (new project only)
    tearSheetIntent: TearSheetIntentData;

    // Generated Outputs
    generatedMoodboardId?: string;
    generatedTearSheetId?: string;
}

// Default/empty states
export const DEFAULT_CONTEXT_INTENT: ContextIntentData = {
    role: null,
    creativeGoals: [],
    aiFamiliarity: null,
    aiWorkStyle: null,
    topPriority: null,
    primaryAudience: null,
    firstProjectDescription: '',
};

export const DEFAULT_VISUAL_DIRECTION: VisualDirectionData = {
    personality: [],
    visualAudience: [],
    desiredFeeling: '',
    visualStyles: [],
    layoutPreference: null,
    similarBrands: '',
    colorAdventurousness: 3,
    colorDirections: [],
    typographyVibe: null,
    imageryTypes: [],
    mustAvoid: '',
    existingAssets: null,
};

export const DEFAULT_TEAR_SHEET_INTENT: TearSheetIntentData = {
    storyStatement: null,
    coreMessage: '',
    useCase: null,
    detailLevel: 3,
};

export const DEFAULT_AI_PREFERENCES: AIPreferencesData = {
    qualityPriority: null,
    latencyTolerance: 3,
    costSensitivity: 3,
    dataSensitivity: 'internal-not-sensitive',
    instructionStrictness: 3,
    multiModelStrategy: 'system-decides',
    lowConfidenceBehavior: 'ask-clarifying',
    showModelPerStep: false,
    smartMode: true,
};

export const DEFAULT_PROJECT_IMPORT: ProjectImportData = {
    projectType: null,
    projectSummary: '',
    projectStage: null,
    importGoals: [],
    successCriteria: '',
    cautionLevel: 3,
    offLimitsAreas: [],
    offLimitsOther: '',
    sourceOfTruth: null,
    hasExistingStyles: null,
    painPoints: [],
    aiDisagreementBehavior: null,
    doNotBreak: '',
};

export const DEFAULT_BUDGET_PREFERENCES: BudgetPreferencesData = {
    costQualityPriority: null,
    usageIntent: null,
    budgetFraming: null,
    budgetMode: null,
    overageBehavior: null,
    nearLimitBehavior: null,
    priorityTasks: [],
    costVisibility: 'progress-bar',
    dailyBudgetLimit: 50,
};

export const DEFAULT_PERMISSIONS: PermissionsData = {
    defaultAutonomy: null,
    alwaysRequireApproval: [],
    maxStepsBeforePause: 10,
    riskTolerance: 3,
    neverAcceptableMistakes: [],
    dataAccessMode: 'session-logs',
    conflictResolution: 'ask-user',
};

export const DEFAULT_EXTENDED_PROFILE: ExtendedOnboardingProfile = {
    isManualSetup: false,
    isImportFlow: false,
    projectType: null,
    context: DEFAULT_CONTEXT_INTENT,
    importData: DEFAULT_PROJECT_IMPORT,
    aiPreferences: DEFAULT_AI_PREFERENCES,
    budgetPreferences: DEFAULT_BUDGET_PREFERENCES,
    permissions: DEFAULT_PERMISSIONS,
    visualDirection: DEFAULT_VISUAL_DIRECTION,
    tearSheetIntent: DEFAULT_TEAR_SHEET_INTENT,
};

// ============================================
// Option Labels (for UI)
// ============================================

export const ROLE_OPTIONS: { id: UserRole; label: string; description: string }[] = [
    { id: 'founder-ceo', label: 'Founder / CEO', description: 'Building a company or product from scratch' },
    { id: 'marketer', label: 'Marketing Professional', description: 'Managing campaigns and brand growth' },
    { id: 'designer', label: 'Designer', description: 'Creating visual and UX solutions' },
    { id: 'developer', label: 'Developer', description: 'Building products with code' },
    { id: 'content-creator', label: 'Content Creator', description: 'Making content for audiences' },
    { id: 'agency-consultant', label: 'Agency / Consultant', description: 'Serving multiple clients' },
    { id: 'student-hobbyist', label: 'Student / Hobbyist', description: 'Learning or creating for fun' },
];

export const CREATIVE_GOAL_OPTIONS: { id: CreativeGoal; label: string }[] = [
    { id: 'brand-identity', label: 'New Brand Identity' },
    { id: 'client-brand-execution', label: 'Client Brand Execution' },
    { id: 'marketing-campaign', label: 'Marketing Campaign' },
    { id: 'social-content', label: 'Social Media Assets' },
    { id: 'product-packaging', label: 'Product & Packaging' },
    { id: 'website-app', label: 'Website or App Design' },
    { id: 'pitch-deck', label: 'Pitch Deck / Sales Tools' },
    { id: 'video-motion', label: 'Video / Motion Graphics' },
];

export const AI_FAMILIARITY_OPTIONS: { id: AIFamiliarity; label: string; description: string }[] = [
    { id: 'beginner', label: 'New to AI tools', description: 'Have not used AI image or text generation before' },
    { id: 'some-experience', label: 'Some experience', description: 'Have tried a few AI tools casually' },
    { id: 'regular-user', label: 'Regular user', description: 'Use AI tools weekly in my workflow' },
    { id: 'advanced', label: 'Advanced user', description: 'Deep experience with prompting and models' },
];

export const AI_WORKSTYLE_OPTIONS: { id: AIWorkStyle; label: string; description: string }[] = [
    { id: 'full-automation', label: 'Automated execution', description: 'Generate results; review at completion' },
    { id: 'suggest-then-approve', label: 'Propose then require approval', description: 'Present options before execution' },
    { id: 'collaborate-back-forth', label: 'Interactive execution', description: 'Iterative execution with review checkpoints' },
    { id: 'manual-plus-assist', label: 'Manual execution with assist', description: 'Operator decisions with assisted execution' },
];

export const TOP_PRIORITY_OPTIONS: { id: TopPriorityOutcome; label: string }[] = [
    { id: 'speed', label: 'Get results fast' },
    { id: 'quality', label: 'Highest possible quality' },
    { id: 'originality', label: 'Unique and original output' },
    { id: 'brand-consistency', label: 'Match existing brand perfectly' },
    { id: 'cost-efficiency', label: 'Stay within budget' },
];

export const PRIMARY_AUDIENCE_OPTIONS: { id: PrimaryAudienceToImpress; label: string }[] = [
    { id: 'customers', label: 'Customers / Users' },
    { id: 'investors', label: 'Investors / Stakeholders' },
    { id: 'internal-team', label: 'Internal Team / Leadership' },
    { id: 'partners', label: 'Partners / Collaborators' },
    { id: 'personal-portfolio', label: 'Personal Portfolio' },
];

export const PERSONALITY_OPTIONS: { id: ProductPersonality; label: string; description: string }[] = [
    { id: 'bold-confident', label: 'Bold & Confident', description: 'Strong, loud, and assertive' },
    { id: 'minimal-refined', label: 'Minimal & Refined', description: 'Quiet, simple, and high-end' },
    { id: 'warm-approachable', label: 'Warm & Approachable', description: 'Friendly, kind, and inviting' },
    { id: 'playful-energetic', label: 'Playful & Energetic', description: 'Fun, active, and optimistic' },
    { id: 'premium-luxurious', label: 'Premium & Luxurious', description: 'Exclusive, elegant, and sophisticated' },
    { id: 'technical-precise', label: 'Technical & Precise', description: 'Accurate, detailed, and professional' },
    { id: 'organic-natural', label: 'Organic & Natural', description: 'Soft, earthy, and human' },
    { id: 'edgy-provocative', label: 'Edgy & Provocative', description: 'Daring, unconventional, and sharp' },
    { id: 'not-sure', label: 'Undecided', description: 'Auto-select and propose options' },
];

export const VISUAL_AUDIENCE_OPTIONS: { id: VisualAudience; label: string }[] = [
    { id: 'gen-z', label: 'Gen Z (18-26)' },
    { id: 'millennials', label: 'Millennials (27-42)' },
    { id: 'gen-x', label: 'Gen X (43-58)' },
    { id: 'boomers', label: 'Boomers (59+)' },
    { id: 'enterprise-professionals', label: 'Enterprise Professionals' },
    { id: 'creative-professionals', label: 'Creative Professionals' },
    { id: 'families', label: 'Families' },
    { id: 'luxury-consumers', label: 'Luxury Consumers' },
];

export const VISUAL_STYLE_OPTIONS: { id: VisualStyle; label: string; description: string }[] = [
    { id: 'clean-modern', label: 'Clean & Modern', description: 'Simple, current, and balanced' },
    { id: 'vintage-retro', label: 'Vintage & Retro', description: 'Inspired by the past' },
    { id: 'maximalist', label: 'Maximalist', description: 'More is more—rich and dense' },
    { id: 'brutalist', label: 'Brutalist', description: 'Raw, unpolished, and bold' },
    { id: 'organic-flowing', label: 'Organic & Flowing', description: 'Natural and curved shapes' },
    { id: 'geometric-structured', label: 'Geometric & Structured', description: 'Precise and mathematically balanced' },
    { id: 'photographic-realistic', label: 'Photographic & Realistic', description: 'Real-world imagery and depth' },
    { id: 'illustrated-artistic', label: 'Illustrated & Artistic', description: 'Stylized and hand-crafted' },
    { id: 'not-sure', label: 'Undecided', description: 'Style to be determined' },
];

export const LAYOUT_OPTIONS: { id: LayoutPreference; label: string; description: string }[] = [
    { id: 'asymmetric-dynamic', label: 'Asymmetric & Dynamic', description: 'Varied, engaging layouts' },
    { id: 'grid-structured', label: 'Grid-Based', description: 'Organized and predictable' },
    { id: 'centered-minimal', label: 'Centered & Minimal', description: 'Simple, focused layouts' },
    { id: 'magazine-editorial', label: 'Magazine Editorial', description: 'Rich, story-driven layouts' },
    { id: 'immersive-full-bleed', label: 'Immersive Full-Bleed', description: 'Edge-to-edge visual impact' },
    { id: 'not-sure', label: 'Undecided', description: 'Decide based on content' },
];

export const COLOR_DIRECTION_OPTIONS: { id: ColorDirection; label: string; description: string }[] = [
    { id: 'neutral-monochrome', label: 'Neutral / Monochrome', description: 'Grays, blacks, and whites' },
    { id: 'warm-earth-tones', label: 'Warm / Earth Tones', description: 'Reds, oranges, browns' },
    { id: 'cool-blues-greens', label: 'Cool Blues & Greens', description: 'Calm and steady' },
    { id: 'vibrant-saturated', label: 'Vibrant & Saturated', description: 'High-energy colors' },
    { id: 'pastel-soft', label: 'Pastel & Soft', description: 'Gentle and low-contrast' },
    { id: 'dark-moody', label: 'Dark & Moody', description: 'Deep, atmospheric tones' },
    { id: 'brand-specific', label: 'Match My Brand', description: 'I already have a palette' },
    { id: 'not-sure', label: 'Undecided', description: 'Review options' },
];

export const TYPOGRAPHY_OPTIONS: { id: TypographyVibe; label: string; description: string }[] = [
    { id: 'classic-serif', label: 'Classic Serif', description: 'Traditional, authoritative' },
    { id: 'modern-sans', label: 'Modern Sans', description: 'Clean, contemporary' },
    { id: 'display-statement', label: 'Display / Statement', description: 'Bold, attention-grabbing' },
    { id: 'handwritten-organic', label: 'Handwritten / Organic', description: 'Personal, approachable' },
    { id: 'technical-mono', label: 'Technical / Mono', description: 'Precise, code-like' },
    { id: 'mixed-eclectic', label: 'Mixed / Eclectic', description: 'Varied type pairing' },
    { id: 'not-sure', label: 'Undecided', description: 'Select based on content' },
];

export const IMAGERY_TYPE_OPTIONS: { id: ImageryType; label: string; description: string }[] = [
    { id: 'photography-lifestyle', label: 'Lifestyle Photography', description: 'People and environments' },
    { id: 'photography-product', label: 'Product Photography', description: 'Focused on items' },
    { id: 'illustration-flat', label: 'Flat Illustrations', description: 'Simple, 2D art' },
    { id: 'illustration-detailed', label: 'Detailed Illustrations', description: 'Rich, textured art' },
    { id: '3d-renders', label: '3D Renders', description: 'Digital depth and realism' },
    { id: 'abstract-textures', label: 'Abstract / Textures', description: 'Atmospheric patterns' },
    { id: 'icons-graphics', label: 'Icons & Graphics', description: 'Functional visual elements' },
    { id: 'data-visualization', label: 'Data Visualization', description: 'Charts and evidence' },
    { id: 'not-sure', label: 'Undecided', description: 'Select based on content' },
];

export const EXISTING_ASSETS_OPTIONS: { id: ExistingBrandAssets; label: string; description: string }[] = [
    { id: 'full-brand-guidelines', label: 'Full brand guidelines', description: 'Complete style guide available' },
    { id: 'logo-colors-only', label: 'Logo and colors', description: 'Basic brand assets exist' },
    { id: 'some-existing-materials', label: 'Some existing materials', description: 'Scattered brand elements' },
    { id: 'starting-fresh', label: 'Starting fresh', description: 'No existing brand assets' },
];

export const STORY_STATEMENT_OPTIONS: { id: ProductStoryStatement; label: string; description: string }[] = [
    { id: 'disrupt-innovate', label: 'Disrupt & Innovate', description: 'Challenge the status quo' },
    { id: 'trusted-reliable', label: 'Trusted & Reliable', description: 'Dependable and established' },
    { id: 'accessible-for-all', label: 'Accessible for All', description: 'Inclusive and welcoming' },
    { id: 'premium-exclusive', label: 'Premium & Exclusive', description: 'High-end and selective' },
    { id: 'community-driven', label: 'Community-Driven', description: 'Built around connection' },
    { id: 'efficiency-focused', label: 'Efficiency-Focused', description: 'Results and productivity' },
];

export const USE_CASE_OPTIONS: { id: MoodboardUseCase; label: string; description: string }[] = [
    { id: 'internal-alignment', label: 'Internal alignment', description: 'Get team on the same page' },
    { id: 'client-presentation', label: 'Client presentation', description: 'Present direction to stakeholders' },
    { id: 'designer-handoff', label: 'Designer handoff', description: 'Brief for design execution' },
    { id: 'ai-generation-guide', label: 'AI generation guide', description: 'Reference for AI-assisted creation' },
    { id: 'personal-reference', label: 'Personal reference', description: 'My own creative direction' },
];

// ============================================
// AI Preferences Options (for UI)
// ============================================

export const QUALITY_PRIORITY_OPTIONS: { id: QualityCostLatencyPriority; label: string; description: string }[] = [
    { id: 'quality', label: 'Highest quality', description: 'Best results, regardless of time or cost' },
    { id: 'balanced', label: 'Balanced', description: 'Good quality with reasonable speed and cost' },
    { id: 'fast', label: 'Fast responses', description: 'Speed matters most, quality can be good enough' },
    { id: 'cheap', label: 'Lowest cost', description: 'Minimize spending, results can be basic' },
];

export const DATA_SENSITIVITY_OPTIONS: { id: DataSensitivity; label: string; description: string }[] = [
    { id: 'public-demo', label: 'Public / Demo', description: 'Nothing sensitive here' },
    { id: 'internal-not-sensitive', label: 'Internal', description: 'Not public, but not sensitive' },
    { id: 'confidential', label: 'Confidential', description: 'Customer, financial, or HR data' },
    { id: 'highly-regulated', label: 'Highly Regulated', description: 'Health, legal, or heavy PII' },
];

export const MULTI_MODEL_STRATEGY_OPTIONS: { id: MultiModelStrategy; label: string; description: string }[] = [
    { id: 'cheap-explore-quality-final', label: 'Draft low-cost, finalize high-quality', description: 'Fast models for drafts, best for final passes' },
    { id: 'always-best', label: 'Always use the best', description: 'Top-tier models for every step' },
    { id: 'always-cheapest', label: 'Always use the cheapest', description: 'Most cost-efficient models only' },
    { id: 'system-decides', label: 'System selected', description: 'Auto-select based on task' },
];

export const LOW_CONFIDENCE_OPTIONS: { id: LowConfidenceBehavior; label: string; description: string }[] = [
    { id: 'ask-clarifying', label: 'Require clarification', description: 'Clarify before proceeding' },
    { id: 'try-stronger-model', label: 'Auto-upgrade model', description: 'Automatically upgrade for hard tasks' },
    { id: 'flag-low-confidence', label: 'Flag low confidence', description: 'Show results but warn me' },
    { id: 'decline-conservative', label: 'Be conservative', description: 'Decline rather than guess' },
];

// ============================================
// Project Import Options (for UI)
// ============================================

export const IMPORT_PROJECT_TYPE_OPTIONS: { id: ImportProjectType; label: string; description: string }[] = [
    { id: 'design', label: 'Design Project', description: 'Figma, Sketch, XD, or design system' },
    { id: 'codebase', label: 'Codebase', description: 'Frontend, backend, or full stack' },
    { id: 'content', label: 'Content Project', description: 'Deck, resume, docs, website copy' },
    { id: 'mixed', label: 'Mixed Project', description: 'Design + code + docs' },
];

export const IMPORT_PROJECT_STAGE_OPTIONS: { id: ImportProjectStage; label: string; description: string }[] = [
    { id: 'early-concept', label: 'Early concept', description: 'Rough draft, still exploring' },
    { id: 'mid-project', label: 'Mid-project', description: 'Core direction is set' },
    { id: 'nearly-finished', label: 'Nearly finished', description: 'Mostly polish remaining' },
];

export const IMPORT_GOAL_OPTIONS: { id: ImportGoal; label: string }[] = [
    { id: 'clean-refactor', label: 'Clean up & refactor' },
    { id: 'add-features', label: 'Add new features' },
    { id: 'improve-design', label: 'Improve visual design' },
    { id: 'improve-narrative', label: 'Improve story / messaging' },
    { id: 'generate-assets', label: 'Generate supporting assets' },
    { id: 'get-feedback', label: 'Get feedback & suggestions' },
];

export const IMPORT_SOURCE_OPTIONS: { id: ImportSourceOfTruth; label: string; description: string }[] = [
    { id: 'design-tool', label: 'Design Tool', description: 'Figma, Sketch, etc.' },
    { id: 'code-repo', label: 'Code Repository', description: 'GitHub, GitLab, Bitbucket' },
    { id: 'document-deck', label: 'Document / Deck', description: 'Docs, Notion, Slides' },
    { id: 'mixed', label: 'Multiple tools', description: 'Split across platforms' },
    { id: 'undefined', label: 'Not defined yet', description: 'Still figuring it out' },
];

export const IMPORT_PAIN_POINT_OPTIONS: { id: ImportPainPoint; label: string }[] = [
    { id: 'visual-inconsistency', label: 'Visual inconsistency' },
    { id: 'code-quality', label: 'Code quality issues' },
    { id: 'narrative-clarity', label: 'Unclear messaging' },
    { id: 'cohesion', label: 'Lack of cohesion' },
    { id: 'iteration-speed', label: 'Slow iteration' },
    { id: 'onboarding-others', label: 'Hard to onboard others' },
];

export const IMPORT_OFF_LIMITS_OPTIONS: { id: ImportOffLimitsArea; label: string }[] = [
    { id: 'visual-identity', label: 'Visual identity (logo, colors)' },
    { id: 'key-layouts', label: 'Key screens / layouts' },
    { id: 'production-code', label: 'Production-critical code' },
    { id: 'legal-copy', label: 'Legal / compliance copy' },
    { id: 'none', label: 'Nothing is off-limits' },
];

export const AI_DISAGREEMENT_OPTIONS: { id: AIDisagreementBehavior; label: string; description: string }[] = [
    { id: 'adapt-quietly', label: 'Adapt to my direction', description: 'Work within my constraints' },
    { id: 'suggest-gently', label: 'Suggest alternatives gently', description: 'Keep my approach primary' },
    { id: 'propose-boldly', label: 'Propose different directions', description: 'Explain why you disagree' },
];

// ============================================
// Budget Preferences Options (for UI)
// ============================================

export const COST_QUALITY_OPTIONS: { id: CostQualityPriority; label: string; description: string }[] = [
    { id: 'cost-first', label: 'Keep costs low', description: 'I need to minimize spending' },
    { id: 'balanced', label: 'Balance cost and quality', description: 'Good results at reasonable cost' },
    { id: 'quality-first', label: 'Quality matters most', description: 'I care more about results than cost' },
];

export const USAGE_INTENT_OPTIONS: { id: UsageIntent; label: string; description: string }[] = [
    { id: 'trying-out', label: 'Just trying it out', description: 'Experimenting, don\'t want surprises' },
    { id: 'few-per-week', label: 'A few tasks a week', description: 'Light but regular use' },
    { id: 'daily', label: 'Daily for work', description: 'Part of my workflow' },
    { id: 'heavy', label: 'Heavy use', description: 'Multiple projects, constant use' },
];

export const BUDGET_FRAMING_OPTIONS: { id: BudgetFraming; label: string; description: string }[] = [
    { id: 'monthly', label: 'Monthly budget', description: 'Keep me around $X/month' },
    { id: 'per-project', label: 'Per project', description: 'Don\'t exceed $X on this project' },
    { id: 'auto-safe', label: 'Not sure', description: 'Keep me on safest settings' },
];

export const BUDGET_MODE_OPTIONS: { id: BudgetMode; label: string; description: string }[] = [
    { id: 'budget', label: 'Budget mode', description: 'Use cheaper options where possible' },
    { id: 'smart-balance', label: 'Smart balance', description: 'Mix cheaper and premium when it matters' },
    { id: 'performance', label: 'Performance mode', description: 'Prioritize quality, even if it costs more' },
];

export const OVERAGE_BEHAVIOR_OPTIONS: { id: OverageBehavior; label: string; description: string }[] = [
    { id: 'hard-stop', label: 'Stop and ask', description: 'Never go over my budget' },
    { id: 'soft-warning', label: 'Warn me first', description: 'Let me decide when close' },
    { id: 'allow-small', label: 'Allow small overages', description: 'Keep going for important tasks' },
];

export const NEAR_LIMIT_OPTIONS: { id: NearLimitBehavior; label: string; description: string }[] = [
    { id: 'banner', label: 'Show a banner', description: '"You\'re at 80% of your budget"' },
    { id: 'ask-switch', label: 'Ask me', description: '"Switch to cheaper mode?"' },
    { id: 'auto-switch', label: 'Auto-switch', description: 'Stretch what\'s left automatically' },
];

export const PRIORITY_TASK_OPTIONS: { id: PriorityTaskType; label: string }[] = [
    { id: 'client-facing', label: 'Client/investor deliverables' },
    { id: 'production-code', label: 'Production code changes' },
    { id: 'portfolio-resume', label: 'Portfolio/resume work' },
    { id: 'none', label: 'Treat everything the same' },
];

export const COST_VISIBILITY_OPTIONS: { id: CostVisibility; label: string; description: string }[] = [
    { id: 'progress-bar', label: 'Simple progress bar', description: 'Light → Medium → Heavy' },
    { id: 'currency-estimate', label: 'Currency estimates', description: '≈ $0.10 for this task' },
    { id: 'detailed', label: 'Detailed stats', description: 'Full numbers and breakdowns' },
];

// ============================================
// Permissions Options (for UI)
// ============================================

export const AUTONOMY_OPTIONS: { id: AutonomyLevel; label: string; description: string }[] = [
    { id: 'suggest-only', label: 'Suggest only', description: 'Show me options, I apply them' },
    { id: 'apply-with-approval', label: 'Apply with approval', description: 'Make changes, I review before saving' },
    { id: 'auto-apply', label: 'Auto-apply', description: 'Make and save changes automatically' },
];

export const APPROVAL_REQUIRED_OPTIONS: { id: ApprovalRequired; label: string }[] = [
    { id: 'deploy', label: 'Deployments' },
    { id: 'client-facing', label: 'Client-facing content' },
    { id: 'pricing-changes', label: 'Pricing changes' },
    { id: 'production-db', label: 'Production database' },
    { id: 'external-emails', label: 'External emails' },
    { id: 'legal-copy', label: 'Legal/compliance copy' },
];

export const MAX_STEPS_OPTIONS: { id: MaxStepsBeforePause; label: string; description: string }[] = [
    { id: 5, label: '5 steps', description: 'Very cautious' },
    { id: 10, label: '10 steps', description: 'Balanced' },
    { id: 25, label: '25 steps', description: 'Allow longer chains' },
    { id: 0, label: 'Unlimited', description: 'Let it run' },
];

export const UNACCEPTABLE_MISTAKES_OPTIONS: { id: UnacceptableMistake; label: string }[] = [
    { id: 'breaking-builds', label: 'Breaking builds' },
    { id: 'legal-copy-changes', label: 'Changing legal copy' },
    { id: 'data-loss', label: 'Data loss' },
    { id: 'security-issues', label: 'Security vulnerabilities' },
    { id: 'client-visible-errors', label: 'Client-visible errors' },
];

export const DATA_ACCESS_OPTIONS: { id: DataAccessMode; label: string; description: string }[] = [
    { id: 'ephemeral', label: 'Ephemeral', description: 'Nothing stored beyond this session' },
    { id: 'session-logs', label: 'Session logs', description: 'Keep logs for debugging' },
    { id: 'persistent', label: 'Persistent', description: 'Store data for future reference' },
];

export const CONFLICT_RESOLUTION_OPTIONS: { id: ConflictResolution; label: string; description: string }[] = [
    { id: 'ask-user', label: 'Ask me', description: 'Stop and clarify conflicts' },
    { id: 'follow-config', label: 'Follow project config', description: 'Use project settings as tiebreaker' },
    { id: 'abort', label: 'Abort', description: 'Stop immediately on conflicts' },
];
