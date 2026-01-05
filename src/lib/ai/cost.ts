
import { TokenUsage } from './types';

export interface ModelPricing {
    id: string;
    inputCostPer1k: number;
    outputCostPer1k: number;
    quality: number; // 0-1 score
    latencyScore: number; // 0-1 score (1 is fastest)
    contextWindow: number;
    provider: string;
    type: 'chat' | 'code' | 'embedding';
}

export interface ModelRequirements {
    taskType: 'chat' | 'code' | 'creative' | 'analysis';
    qualityLevel: 'best' | 'good' | 'fast';
    maxCost?: number;
    maxLatency?: number;
    minContextWindow?: number;
}

export interface CostComparison {
    model: string;
    estimatedCost: number;
    estimatedLatency: number; // Normalized score for now, or primitive ms estimate
    qualityScore: number;
    recommendation: 'best' | 'balanced' | 'budget';
}

// Hardcoded pricing for MVP (Prices in USD per 1k tokens)
// Source: approximate public pricing as of late 2024
const MODEL_PRICES: Record<string, ModelPricing> = {
    // OpenAI (via AILMAPI or Direct)
    'gpt-4': {
        id: 'gpt-4',
        inputCostPer1k: 0.03,
        outputCostPer1k: 0.06,
        quality: 0.95,
        latencyScore: 0.4,
        contextWindow: 128000,
        provider: 'openai',
        type: 'chat'
    },
    'gpt-4o': {
        id: 'gpt-4o',
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.015,
        quality: 0.92,
        latencyScore: 0.8,
        contextWindow: 128000,
        provider: 'openai',
        type: 'chat'
    },
    'gpt-3-turbo': {
        id: 'gpt-3-turbo',
        inputCostPer1k: 0.0005,
        outputCostPer1k: 0.0015,
        quality: 0.7,
        latencyScore: 0.9,
        contextWindow: 16000,
        provider: 'openai',
        type: 'chat'
    },

    // Anthropic (via AILMAPI)
    'claude-3-5-sonnet': {
        id: 'claude-3-5-sonnet',
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
        quality: 0.88,
        latencyScore: 0.7,
        contextWindow: 200000,
        provider: 'anthropic',
        type: 'chat'
    },
    'claude-3-opus': {
        id: 'claude-3-opus',
        inputCostPer1k: 0.015,
        outputCostPer1k: 0.075,
        quality: 0.97,
        latencyScore: 0.3,
        contextWindow: 200000,
        provider: 'anthropic',
        type: 'chat'
    },

    // Meta (via AILMAPI)
    'meta-llama2-70b': {
        id: 'meta-llama2-70b',
        inputCostPer1k: 0.0007,
        outputCostPer1k: 0.0009,
        quality: 0.75,
        latencyScore: 0.85,
        contextWindow: 4096,
        provider: 'meta',
        type: 'chat'
    },

    // DeepSeek
    'deepseek-coder': {
        id: 'deepseek-coder',
        inputCostPer1k: 0.00014,
        outputCostPer1k: 0.00042, // Assumes non-cached
        quality: 0.85,
        latencyScore: 0.85,
        contextWindow: 4096,
        provider: 'deepseek',
        type: 'code'
    },
    'deepseek-chat': {
        id: 'deepseek-chat',
        inputCostPer1k: 0.0001,
        outputCostPer1k: 0.0002, // Assumes non-cached
        quality: 0.85,
        latencyScore: 0.85,
        contextWindow: 4096,
        provider: 'deepseek',
        type: 'chat'
    },

    // Gemini
    'gemini-2.0-flash': {
        id: 'gemini-2.0-flash',
        inputCostPer1k: 0.0001,
        outputCostPer1k: 0.0001, // Very cheap
        quality: 0.85,
        latencyScore: 0.95,
        contextWindow: 1000000,
        provider: 'google',
        type: 'chat'
    },
    'gemini-1.5-pro': {
        id: 'gemini-1.5-pro',
        inputCostPer1k: 0.00125,
        outputCostPer1k: 0.00375, // <128k context price
        quality: 0.92,
        latencyScore: 0.7,
        contextWindow: 1000000,
        provider: 'google',
        type: 'chat'
    }
};

export class CostEngine {

    getModelPricing(model: string): ModelPricing | undefined {
        return MODEL_PRICES[model];
    }

    getAllModels(): ModelPricing[] {
        return Object.values(MODEL_PRICES);
    }

    estimateCost(model: string, estimatedTokens: number): number {
        const pricing = this.getModelPricing(model);
        if (!pricing) return 0;

        // Assume mostly equal split for estimation if not specified, 
        // but usually prompt > completion or vice versa depending on task.
        // For simple estimation, let's assume 70% input, 30% output for chat.
        const inputTokens = estimatedTokens * 0.7;
        const outputTokens = estimatedTokens * 0.3;

        const baseCost = this.calculateCostFromSplit(pricing, inputTokens, outputTokens);
        return this.applyMarkup(baseCost);
    }

    estimateTokens(taskType: string, contextSize: number = 2000): number {
        // Heuristics for expected token usage per task type
        switch (taskType) {
            case 'code': return contextSize + 1500; // Code tasks usually have long outputs
            case 'analysis': return contextSize + 1000;
            case 'chat': return contextSize + 500;
            case 'creative': return contextSize + 2000;
            default: return contextSize + 500;
        }
    }

    applyMarkup(cost: number): number {
        const MARKUP_FACTOR = 1.2; // 20% markup
        return cost * MARKUP_FACTOR;
    }

    calculateActualCost(model: string, usage: TokenUsage): number {
        const pricing = this.getModelPricing(model);
        if (!pricing) return 0;

        return this.calculateCostFromSplit(pricing, usage.promptTokens, usage.completionTokens);
    }

    private calculateCostFromSplit(pricing: ModelPricing, inputPoints: number, outputPoints: number): number {
        return (inputPoints / 1000) * pricing.inputCostPer1k +
            (outputPoints / 1000) * pricing.outputCostPer1k;
    }

    // prompt is unused in MVP heuristic, but kept for interface consistency or future expansion
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    compareModels(prompt: string, models: string[]): CostComparison[] {
        // Simple heuristic for token count based on prompt length (char / 4)
        // plus an assumption of response length.
        const estimatedPromptTokens = prompt.length / 4;
        const estimatedResponseTokens = 500; // default assumption

        return models.map(modelId => {
            const pricing = this.getModelPricing(modelId);
            if (!pricing) {
                return {
                    model: modelId,
                    estimatedCost: 0,
                    estimatedLatency: 0,
                    qualityScore: 0,
                    recommendation: 'budget' as const
                };
            }

            const estimatedCost = this.calculateCostFromSplit(pricing, estimatedPromptTokens, estimatedResponseTokens);

            // Determine recommendation logic
            let recommendation: 'best' | 'balanced' | 'budget' = 'balanced';
            if (pricing.quality >= 0.9) recommendation = 'best';
            else if (pricing.inputCostPer1k < 0.001) recommendation = 'budget';

            return {
                model: modelId,
                estimatedCost,
                estimatedLatency: pricing.latencyScore, // Higher is faster/better in our score, but UI might want ms. keeping score for now.
                qualityScore: pricing.quality,
                recommendation
            };
        }).sort((a, b) => a.estimatedCost - b.estimatedCost);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    suggestOptimalModel(_prompt: string, requirements: ModelRequirements): string {
        const availableModels = this.getAllModels();
        let candidates = availableModels;

        // Filter by context window if needed
        if (requirements.minContextWindow) {
            candidates = candidates.filter(m => m.contextWindow >= requirements.minContextWindow!);
        }

        // Adjust quality scoring based on task type
        // e.g., if task is 'code', boost DeepSeek's score
        if (requirements.taskType === 'code') {
            candidates = candidates.map(m => {
                if (m.type === 'code') return { ...m, quality: m.quality * 1.2 };
                return m;
            });
        }

        // Sort based on requirements
        switch (requirements.qualityLevel) {
            case 'best':
                // Sort by quality descending
                candidates.sort((a, b) => b.quality - a.quality);
                break;
            case 'fast':
                // Sort by latency score descending (higher is faster)
                candidates.sort((a, b) => b.latencyScore - a.latencyScore);
                break;
            case 'good':
            default:
                // Balanced: heuristic combination of quality and price
                // We want high quality and low price.
                // Score = Quality / log(Price) ? Or just manual tiers.
                // Let's stick to a simple filter: Quality > 0.8, then cheapest.
                candidates = candidates.filter(m => m.quality >= 0.8);
                candidates.sort((a, b) => {
                    const costA = a.inputCostPer1k + a.outputCostPer1k;
                    const costB = b.inputCostPer1k + b.outputCostPer1k;
                    return costA - costB;
                });
                break;
        }

        // Apply max cost constraint if present
        if (requirements.maxCost) {
            // This is tricky without knowing token count. 
            // We can check if the model's cost per 1k is "too high" relatively?
            // Or skip for now as it requires usage estimation.
        }

        return candidates.length > 0 ? candidates[0].id : 'gpt-3-turbo';
    }
}

export const costEngine = new CostEngine();
