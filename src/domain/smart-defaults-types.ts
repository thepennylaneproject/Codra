/**
 * SMART DEFAULTS TYPES
 * Type definitions for the Smart Defaults System
 * Replaces 23+ onboarding questions with sensible defaults
 */

export type QualityPriority = 'quality' | 'balanced' | 'fast' | 'cheap';
export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'regulated';
export type SpendingStrategy = 'budget' | 'smart-balance' | 'performance';
export type AutonomyLevel = 'full-auto' | 'apply-with-approval' | 'always-ask';
export type VisualDirection = 'modern-professional' | 'minimal-refined' | 'bold-confident' | 'warm-approachable';
export type ThemePreference = 'dark' | 'light' | 'system';
export type DeskId = 'write' | 'design' | 'code' | 'research';
export type ExportFormat = 'pdf' | 'png' | 'svg' | 'docx' | 'html';

/**
 * Account-level settings (global defaults)
 */
export interface AccountSettings {
    ai: {
        qualityPriority: QualityPriority;
        dataSensitivity: DataSensitivity;
        autonomyLevel: AutonomyLevel;
        maxSteps: number;
        riskTolerance: number; // 1-5 scale
    };
    budget: {
        dailyLimit: number;
        strategy: SpendingStrategy;
    };
    visual: {
        theme: ThemePreference;
        defaultDesk: DeskId;
        visualDirection: VisualDirection;
    };
    preferences: {
        showModelPerStep: boolean;
        autoSave: boolean;
    };
}

/**
 * Project-level overrides (optional)
 */
export interface ProjectSettings {
    // If undefined, use account default
    qualityPriority?: QualityPriority;
    autonomyLevel?: AutonomyLevel;
    dailyBudget?: number;
    dataSensitivity?: DataSensitivity;
    maxSteps?: number;
    riskTolerance?: number;
}

/**
 * Effective settings (account merged with project overrides)
 */
export interface EffectiveSettings extends AccountSettings {
    hasOverrides: boolean;
    overrideCount: number;
}

/**
 * Context for inference engine
 */
export interface ProjectContext {
    projectId?: string;
    projectName?: string;
    projectType?: string;
    description?: string;
    fileContents?: string[];
    taskType?: string;
    deadlineLanguage?: string;
    accountTier?: string;
    historicalSpend?: number;
    lastUsedDesk?: DeskId;
    industry?: string;
    contentType?: string;
}

/**
 * Inference Engine Interface (for future ML-based inference)
 */
export interface InferenceEngine {
    inferQualityPriority(context: ProjectContext): QualityPriority;
    inferDataSensitivity(context: ProjectContext): DataSensitivity;
    inferVisualDirection(context: ProjectContext): VisualDirection;
    inferDefaultDesk(context: ProjectContext): DeskId;
    inferDailyBudget(context: ProjectContext): number;
    inferSpendingStrategy(context: ProjectContext): SpendingStrategy;
    inferExportFormat(context: ProjectContext): ExportFormat;
}

/**
 * Smart defaults (the 80% correct defaults)
 */
export const SMART_DEFAULTS: AccountSettings = {
    ai: {
        qualityPriority: 'balanced',
        dataSensitivity: 'internal',
        autonomyLevel: 'apply-with-approval',
        maxSteps: 10,
        riskTolerance: 3,
    },
    budget: {
        dailyLimit: 50,
        strategy: 'smart-balance',
    },
    visual: {
        theme: 'system',
        defaultDesk: 'write',
        visualDirection: 'modern-professional',
    },
    preferences: {
        showModelPerStep: false,
        autoSave: true,
    },
};

/**
 * Helper: Get label for enum values
 */
export const SETTINGS_LABELS = {
    qualityPriority: {
        quality: 'Quality First',
        balanced: 'Balanced',
        fast: 'Speed First',
        cheap: 'Budget First',
    },
    dataSensitivity: {
        public: 'Public',
        internal: 'Internal',
        confidential: 'Confidential',
        regulated: 'Highly Regulated',
    },
    spendingStrategy: {
        budget: 'Budget Mode',
        'smart-balance': 'Smart Balance',
        performance: 'Performance Mode',
    },
    autonomyLevel: {
        'full-auto': 'Full Auto',
        'apply-with-approval': 'Apply with Approval',
        'always-ask': 'Always Ask',
    },
    visualDirection: {
        'modern-professional': 'Modern, Professional',
        'minimal-refined': 'Minimal, Refined',
        'bold-confident': 'Bold, Confident',
        'warm-approachable': 'Warm, Approachable',
    },
    theme: {
        dark: 'Dark',
        light: 'Light',
        system: 'System',
    },
    defaultDesk: {
        write: 'Write',
        design: 'Design',
        code: 'Code',
        research: 'Research',
    },
};

/**
 * Helper: Get description for settings
 */
export const SETTINGS_DESCRIPTIONS = {
    qualityPriority: 'Balance quality, speed, and cost for AI tasks',
    dataSensitivity: 'How sensitive is the data in your projects',
    autonomyLevel: 'How much can AI do without approval',
    maxSteps: 'Maximum steps before pausing for approval',
    riskTolerance: 'How much risk you\'re comfortable with',
    dailyLimit: 'Maximum daily spending on AI tasks',
    strategy: 'Budget strategy for AI spending',
    theme: 'Interface color scheme',
    defaultDesk: 'Default workspace to open',
    visualDirection: 'Visual style preference',
    showModelPerStep: 'Show which AI model is being used',
    autoSave: 'Automatically save changes',
};
