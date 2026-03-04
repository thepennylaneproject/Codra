export interface ModelPricing {
  id: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  quality: number;
  latencyScore: number;
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

export interface DebateTokenHeuristics {
  inputCharsPerToken: number;
  shadowCharsPerToken: number;
  fragmentTokens: number;
  perModelOverheadTokens: number;
  outputTokenBase: number;
  outputTokenPerFragment: number;
  outputTokenPerFragmentCap: number;
}

export interface CostPolicy {
  markupFactor: number;
  defaultTokenSplit: {
    inputRatio: number;
    outputRatio: number;
  };
  defaultContextTokens: number;
  taskTokenOverhead: Record<string, number>;
  avgCostPerRequest: number;
  creditsPer1kTokens: number;
  debateTokenHeuristics: DebateTokenHeuristics;
  modelPricing: Record<string, ModelPricing>;
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
    type: 'chat',
  },
  'gpt-4o': {
    id: 'gpt-4o',
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
    quality: 0.92,
    latencyScore: 0.8,
    contextWindow: 128000,
    provider: 'openai',
    type: 'chat',
  },
  'gpt-3-turbo': {
    id: 'gpt-3-turbo',
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.0015,
    quality: 0.7,
    latencyScore: 0.9,
    contextWindow: 16000,
    provider: 'openai',
    type: 'chat',
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
    type: 'chat',
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
    quality: 0.97,
    latencyScore: 0.3,
    contextWindow: 200000,
    provider: 'anthropic',
    type: 'chat',
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
    type: 'chat',
  },

  // DeepSeek
  'deepseek-coder': {
    id: 'deepseek-coder',
    inputCostPer1k: 0.00014,
    outputCostPer1k: 0.00042,
    quality: 0.85,
    latencyScore: 0.85,
    contextWindow: 4096,
    provider: 'deepseek',
    type: 'code',
  },
  'deepseek-chat': {
    id: 'deepseek-chat',
    inputCostPer1k: 0.0001,
    outputCostPer1k: 0.0002,
    quality: 0.85,
    latencyScore: 0.85,
    contextWindow: 4096,
    provider: 'deepseek',
    type: 'chat',
  },

  // Gemini
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    inputCostPer1k: 0.0001,
    outputCostPer1k: 0.0001,
    quality: 0.85,
    latencyScore: 0.95,
    contextWindow: 1000000,
    provider: 'google',
    type: 'chat',
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.00375,
    quality: 0.92,
    latencyScore: 0.7,
    contextWindow: 1000000,
    provider: 'google',
    type: 'chat',
  },
};

export const DEFAULT_COST_POLICY: CostPolicy = {
  markupFactor: 1.2,
  defaultTokenSplit: {
    inputRatio: 0.7,
    outputRatio: 0.3,
  },
  defaultContextTokens: 2000,
  taskTokenOverhead: {
    code: 1500,
    analysis: 1000,
    chat: 500,
    creative: 2000,
    default: 500,
  },
  avgCostPerRequest: 0.01,
  creditsPer1kTokens: 1,
  debateTokenHeuristics: {
    inputCharsPerToken: 4,
    shadowCharsPerToken: 6,
    fragmentTokens: 50,
    perModelOverheadTokens: 80,
    outputTokenBase: 220,
    outputTokenPerFragment: 20,
    outputTokenPerFragmentCap: 800,
  },
  modelPricing: MODEL_PRICES,
};
