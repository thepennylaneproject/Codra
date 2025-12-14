
import { costEngine, ModelRequirements } from './cost';
import { TaskType } from './model-router'; // Reuse existing TaskType if possible, or redefine

export interface SmartRouteResult {
    model: string;
    reasoning: string;
    estimatedCost: number;
}

export class SmartRouter {

    /**
     * analyzeTaskType
     * Simple heuristic - in a real app this might use a small local model or classifier.
     */
    analyzeTaskType(prompt: string): TaskType {
        const lower = prompt.toLowerCase();

        if (lower.includes('code') || lower.includes('function') || lower.includes('typescript') || lower.includes('react')) {
            return 'chat_coding'; // Mapping to existing types
        }
        if (lower.includes('explain') || lower.includes('why') || lower.includes('how')) {
            return 'explanation';
        }
        if (lower.includes('review') || lower.includes('check')) {
            return 'review';
        }

        return 'chat_general';
    }

    /**
     * routeRequest
     * Decides which model to use based on prompt, budget, and preferences.
     */
    routeRequest(prompt: string, preferences: Partial<ModelRequirements> = {}): SmartRouteResult {
        // 1. Analyze Task
        const taskType = this.analyzeTaskType(prompt);

        // 2. Determine Requirements
        // Map TaskType to Requirements
        const requirements: ModelRequirements = {
            taskType: 'chat', // default
            qualityLevel: 'good',
            ...preferences
        };

        if (taskType === 'chat_coding') {
            requirements.taskType = 'code';
            requirements.qualityLevel = 'best'; // Code usually needs accuracy
        } else if (taskType === 'explanation') {
            requirements.qualityLevel = 'good';
        }

        // 3. Ask Cost Engine
        const suggestedModel = costEngine.suggestOptimalModel(prompt, requirements);

        // 4. Estimate Cost
        const estimatedTokens = prompt.length / 4 + 500; // rough estimate
        const cost = costEngine.estimateCost(suggestedModel, estimatedTokens);

        return {
            model: suggestedModel,
            reasoning: `Selected for ${taskType} task with ${requirements.qualityLevel} quality preference.`,
            estimatedCost: cost
        };
    }
}

export const smartRouter = new SmartRouter();
