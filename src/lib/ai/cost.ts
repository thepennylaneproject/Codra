import { costService } from '@/lib/billing/cost-service';
import type { TokenUsage } from './types';
import type { ModelPricing as _ModelPricing, ModelRequirements as _ModelRequirements } from '@/domain/cost-policy';

export type ModelPricing = _ModelPricing;
export type ModelRequirements = _ModelRequirements;

export interface CostComparison {
  model: string;
  estimatedCost: number;
  estimatedLatency: number;
  qualityScore: number;
  recommendation: 'best' | 'balanced' | 'budget';
}

export class CostEngine {
  getModelPricing(model: string): ModelPricing | undefined {
    return costService.getModelPricing(model);
  }

  getAllModels(): ModelPricing[] {
    return costService.getAllModels();
  }

  estimateCost(model: string, estimatedTokens: number): number {
    return costService.estimateCost(model, estimatedTokens);
  }

  estimateTokens(taskType: string, contextSize?: number): number {
    return costService.estimateTokens(taskType, contextSize);
  }

  applyMarkup(cost: number): number {
    return costService.applyMarkup(cost);
  }

  calculateActualCost(model: string, usage: TokenUsage): number {
    return costService.calculateActualCost(model, usage);
  }

  compareModels(prompt: string, models: string[]): CostComparison[] {
    return costService.compareModels(prompt, models);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  suggestOptimalModel(_prompt: string, requirements: ModelRequirements): string {
    return costService.suggestOptimalModel(_prompt, requirements);
  }
}

export const costEngine = new CostEngine();
