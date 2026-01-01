/**
 * RULE-BASED INFERENCE ENGINE
 * Uses keyword detection, project type mapping, and user history
 * Replacement for the static inference engine
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
 * Rule-Based Inference Engine
 * Infers settings from context using rules instead of static defaults
 */
export class RuleBasedInferenceEngine implements InferenceEngine {
    
    inferQualityPriority(context: ProjectContext): QualityPriority {
        // Rule 1: Detect urgency words → prioritize speed
        const urgencyWords = ['urgent', 'asap', 'rush', 'deadline', 'today', 'quick', 'fast'];
        const description = context.description?.toLowerCase() || '';
        const taskType = context.taskType?.toLowerCase() || '';
        
        if (urgencyWords.some(word => description.includes(word) || taskType.includes(word))) {
            return 'fast';
        }
        
        // Rule 2: Product/client projects → prioritize quality
        const projectType = context.projectType?.toLowerCase() || '';
        if (projectType.includes('product') || projectType.includes('client') || projectType.includes('production')) {
            return 'quality';
        }
        
        // Rule 3: User historical preference (from behavior tracking)
        if (context.userHistory?.qualityPreference === 'high') {
            return 'quality';
        }
        if (context.userHistory?.qualityPreference === 'low') {
            return 'fast';
        }
        
        // Default: balanced
        return 'balanced';
    }
    
    inferDataSensitivity(context: ProjectContext): DataSensitivity {
        const projectName = context.projectName?.toLowerCase() || '';
        const description = context.description?.toLowerCase() || '';
        
        // Rule 1: Detect sensitive keywords → confidential
        const sensitiveKeywords = ['confidential', 'internal', 'private', 'hr', 'legal', 'finance', 'sensitive'];
        if (sensitiveKeywords.some(word => projectName.includes(word) || description.includes(word))) {
            return 'confidential';
        }
        
        // Rule 2: Detect regulated industry keywords → regulated
        const regulatedKeywords = ['hipaa', 'gdpr', 'sox', 'pci', 'healthcare', 'medical', 'financial'];
        if (regulatedKeywords.some(word => projectName.includes(word) || description.includes(word))) {
            return 'regulated';
        }
        
        // Rule 3: Detect public keywords → public
        const publicKeywords = ['demo', 'public', 'sample', 'example', 'marketing'];
        if (publicKeywords.some(word => projectName.includes(word) || description.includes(word))) {
            return 'public';
        }
        
        // Default: internal (safer)
        return 'internal';
    }
    
    inferVisualDirection(context: ProjectContext): VisualDirection {
        const projectType = context.projectType?.toLowerCase() || '';
        
        // Rule 1: Map project type to visual defaults
        const typeToVisual: Record<string, VisualDirection> = {
            'campaign': 'bold-confident',
            'product': 'modern-professional',
            'content': 'warm-approachable',
            'brand': 'minimal-refined',
            'marketing': 'bold-confident',
            'startup': 'bold-confident',
            'corporate': 'modern-professional',
            'luxury': 'minimal-refined',
            'education': 'warm-approachable',
            'health': 'warm-approachable',
        };
        
        // Check project type
        for (const [key, direction] of Object.entries(typeToVisual)) {
            if (projectType.includes(key)) {
                return direction;
            }
        }
        
        // Check industry
        const industry = context.industry?.toLowerCase() || '';
        for (const [key, direction] of Object.entries(typeToVisual)) {
            if (industry.includes(key)) {
                return direction;
            }
        }
        
        // Default: modern-professional
        return 'modern-professional';
    }
    
    inferDefaultDesk(context: ProjectContext): DeskId {
        // Rule 1: User history override (most reliable)
        if (context.userHistory?.lastUsedDesk) {
            return context.userHistory.lastUsedDesk;
        }
        
        // Rule 2: Last used desk from context
        if (context.lastUsedDesk) {
            return context.lastUsedDesk;
        }
        
        const projectType = context.projectType?.toLowerCase() || '';
        
        // Rule 3: Map project type to starting desk
        const typeToDesk: Record<string, DeskId> = {
            'campaign': 'write',    // Campaigns start with copy
            'product': 'design',    // Products start with visuals
            'content': 'write',     // Content starts with writing
            'code': 'code',         // Code projects start with code
            'api': 'code',          // APIs start with code
            'design': 'design',     // Design projects start with design
            'brand': 'design',      // Branding starts with design
            'research': 'analyze', // Research starts with analyze
            'analysis': 'analyze', // Analysis starts with analyze
        };
        
        for (const [key, desk] of Object.entries(typeToDesk)) {
            if (projectType.includes(key)) {
                return desk;
            }
        }
        
        // Default: write
        return 'write';
    }
    
    inferDailyBudget(context: ProjectContext): number {
        const tier = context.accountTier?.toLowerCase() || '';
        
        // Rule 1: Base on account tier
        let baseBudget = 50; // Default
        if (tier.includes('free')) baseBudget = 5;
        else if (tier.includes('pro')) baseBudget = 50;
        else if (tier.includes('team')) baseBudget = 200;
        else if (tier.includes('enterprise')) baseBudget = 1000;
        
        // Rule 2: Adjust based on historical spend
        if (context.historicalSpend !== undefined) {
            // If historical spend is higher, suggest increase
            if (context.historicalSpend > baseBudget * 1.5) {
                return Math.ceil(context.historicalSpend * 1.2);
            }
        }
        
        return baseBudget;
    }
    
    inferSpendingStrategy(context: ProjectContext): SpendingStrategy {
        const tier = context.accountTier?.toLowerCase() || '';
        
        // Rule 1: Free tier → budget mode
        if (tier.includes('free')) {
            return 'budget';
        }
        
        // Rule 2: Enterprise tier → performance mode
        if (tier.includes('enterprise')) {
            return 'performance';
        }
        
        // Rule 3: High historical spend → performance mode
        if (context.historicalSpend !== undefined && context.historicalSpend > 100) {
            return 'performance';
        }
        
        // Default: smart-balance
        return 'smart-balance';
    }
    
    inferExportFormat(context: ProjectContext): ExportFormat {
        // Rule 1: User preference override
        if (context.userHistory?.preferredExportFormat) {
            return context.userHistory.preferredExportFormat;
        }
        
        const contentType = context.contentType?.toLowerCase() || '';
        const projectType = context.projectType?.toLowerCase() || '';
        
        // Rule 2: Infer from content type
        if (contentType.includes('image') || projectType.includes('design')) {
            return 'png';
        }
        if (contentType.includes('vector') || contentType.includes('logo')) {
            return 'svg';
        }
        if (contentType.includes('web') || contentType.includes('html')) {
            return 'html';
        }
        if (contentType.includes('doc') || contentType.includes('report')) {
            return 'docx';
        }
        
        // Default: PDF (universal)
        return 'pdf';
    }
}

/**
 * Singleton instance
 */
export const ruleBasedInferenceEngine = new RuleBasedInferenceEngine();
