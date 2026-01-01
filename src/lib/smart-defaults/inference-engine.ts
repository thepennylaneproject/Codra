/**
 * INFERENCE ENGINE
 * Static implementation that returns sensible defaults
 * Future: Replace with ML-based inference from user behavior
 */

import type {
    InferenceEngine,
    ProjectContext,
    QualityPriority,
    DataSensitivity,
    VisualDirection,
    DeskId,
    SpendingStrategy,
    ExportFormat,
} from '../../domain/smart-defaults-types';

/**
 * Static Inference Engine
 * Returns smart defaults without ML (for now)
 * Future enhancement: Learn from user behavior over time
 */
export class StaticInferenceEngine implements InferenceEngine {
    inferQualityPriority(context: ProjectContext): QualityPriority {
        // Future: Analyze task type and deadline language
        // For now: Return balanced as the 80% correct default
        if (context.taskType?.includes('urgent') || context.deadlineLanguage?.includes('asap')) {
            return 'fast';
        }
        if (context.taskType?.includes('production') || context.taskType?.includes('client')) {
            return 'quality';
        }
        return 'balanced';
    }

    inferDataSensitivity(context: ProjectContext): DataSensitivity {
        // Future: Analyze project name and file contents
        // For now: Return internal as safe default
        const projectName = context.projectName?.toLowerCase() || '';
        const description = context.description?.toLowerCase() || '';

        if (projectName.includes('demo') || description.includes('public')) {
            return 'public';
        }
        if (projectName.includes('confidential') || description.includes('sensitive')) {
            return 'confidential';
        }
        if (projectName.includes('hipaa') || projectName.includes('gdpr')) {
            return 'regulated';
        }

        return 'internal';
    }

    inferVisualDirection(context: ProjectContext): VisualDirection {
        // Future: Analyze project type and industry
        // For now: Return modern-professional as default
        const projectType = context.projectType?.toLowerCase() || '';
        const industry = context.industry?.toLowerCase() || '';

        if (industry.includes('luxury') || industry.includes('premium')) {
            return 'minimal-refined';
        }
        if (industry.includes('startup') || industry.includes('tech')) {
            return 'bold-confident';
        }
        if (industry.includes('health') || industry.includes('education')) {
            return 'warm-approachable';
        }

        return 'modern-professional';
    }

    inferDefaultDesk(context: ProjectContext): DeskId {
        // Future: Use last used desk from history
        // For now: Infer from project type
        const projectType = context.projectType?.toLowerCase() || '';

        if (projectType.includes('code') || projectType.includes('api')) {
            return 'code';
        }
        if (projectType.includes('design') || projectType.includes('brand')) {
            return 'design';
        }
        if (projectType.includes('research') || projectType.includes('analysis')) {
            return 'research';
        }

        return context.lastUsedDesk || 'write';
    }

    inferDailyBudget(context: ProjectContext): number {
        // Future: Use account tier and historical spend
        // For now: Return $50 as safe default
        const tier = context.accountTier?.toLowerCase() || '';

        if (tier.includes('pro')) {
            return 100;
        }
        if (tier.includes('enterprise')) {
            return 500;
        }

        return 50;
    }

    inferSpendingStrategy(context: ProjectContext): SpendingStrategy {
        // Future: Analyze user preferences over time
        // For now: Always default to smart-balance
        return 'smart-balance';
    }

    inferExportFormat(context: ProjectContext): ExportFormat {
        // Future: Analyze content type
        // For now: Use content type hints
        const contentType = context.contentType?.toLowerCase() || '';

        if (contentType.includes('image') || contentType.includes('design')) {
            return 'png';
        }
        if (contentType.includes('vector')) {
            return 'svg';
        }
        if (contentType.includes('web') || contentType.includes('html')) {
            return 'html';
        }
        if (contentType.includes('doc') || contentType.includes('report')) {
            return 'docx';
        }

        return 'pdf';
    }
}

/**
 * Singleton instance
 */
export const inferenceEngine = new StaticInferenceEngine();
