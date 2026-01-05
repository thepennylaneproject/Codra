/**
 * Model Categorizer
 * Intelligently categorizes AIMLAPI models by task type and metadata
 */

import { ModelInfo } from './types';
import {
    EnhancedModelInfo,
    TaskCategory,
    CostTier,
    LatencyTier
} from './types-agent-selector';

/**
 * Categorize a model with task metadata
 * Uses pattern matching on model ID and provider to infer categories
 */
export function categorizeModel(model: ModelInfo): EnhancedModelInfo {
    let taskCategories: TaskCategory[] = [TaskCategory.GENERAL_PURPOSE];
    let bestForTasks: string[] = [];
    let strengths: string[] = [];
    let limitations: string[] = [];
    let tags: string[] = [];

    const modelId = model.id.toLowerCase();

    // CODE ASSISTANCE models
    if (
        modelId.includes('deepseek') ||
        modelId.includes('coder') ||
        modelId.includes('codex') ||
        modelId.includes('code')
    ) {
        taskCategories = [TaskCategory.CODE_ASSISTANCE, TaskCategory.GENERAL_PURPOSE];
        bestForTasks = ['Code generation', 'Debugging', 'Code completion', 'Refactoring'];
        strengths = ['Optimized for code', 'Fast inference', 'Understanding programming languages'];
        tags = ['coding', 'fast'];
    }
    // GPT-4 series - versatile, great for complex workflows
    else if (modelId.includes('gpt-4') || modelId.includes('o1')) {
        taskCategories = [
            TaskCategory.CODE_ASSISTANCE,
            TaskCategory.AUTONOMOUS_WORKFLOWS,
            TaskCategory.RESEARCH,
            TaskCategory.CONTENT_GENERATION
        ];
        bestForTasks = ['Complex reasoning', 'Multi-step planning', 'Code & analysis', 'Research'];
        strengths = ['Advanced reasoning', 'Large context window', 'High accuracy', 'Versatile'];
        limitations = ['Higher cost', 'Slower than smaller models'];
        tags = ['reasoning', 'versatile', 'premium'];
    }
    // Claude series - great for  analysis and long context
    else if (modelId.includes('claude')) {
        taskCategories = [
            TaskCategory.CONTENT_GENERATION,
            TaskCategory.CODE_ASSISTANCE,
            TaskCategory.DATA_ANALYSIS,
            TaskCategory.RESEARCH
        ];
        bestForTasks = ['Long document analysis', 'Content writing', 'Code review', 'Research'];
        strengths = ['200K context window', 'Detailed analysis', 'Safe & helpful', 'Nuanced writing'];
        limitations = ['Can be verbose'];
        tags = ['long-context', 'analysis', 'safe'];
    }
    // Gemini series - multimodal and research
    else if (modelId.includes('gemini')) {
        taskCategories = [
            TaskCategory.RESEARCH,
            TaskCategory.DATA_ANALYSIS,
            TaskCategory.CONTENT_GENERATION,
            TaskCategory.GENERAL_PURPOSE
        ];
        bestForTasks = ['Research', 'Data processing', 'Multimodal tasks', 'General chat'];
        strengths = ['Fast', 'Multimodal', 'Google Search integration', 'Large context'];
        tags = ['multimodal', 'fast', 'google'];
    }
    // Llama series - open-source, cost-effective
    else if (modelId.includes('llama') || modelId.includes('meta')) {
        taskCategories = [TaskCategory.GENERAL_PURPOSE, TaskCategory.CONTENT_GENERATION];
        bestForTasks = ['General chat', 'Content generation', 'Cost-effective tasks'];
        strengths = ['Open-source', 'Cost-effective', 'Good performance'];
        tags = ['open-source', 'cost-effective'];
    }
    // Mistral series - efficient and fast
    else if (modelId.includes('mistral')) {
        taskCategories = [TaskCategory.GENERAL_PURPOSE, TaskCategory.CODE_ASSISTANCE];
        bestForTasks = ['Fast responses', 'General tasks', 'Code assistance'];
        strengths = ['Very fast', 'Cost-effective', 'Good quality'];
        tags = ['fast', 'efficient'];
    }
    // GPT-3.5 - fast and cost-effective
    else if (modelId.includes('gpt-3')) {
        taskCategories = [TaskCategory.GENERAL_PURPOSE, TaskCategory.CONTENT_GENERATION];
        bestForTasks = ['Quick responses', 'Simple tasks', 'Chat', 'Summaries'];
        strengths = ['Very fast', 'Very cost-effective', 'Good for simple tasks'];
        limitations = ['Less capable than GPT-4', 'Shorter context'];
        tags = ['fast', 'cheap', 'legacy'];
    }
    // Default for unknown models
    else {
        bestForTasks = ['General purpose tasks'];
        strengths = ['Flexible'];
    }

    // Calculate cost tier
    const costTier = calculateCostTier(model);

    // Calculate latency tier (estimation based on model size)
    const latencyTier = estimateLatencyTier(model);

    return {
        ...model,
        taskCategories,
        costTier,
        latencyTier,
        bestForTasks,
        strengths,
        limitations,
        tags
    };
}

/**
 * Calculate cost tier based on pricing
 */
function calculateCostTier(model: ModelInfo): CostTier {
    const avgCost = (model.costPer1kPrompt + model.costPer1kCompletion) / 2;

    if (avgCost === 0) return CostTier.FREE;
    if (avgCost < 0.001) return CostTier.LOW;
    if (avgCost < 0.01) return CostTier.MEDIUM;
    if (avgCost < 0.05) return CostTier.HIGH;
    return CostTier.PREMIUM;
}

/**
 * Estimate latency tier based on model characteristics
 * This is a heuristic - real latency depends on many factors
 */
function estimateLatencyTier(model: ModelInfo): LatencyTier {
    const modelId = model.id.toLowerCase();

    // Fast models
    if (
        modelId.includes('3.5') ||
        modelId.includes('mistral') ||
        modelId.includes('deepseek') ||
        modelId.includes('gemini-flash')
    ) {
        return LatencyTier.FAST;
    }

    // Slow models
    if (
        modelId.includes('o1') ||
        modelId.includes('opus') ||
        modelId.includes('claude-3')
    ) {
        return LatencyTier.SLOW;
    }

    // Default to medium
    return LatencyTier.MEDIUM;
}

/**
 * Filter models by task category
 */
export function filterModelsByTask(
    models: EnhancedModelInfo[],
    taskCategory: TaskCategory
): EnhancedModelInfo[] {
    return models
        .filter(model => model.taskCategories.includes(taskCategory))
        .sort((a, b) => {
            // Sort by: recommended first, then by cost tier, then by name
            if (a.isPowered !== b.isPowered) return a.isPowered ? -1 : 1;
            if (a.costTier !== b.costTier) {
                const tierOrder = { free: 0, low: 1, medium: 2, high: 3, premium: 4 };
                return tierOrder[a.costTier] - tierOrder[b.costTier];
            }
            return a.name.localeCompare(b.name);
        });
}

/**
 * Filter models by agent framework recommendations
 */
export function filterModelsByAgent(
    models: EnhancedModelInfo[],
    recommendedModelIds: string[]
): EnhancedModelInfo[] {
    const recommended = models.filter(m => recommendedModelIds.includes(m.id));
    const others = models.filter(m => !recommendedModelIds.includes(m.id));
    return [...recommended, ...others];
}

/**
 * Get best model for a task category (preset logic)
 */
export function getBestModelForTask(
    models: EnhancedModelInfo[],
    taskCategory: TaskCategory,
    preferCostEffective: boolean = false
): EnhancedModelInfo | undefined {
    const filtered = filterModelsByTask(models, taskCategory);

    if (filtered.length === 0) return undefined;

    // If prefer cost-effective, find best low/medium cost model
    if (preferCostEffective) {
        const affordable = filtered.filter(
            m => m.costTier === CostTier.LOW || m.costTier === CostTier.MEDIUM
        );
        return affordable[0] || filtered[0];
    }

    // Otherwise return best quality (likely first after sort)
    return filtered[0];
}
