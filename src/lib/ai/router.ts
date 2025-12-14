/**
 * Intelligent Router for AI Providers
 * - Routes requests to available providers
 * - Falls back on failures
 * - Tracks health/availability
 */

import {
    AIProvider,
    AICompletionOptions,
    AICompletionResult,
    RouterConfig,
    RoutingDecision,
    AIStreamChunk,
    ModelInfo,
} from './types';
import { checkLimit, incrementUsage } from '../billing/usage';

interface ProviderHealth {
    lastChecked: Date;
    isHealthy: boolean;
    failureCount: number;
    lastError?: string;
}

export class AIRouter {
    private providers: Map<string, AIProvider> = new Map();
    private health: Map<string, ProviderHealth> = new Map();
    private config: RouterConfig;
    private circuitBreakerThreshold = 5;
    private circuitBreakerResetTime = 5 * 60 * 1000; // 5 minutes

    constructor(config: RouterConfig) {
        this.config = {
            useLoadBalancing: true,
            ...config,
        };
    }

    registerProvider(provider: AIProvider): void {
        this.providers.set(provider.id, provider);
        this.health.set(provider.id, {
            lastChecked: new Date(),
            isHealthy: true,
            failureCount: 0,
        });
    }



    private isCircuitBreakerOpen(providerId: string): boolean {
        const health = this.health.get(providerId);
        if (!health) return true;

        if (health.failureCount >= this.circuitBreakerThreshold) {
            const timeSinceLastCheck = Date.now() - health.lastChecked.getTime();
            if (timeSinceLastCheck < this.circuitBreakerResetTime) {
                return true;
            }
            // Reset the circuit breaker
            health.failureCount = 0;
        }

        return false;
    }

    private getAvailableProviders(): string[] {
        return Array.from(this.providers.keys()).filter(
            (id) => !this.isCircuitBreakerOpen(id)
        );
    }

    async makeRoutingDecision(
        options: AICompletionOptions
    ): Promise<RoutingDecision> {
        const available = this.getAvailableProviders();

        if (available.length === 0) {
            throw new Error('No AI providers available');
        }

        // If a specific provider is requested, use it
        if (options.provider) {
            if (available.includes(options.provider)) {
                return {
                    provider: options.provider,
                    model: options.model,
                    reason: 'Explicitly requested',
                };
            }
            // Fallback if requested provider unavailable
        }

        // Try to use primary provider
        if (available.includes(this.config.primaryProvider)) {
            return {
                provider: this.config.primaryProvider,
                model: options.model,
                reason: 'Primary provider',
            };
        }

        // Use fallback providers in order
        for (const fallbackId of this.config.fallbackProviders) {
            if (available.includes(fallbackId)) {
                return {
                    provider: fallbackId,
                    model: options.model,
                    reason: `Fallback to ${fallbackId}`,
                };
            }
        }

        // Last resort: use any available provider
        // const provider = this.providers.get(available[0]!);
        return {
            provider: available[0]!,
            model: options.model,
            reason: 'Last available provider',
        };
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        if (options.userId) {
            const hasLimit = await checkLimit(options.userId);
            if (!hasLimit) {
                throw new Error('Usage limit exceeded. Please upgrade your plan.');
            }
        }

        const decision = await this.makeRoutingDecision(options);
        const provider = this.providers.get(decision.provider);

        if (!provider) {
            throw new Error(`Provider ${decision.provider} not found`);
        }

        try {
            const result = await provider.complete(options);
            // Mark as healthy on success
            const health = this.health.get(decision.provider);
            if (health) {
                health.failureCount = 0;
                health.isHealthy = true;
            }
            if (options.userId) {
                await incrementUsage(options.userId);
            }
            return { ...result, provider: decision.provider };
        } catch (error) {
            const health = this.health.get(decision.provider);
            if (health) {
                health.failureCount++;
                health.lastError = error instanceof Error ? error.message : String(error);
            }

            // Try fallback providers
            for (const fallbackId of this.config.fallbackProviders) {
                if (fallbackId === decision.provider) continue; // Skip current provider

                const fallback = this.providers.get(fallbackId);
                if (!fallback || this.isCircuitBreakerOpen(fallbackId)) continue;

                try {
                    const result = await fallback.complete(options);
                    if (options.userId) {
                        await incrementUsage(options.userId);
                    }
                    return { ...result, provider: fallbackId };
                } catch {
                    // Continue to next fallback
                }
            }

            // All fallbacks failed
            throw new Error(
                `All providers failed. Last error from ${decision.provider}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async *streamComplete(options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        const decision = await this.makeRoutingDecision(options);
        const provider = this.providers.get(decision.provider);

        if (!provider) {
            throw new Error(`Provider ${decision.provider} not found`);
        }

        try {
            for await (const chunk of provider.streamComplete(options)) {
                yield chunk;
            }
            // Mark as healthy on success
            const health = this.health.get(decision.provider);
            if (health) {
                health.failureCount = 0;
                health.isHealthy = true;
            }
        } catch (error) {
            const health = this.health.get(decision.provider);
            if (health) {
                health.failureCount++;
                health.lastError = error instanceof Error ? error.message : String(error);
            }

            // Don't try fallbacks for streams (would break the stream)
            throw new Error(
                `Stream from ${decision.provider} failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async listModels(): Promise<Record<string, ModelInfo[]>> {
        const models: Record<string, ModelInfo[]> = {};

        for (const [providerId, provider] of this.providers) {
            try {
                models[providerId] = await provider.listModels();
            } catch (error) {
                console.error(`Failed to list models from ${providerId}:`, error);
            }
        }

        return models;
    }

    getProviderHealth(): Record<string, ProviderHealth> {
        const health: Record<string, ProviderHealth> = {};
        for (const [id, h] of this.health) {
            health[id] = { ...h };
        }
        return health;
    }
}