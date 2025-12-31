export interface Project {
    id: string;
    name: string;
    description?: string;
    summary?: string; // 140 chars elevator pitch
    type?: 'website' | 'app' | 'campaign' | 'content' | 'product' | 'brand-identity';

    audience?: string;
    audienceContext?: {
        segment?: 'B2C' | 'B2B' | 'D2C';
        sophistication?: 'novice' | 'intermediate' | 'expert';
    };

    deliverables?: Deliverable[];
    brandConstraints?: BrandConstraints;
    successCriteria?: SuccessCriteria;
    guardrails?: Guardrails;

    goals?: string[]; // Legacy - still used for backwards compatibility
    boundaries?: string[]; // Legacy - still used for backwards compatibility
    activeDesks?: string[];
    budgetPolicy?: BudgetPolicy;
    assets?: Asset[];
    moodboard?: MoodboardImage[];
    updatedAt: string;
    aiPreferences?: AIPreferencesData;
}

export interface Deliverable {
    id: string;
    name: string;
    type: 'website' | 'app' | 'copy' | 'design' | 'video' | 'campaign';
    status: 'planned' | 'in-progress' | 'review' | 'done';
    deadline?: string;
}

export interface BrandConstraints {
    brandName?: string;
    voiceGuidelines?: string;
    brandValues?: string[];
    colors?: {
        primary: string;
        secondary: string;
        accent: string;
    };
    typography?: {
        style?: string;
        primaryFont?: string;
    };
    logoUrl?: string;
    existingAssets?: string[]; // URLs or IDs
}

export interface SuccessCriteria {
    definitionOfDone?: string[];
    stakeholders?: { name: string; role: string }[];
    kpis?: string[];
}

export interface Guardrails {
    mustInclude?: string[];
    mustAvoid?: string[];
    competitors?: string[]; // URLs or names
}

export interface Asset {
    id: string;
    name: string;
    url: string;
    projectId: string;
}


export interface SpreadLayout {
    docks: {
        left: { width: number; visible: boolean };
        right: { width: number; visible: boolean };
    };
}


export interface ImpactSummary {
    affectedSections: string[];
    costEstimation: string;
    workflowChanges: string[];
}

export interface TearSheetRevision {
    id: string;
    version: number;
    createdAt: string;
    summary: string;
    status: 'draft' | 'approved';
    createdFrom: 'onboarding' | 'manual';
    scopeImpact: 'Low' | 'Medium' | 'High';
    impact?: ImpactSummary;
    // Snapshot of project state for the revision
    data?: Partial<ProjectContext>;
}

export interface BudgetPolicy {
    maxCostPerRun: number;
    dailyLimit: number;
    approvalRequired: boolean;
}

// Rebranded from TearSheet to ProjectContext
export interface ProjectContext {
    id: string;
    projectId: string;
    title: string;
    identity: {
        name: string;
        summary: string;
        type: Project['type'];
    };
    deliverables: Deliverable[];
    audience: {
        primary: string;
        context: Project['audienceContext'];
    };
    brand: BrandConstraints;
    success: SuccessCriteria;
    guardrails: Guardrails;
    moodboard?: MoodboardImage[];
}

export interface EditorialPreferences {
    tone: 'authoritative' | 'conversational' | 'provocative' | 'neutral';
    pacing: 'rapid' | 'steady' | 'deliberate';
    visualPosture?: 'minimal' | 'dense' | 'bold' | 'soft' | 'architectural';
    intendedOutput?: 'brief' | 'article' | 'report' | 'deck' | 'visual-essay';
    audienceRelationship?: 'peer' | 'expert-to-novice' | 'seller-to-buyer' | 'collaborator';
}

export interface MoodboardImage {
    id: string;
    role: 'tone' | 'structure' | 'reference' | 'tension';
    imageUrl: string;
    source: string;
    url?: string; // Legacy support or alias
    locked: boolean;
    caption?: string;
}

export interface TableOfContentsSection {
    id: string;
    title: string;
    status: 'planned' | 'in-progress' | 'review' | 'done';
}


export interface OnboardingProfile {
    projectName: string;
    description: string;
    audience: string;
    goals: string[];
    boundaries: string[];
    budgetPolicy: BudgetPolicy;
    editorialPreferences?: EditorialPreferences;
    selectedDesks?: string[]; // e.g., 'copy', 'art', 'fact-check'
    moodboard?: MoodboardImage[];

    // New structured context fields
    summary?: string;
    projectType?: Project['type'];
    deliverables?: Deliverable[];
    brand?: BrandConstraints;
    success?: SuccessCriteria;
    guardrails?: Guardrails;
}

// ============================================
// Spread Types
// ============================================

export type SpreadSectionType =
    | 'overview'
    | 'audience'
    | 'goals'
    | 'constraints'
    | 'visual_direction'
    | 'layout_direction'
    | 'content_outline'
    | 'components_or_assets'
    | 'notes';

export type SpreadSectionStatus = 'draft' | 'ready' | 'locked';

export type SpreadSectionSource = 'onboarding' | 'tear_sheet' | 'moodboard' | 'inferred' | 'manual';

export interface SpreadSection {
    id: string;
    type: SpreadSectionType;
    title: string;
    description: string;
    status: SpreadSectionStatus;
    source: SpreadSectionSource;
    editable: boolean;
    collapsed?: boolean;
    content: Record<string, unknown>;
    suggestedAction?: {
        label: string;
        actionId: string;
    };
}

export interface TOCEntry {
    id: string;
    sectionId: string;
    title: string;
    order: number;
}

export interface Spread {
    id: string;
    projectId: string;
    sections: SpreadSection[];
    toc: TOCEntry[];
    taskQueue?: import('./task-queue').TaskQueue;
    lyraState?: LyraState;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Lyra Types
// ============================================

export type LyraBodyShape = 'athletic' | 'curvy' | 'slender' | 'broad' | 'soft';
export type LyraSkinTone = 'fair' | 'tan' | 'warm' | 'deep' | 'ebony';
export type LyraExpression = 'neutral' | 'focused' | 'inspired' | 'thoughtful' | 'playful';

export interface LyraBase {
    id: string;
    label: string;
    bodyShape: LyraBodyShape;
    skinTone: LyraSkinTone;
    assetUrl: string;
}

export interface LyraVisualLayer {
    id: string;
    category: 'hair' | 'clothing' | 'accessory';
    label: string;
    assetUrl: string;
    incompatibleWith?: string[]; // IDs of other layers this can't work with
}

export interface LyraAppearance {
    baseId: string;
    expression: LyraExpression;
    layers: Record<'hair' | 'clothing' | 'accessory', string | null>;
}

export interface LyraState {
    visible: boolean;
    appearance: LyraAppearance;
    currentPrompt?: string;
    suggestedArtifacts: string[];
    confidence: number;
    pendingQuestions: string[];
}

// ============================================
// Codra Escalation Types
// ============================================

export type EscalationType = 'budget_exceeded' | 'risk_exceeded' | 'destructive_action';

export interface CodraEscalation {
    id: string;
    type: EscalationType;
    message: string;
    severity: 'warning' | 'blocking';
    triggeredAt: string;
    resolved: boolean;
}

// ============================================
// Codra Guardrail Types
// ============================================

export type GuardrailType = 'budget' | 'scope' | 'quality' | 'time';

export interface CodraGuardrail {
    id: string;
    type: GuardrailType;
    label: string;
    threshold: number;
    currentValue: number;
    status: 'ok' | 'warning' | 'exceeded';
}

// ============================================
// Production Desk Types
// ============================================

export type ProductionDeskId =
    | 'art-design'
    | 'engineering'
    | 'writing'
    | 'workflow'
    | 'marketing'
    | 'career-assets'
    | 'data-analysis';

export interface ProductionDesk {
    id: ProductionDeskId;
    label: string;
    description: string;
}

export const PRODUCTION_DESKS: ProductionDesk[] = [
    { id: 'art-design', label: 'Art Studio', description: 'Visual assets, illustrations, and design systems' },
    { id: 'engineering', label: 'Engineering Studio', description: 'Code, architecture, and technical implementation' },
    { id: 'writing', label: 'Writing Studio', description: 'Copy, content, and editorial work' },
    { id: 'workflow', label: 'Workflow Studio', description: 'Project management, issues, and assignments' },
    { id: 'marketing', label: 'Marketing Studio', description: 'Campaigns, messaging, and market positioning' },
    { id: 'career-assets', label: 'Career Studio', description: 'Resumes, portfolios, and professional materials' },
    { id: 'data-analysis', label: 'Data Studio', description: 'Research, metrics, and insights' },
];

// ============================================
// Enhanced TOC Types
// ============================================

export type TOCSectionCategory =
    | 'assignment'
    | 'editorial_direction'
    | 'visual_direction'
    | 'production_desk'
    | 'open_questions';

export interface EnhancedTOCEntry extends TOCEntry {
    category: TOCSectionCategory;
    status: 'pending' | 'in-progress' | 'complete';
    keyboardShortcut?: string;
}

// ============================================
// AI Preferences Types
// ============================================

export type QualityCostLatencyPriority = 'quality' | 'balanced' | 'fast' | 'cheap';

export type DataSensitivity =
    | 'public-demo'
    | 'internal-not-sensitive'
    | 'confidential'
    | 'highly-regulated';

export type MultiModelStrategy =
    | 'cheap-explore-quality-final'
    | 'always-best'
    | 'always-cheapest'
    | 'system-decides';

export type LowConfidenceBehavior =
    | 'ask-clarifying'
    | 'try-stronger-model'
    | 'flag-low-confidence'
    | 'decline-conservative';

export interface AIPreferencesData {
    qualityPriority: QualityCostLatencyPriority | null;
    latencyTolerance: number; // 1-5 scale
    costSensitivity: number; // 1-5 scale
    dataSensitivity: DataSensitivity | null;
    instructionStrictness: number; // 1-5 scale
    multiModelStrategy: MultiModelStrategy | null;
    lowConfidenceBehavior: LowConfidenceBehavior | null;
    showModelPerStep: boolean;
    smartMode: boolean;
}
