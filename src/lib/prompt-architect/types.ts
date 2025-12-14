/**
 * PROMPT ARCHITECT - Type Definitions
 * src/lib/prompt-architect/types.ts
 * 
 * Core types for the Prompt Architect dockable panel system
 */

// ============================================================
// Panel State Types
// ============================================================

/** Panel visibility states */
export type PanelState = 'hidden' | 'docked' | 'floating';

/** Available dock positions */
export type DockPosition = 'right' | 'left' | 'bottom';

/** Prompt optimization modes */
export type ArchitectMode = 'fast' | 'precise' | 'production';

/** Output tab types */
export type OutputTab = 'prompt' | 'system' | 'negative' | 'assumptions' | 'sources';

/** Retrieval provider options for grounding */
export type GroundingProvider = 'auto' | 'brave' | 'tavily';

/** Grounding configuration */
export interface GroundingConfig {
    /** Whether source grounding is enabled */
    enabled: boolean;
    /** Preferred retrieval provider */
    provider: GroundingProvider;
    /** Maximum number of sources to retrieve (3-8) */
    maxResults: number;
}

/** Default grounding configuration */
export const DEFAULT_GROUNDING_CONFIG: GroundingConfig = {
    enabled: false,
    provider: 'auto',
    maxResults: 5,
};

/** Panel status indicator */
export type ArchitectStatus = 'idle' | 'analyzing' | 'needs-clarification' | 'generating' | 'ready' | 'error';

// ============================================================
// Panel Configuration
// ============================================================

/** Panel layout and position configuration */
export interface PanelConfig {
    /** Current panel state (hidden, docked, or floating) */
    state: PanelState;

    /** Dock position when docked */
    dockPosition: DockPosition;

    /** Width in pixels for left/right docked mode */
    width: number;

    /** Height in pixels for bottom docked mode */
    height: number;

    /** Position for floating mode */
    floatingPosition: { x: number; y: number };

    /** Size for floating mode */
    floatingSize: { width: number; height: number };
}

// ============================================================
// Context Types
// ============================================================

/** Output type hints for prompt generation */
export type OutputType = 'code' | 'icon' | 'image' | 'copy' | 'video' | 'component' | 'api' | 'documentation' | 'other';

/** Context passed into Prompt Architect from triggers */
import type { AssetRef } from '../../types/shared';

// ... existing imports ...

/** Context passed into Prompt Architect from triggers */
export interface ArchitectContext {
    /** Project ID if opened from project context */
    projectId?: string;

    /** Project title for display */
    projectTitle?: string;

    /** Task ID if opened from task context */
    taskId?: string;

    /** Task description for context */
    taskDescription?: string;

    /** Asset type if generating for specific asset */
    assetType?: string;

    /** Expected output type */
    outputType?: OutputType;

    /** Attached assets for reference */
    assets?: AssetRef[];

    /** Design tokens for brand consistency */
    designTokens?: Record<string, string>;

    /** Brand guidance text */
    brandGuidance?: string;

    /** Additional context metadata */
    metadata?: Record<string, unknown>;
}

// ============================================================
// Prompt Generation Types
// ============================================================

/** Structure of a generated prompt */
export interface GeneratedPrompt {
    /** Primary user prompt */
    primary: string;

    /** Optional system prompt */
    system?: string;

    /** Optional negative prompt (things to avoid) */
    negative?: string;

    /** Assumptions made during generation */
    assumptions: string[];

    /** Retrieved sources for grounded prompts */
    sources?: RetrievedSource[];

    /** Formatted SOURCES block (injected into prompt) */
    sourcesBlock?: string;

    /** Estimated input tokens */
    estimatedTokens: number;

    /** Estimated cost in USD */
    estimatedCost: number;

    /** Recommended model for this prompt */
    recommendedModel: string;

    /** Generation timestamp */
    generatedAt: Date;
}

/** Retrieved source item for grounding */
export interface RetrievedSource {
    /** Source title */
    title: string;
    /** Source URL */
    url: string;
    /** Content snippet */
    snippet?: string;
    /** Provider that returned this source */
    source: 'brave' | 'tavily';
}

/** Clarification question for ambiguous intent */
export interface ClarificationQuestion {
    /** Unique question ID */
    id: string;

    /** The question text */
    question: string;

    /** Optional quick-select options */
    options?: string[];

    /** Whether answer is required before continuing */
    required: boolean;

    /** Category of clarification */
    category: 'output-type' | 'scope' | 'constraints' | 'format' | 'other';
}

/** Result of clarity analysis */
export interface ClarityAnalysisResult {
    /** Whether intent is sufficiently clear */
    isClear: boolean;

    /** Clarity score from 0-1 */
    clarityScore: number;

    /** Questions to ask if not clear */
    questions: ClarificationQuestion[];

    /** Detected output type, if any */
    detectedOutputType?: OutputType;

    /** Detected scope/constraints */
    detectedConstraints?: string[];
}

// ============================================================
// Store State Types
// ============================================================

/** Complete Prompt Architect state */
export interface PromptArchitectState {
    // ========================
    // Panel State
    // ========================

    /** Panel layout configuration */
    panelConfig: PanelConfig;

    /** Whether panel is currently visible */
    isVisible: boolean;

    // ========================
    // Content State
    // ========================

    /** Current optimization mode */
    mode: ArchitectMode;

    /** User's plain-language intent */
    intent: string;

    /** Context from trigger source */
    context: ArchitectContext;

    /** Generated prompt output */
    generatedPrompt: GeneratedPrompt | null;

    /** Pending clarification questions */
    clarificationQuestions: ClarificationQuestion[];

    /** User's answers to clarification questions */
    clarificationAnswers: Record<string, string>;

    // ========================
    // UI State
    // ========================

    /** Active output tab */
    activeTab: OutputTab;

    /** Selected AI model */
    selectedModel: string;

    /** Whether generation is in progress */
    isGenerating: boolean;

    /** Current status */
    status: ArchitectStatus;

    /** Error message if any */
    errorMessage?: string;

    // ========================
    // Grounding State
    // ========================

    /** Grounding configuration */
    groundingConfig: GroundingConfig;

    /** Whether sources are being fetched */
    isFetchingSources: boolean;

    // ========================
    // Actions
    // ========================

    /** Show the panel, optionally with context */
    show: (context?: ArchitectContext) => void;

    /** Hide the panel */
    hide: () => void;

    /** Toggle panel visibility */
    toggle: () => void;

    /** Set optimization mode */
    setMode: (mode: ArchitectMode) => void;

    /** Update user intent */
    setIntent: (intent: string) => void;

    /** Update context */
    setContext: (context: ArchitectContext) => void;

    /** Merge context (for partial updates) */
    mergeContext: (context: Partial<ArchitectContext>) => void;

    /** Update panel configuration */
    updatePanelConfig: (config: Partial<PanelConfig>) => void;

    /** Set active output tab */
    setActiveTab: (tab: OutputTab) => void;

    /** Set selected model */
    setSelectedModel: (model: string) => void;

    /** Answer a clarification question */
    answerClarification: (id: string, answer: string) => void;

    /** Generate prompt from intent */
    generatePrompt: () => Promise<void>;

    /** Update generated prompt content (for editing) */
    updatePromptContent: (field: 'primary' | 'system' | 'negative', content: string) => void;

    /** Reset to initial state */
    reset: () => void;

    /** Clear only the prompt/intent (keep panel config) */
    clearContent: () => void;

    // ========================
    // Grounding Actions
    // ========================

    /** Toggle grounding on/off */
    setGroundingEnabled: (enabled: boolean) => void;

    /** Set grounding provider */
    setGroundingProvider: (provider: GroundingProvider) => void;

    /** Set max results for grounding */
    setGroundingMaxResults: (maxResults: number) => void;

    /** Update entire grounding config */
    updateGroundingConfig: (config: Partial<GroundingConfig>) => void;
}

// ============================================================
// Mode Configuration
// ============================================================

/** Configuration for each optimization mode */
export interface ModeConfig {
    /** Mode identifier */
    mode: ArchitectMode;

    /** Display label */
    label: string;

    /** Short description */
    description: string;

    /** Verbosity level */
    verbosity: 'minimal' | 'balanced' | 'detailed';

    /** Constraint strictness */
    constraints: 'few' | 'moderate' | 'strict';

    /** Typical token multiplier */
    tokenMultiplier: number;
}

/** Mode configurations */
export const MODE_CONFIGS: Record<ArchitectMode, ModeConfig> = {
    fast: {
        mode: 'fast',
        label: 'Fast',
        description: 'Quick exploration with minimal constraints',
        verbosity: 'minimal',
        constraints: 'few',
        tokenMultiplier: 0.7,
    },
    precise: {
        mode: 'precise',
        label: 'Precise',
        description: 'Balanced output for iteration',
        verbosity: 'balanced',
        constraints: 'moderate',
        tokenMultiplier: 1.0,
    },
    production: {
        mode: 'production',
        label: 'Production',
        description: 'Strict structure for consistency',
        verbosity: 'detailed',
        constraints: 'strict',
        tokenMultiplier: 1.4,
    },
};

// ============================================================
// Default Values
// ============================================================

/** Default panel configuration */
export const DEFAULT_PANEL_CONFIG: PanelConfig = {
    state: 'hidden',
    dockPosition: 'right',
    width: 420,
    height: 350,
    floatingPosition: { x: 100, y: 100 },
    floatingSize: { width: 480, height: 600 },
};

/** Default empty context */
export const DEFAULT_CONTEXT: ArchitectContext = {};

/** Default model selection */
export const DEFAULT_MODEL = 'gpt-4o-mini';
