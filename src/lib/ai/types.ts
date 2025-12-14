/**
 * Core AI Provider Interfaces
 * Unified interface for all text-based AI providers
 */

export type MessageRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
    role: MessageRole;
    content: string;
}

export interface AICompletionOptions {
    model: string;
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
    provider?: string;
    userId?: string;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface AICompletionResult {
    content: string;
    model: string;
    provider: string;
    usage: TokenUsage;
    latency: number; // milliseconds
    cost: number; // in USD
}

export interface AIStreamChunk {
    type: 'start' | 'content' | 'end';
    content?: string;
    usage?: TokenUsage;
    cost?: number;
}

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    contextWindow: number;
    costPer1kPrompt: number; // USD
    costPer1kCompletion: number; // USD
    capabilities: string[]; // ['chat', 'code', 'vision']
    isPowered?: boolean; // Whether the model is currently available
}

export interface AIProvider {
    id: string;
    name: string;

    /**
     * Complete a conversation
     */
    complete(options: AICompletionOptions): Promise<AICompletionResult>;

    /**
     * Stream a completion
     */
    streamComplete(options: AICompletionOptions): AsyncGenerator<AIStreamChunk>;

    /**
     * List available models
     */
    listModels(): Promise<ModelInfo[]>;

    /**
     * Estimate cost for a prompt
     */
    estimateCost(model: string, promptTokens: number, completionTokens?: number): number;

    /**
     * Validate the provider is properly configured
     */
    validate(): Promise<boolean>;
}

// Router types
export interface RouterConfig {
    primaryProvider: string;
    fallbackProviders: string[];
    costThreshold?: number;
    useLoadBalancing?: boolean;
}

export interface RoutingDecision {
    provider: string;
    model: string;
    reason: string;
}

// Request/Response types for Netlify Functions
export interface AICompletionRequest {
    model: string;
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stream?: boolean;
    provider?: string; // Optional: force specific provider
}

export interface AICompletionResponse {
    success: boolean;
    data?: AICompletionResult;
    error?: string;
    provider?: string;
}

export interface AIStreamResponse {
    success: boolean;
    error?: string;
    stream?: AsyncIterable<AIStreamChunk>;
}