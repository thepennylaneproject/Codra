import type { CostPolicy, ModelPricing, ModelRequirements } from '@/domain/cost-policy';
import { DEFAULT_COST_POLICY } from '@/domain/cost-policy';
import type { TokenUsage } from '@/lib/ai/types';

export interface CostComparison {
  model: string;
  estimatedCost: number;
  estimatedLatency: number;
  qualityScore: number;
  recommendation: 'best' | 'balanced' | 'budget';
}

export interface DebateTokenEstimateInput {
  inputChars: number;
  shadowChars: number;
  fragmentCount: number;
  modelCount: number;
}

export interface DebateTokenEstimateResult {
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  creditsTotal: number;
  basis: {
    inputChars: number;
    shadowChars: number;
    fragmentCount: number;
    modelCount: number;
    perModelOverheadTokens: number;
    outputTokenBase: number;
    outputTokenPerFragment: number;
  };
}

export class CostService {
  private policy: CostPolicy;

  constructor(policy: CostPolicy = DEFAULT_COST_POLICY) {
    this.policy = policy;
  }

  getPolicy(): CostPolicy {
    return this.policy;
  }

  getModelPricing(model: string): ModelPricing | undefined {
    return this.policy.modelPricing[model];
  }

  getAllModels(): ModelPricing[] {
    return Object.values(this.policy.modelPricing);
  }

  estimateTokens(taskType: string, contextSize: number = this.policy.defaultContextTokens): number {
    const overhead = this.policy.taskTokenOverhead[taskType] ?? this.policy.taskTokenOverhead.default;
    return contextSize + overhead;
  }

  estimateTokensFromChars(chars: number, charsPerToken: number): number {
    if (charsPerToken <= 0) return 0;
    return Math.round(chars / charsPerToken);
  }

  estimateCredits(tokensTotal: number): number {
    return (tokensTotal / 1000) * this.policy.creditsPer1kTokens;
  }

  estimateCost(model: string, estimatedTokens: number): number {
    const pricing = this.getModelPricing(model);
    if (!pricing) return 0;

    const inputTokens = estimatedTokens * this.policy.defaultTokenSplit.inputRatio;
    const outputTokens = estimatedTokens * this.policy.defaultTokenSplit.outputRatio;

    const baseCost = this.calculateCostFromSplit(pricing, inputTokens, outputTokens);
    return this.applyMarkup(baseCost);
  }

  calculateActualCost(model: string, usage: TokenUsage): number {
    const pricing = this.getModelPricing(model);
    if (!pricing) return 0;

    return this.calculateCostFromSplit(pricing, usage.promptTokens, usage.completionTokens);
  }

  applyMarkup(cost: number): number {
    return cost * this.policy.markupFactor;
  }

  compareModels(prompt: string, models: string[]): CostComparison[] {
    const estimatedPromptTokens = this.estimateTokensFromChars(prompt.length, this.policy.debateTokenHeuristics.inputCharsPerToken);
    const estimatedResponseTokens = 500;

    return models.map((modelId) => {
      const pricing = this.getModelPricing(modelId);
      if (!pricing) {
        return {
          model: modelId,
          estimatedCost: 0,
          estimatedLatency: 0,
          qualityScore: 0,
          recommendation: 'budget' as const,
        };
      }

      const estimatedCost = this.calculateCostFromSplit(pricing, estimatedPromptTokens, estimatedResponseTokens);

      let recommendation: 'best' | 'balanced' | 'budget' = 'balanced';
      if (pricing.quality >= 0.9) recommendation = 'best';
      else if (pricing.inputCostPer1k < 0.001) recommendation = 'budget';

      return {
        model: modelId,
        estimatedCost,
        estimatedLatency: pricing.latencyScore,
        qualityScore: pricing.quality,
        recommendation,
      };
    }).sort((a, b) => a.estimatedCost - b.estimatedCost);
  }

  suggestOptimalModel(_prompt: string, requirements: ModelRequirements): string {
    const availableModels = this.getAllModels();
    let candidates = availableModels;

    if (requirements.minContextWindow) {
      candidates = candidates.filter((model) => model.contextWindow >= requirements.minContextWindow!);
    }

    if (requirements.maxCost) {
      candidates = candidates.filter(
        (model) => (model.inputCostPer1k + model.outputCostPer1k) / 2 <= requirements.maxCost!
      );
    }

    if (requirements.maxLatency) {
      candidates = candidates.filter((model) => model.latencyScore >= requirements.maxLatency!);
    }

    if (requirements.qualityLevel === 'best') {
      candidates = candidates.sort((a, b) => b.quality - a.quality);
    } else if (requirements.qualityLevel === 'fast') {
      candidates = candidates.sort((a, b) => b.latencyScore - a.latencyScore);
    } else {
      candidates = candidates.sort((a, b) => (a.inputCostPer1k + a.outputCostPer1k) - (b.inputCostPer1k + b.outputCostPer1k));
    }

    return candidates[0]?.id || availableModels[0]?.id || 'gpt-4o';
  }

  estimateDebateTokens(input: DebateTokenEstimateInput): DebateTokenEstimateResult {
    const {
      inputCharsPerToken,
      shadowCharsPerToken,
      fragmentTokens,
      perModelOverheadTokens,
      outputTokenBase,
      outputTokenPerFragment,
      outputTokenPerFragmentCap,
    } = this.policy.debateTokenHeuristics;

    const tokensInPerModel =
      this.estimateTokensFromChars(input.inputChars, inputCharsPerToken) +
      input.fragmentCount * fragmentTokens +
      this.estimateTokensFromChars(input.shadowChars, shadowCharsPerToken) +
      perModelOverheadTokens;

    const tokensOutPerModel =
      outputTokenBase + Math.min(input.fragmentCount * outputTokenPerFragment, outputTokenPerFragmentCap);

    const tokensIn = tokensInPerModel * input.modelCount;
    const tokensOut = tokensOutPerModel * input.modelCount;
    const tokensTotal = tokensIn + tokensOut;
    const creditsTotal = this.estimateCredits(tokensTotal);

    return {
      tokensIn,
      tokensOut,
      tokensTotal,
      creditsTotal,
      basis: {
        inputChars: input.inputChars,
        shadowChars: input.shadowChars,
        fragmentCount: input.fragmentCount,
        modelCount: input.modelCount,
        perModelOverheadTokens,
        outputTokenBase,
        outputTokenPerFragment,
      },
    };
  }

  getDefaultRequestCost(): number {
    return this.policy.avgCostPerRequest;
  }

  private calculateCostFromSplit(pricing: ModelPricing, inputTokens: number, outputTokens: number): number {
    return (inputTokens / 1000) * pricing.inputCostPer1k +
      (outputTokens / 1000) * pricing.outputCostPer1k;
  }
}

export const costService = new CostService();
