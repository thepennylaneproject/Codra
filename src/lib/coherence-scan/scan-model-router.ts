/**
 * SCAN MODEL ROUTER
 * 
 * Maps audit types to optimal models and estimates costs.
 * Cost optimization through intelligent model selection.
 */

import type { AuditType } from '../../domain/coherence-scan';
import { AUDIT_METADATA, estimateScanCost, getAuditModel } from '../../domain/coherence-scan';

// ============================================
// Model Configuration
// ============================================

export type ModelId = 'claude-sonnet' | 'gpt-4o-mini' | 'gpt-4o' | 'claude-opus';

export interface ModelConfig {
    id: ModelId;
    name: string;
    provider: 'anthropic' | 'openai';
    costPer1kInput: number;  // USD
    costPer1kOutput: number; // USD
    maxTokens: number;
    supportsJson: boolean;
}

export const MODELS: Record<ModelId, ModelConfig> = {
    'claude-sonnet': {
        id: 'claude-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        maxTokens: 8192,
        supportsJson: true,
    },
    'gpt-4o-mini': {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        maxTokens: 16384,
        supportsJson: true,
    },
    'gpt-4o': {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        costPer1kInput: 0.005,
        costPer1kOutput: 0.015,
        maxTokens: 128000,
        supportsJson: true,
    },
    'claude-opus': {
        id: 'claude-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        maxTokens: 4096,
        supportsJson: true,
    },
};

// ============================================
// Router Interface
// ============================================

export interface RoutingDecision {
    auditType: AuditType;
    modelId: ModelId;
    estimatedCost: number;
    reason: string;
}

export interface ScanRoutingPlan {
    scanType: 'quick-check' | 'full-scan' | 'deep-scan';
    decisions: RoutingDecision[];
    totalEstimatedCost: number;
    estimatedDurationMs: number;
}

// ============================================
// Router Functions
// ============================================

/**
 * Get the optimal model for an audit type
 */
export function routeAudit(auditType: AuditType): RoutingDecision {
    const model = getAuditModel(auditType);
    const metadata = AUDIT_METADATA[auditType];
    
    return {
        auditType,
        modelId: model,
        estimatedCost: metadata.estimatedCost,
        reason: getRoutingReason(auditType, model),
    };
}

/**
 * Generate a routing plan for a full scan
 */
export function createRoutingPlan(
    auditTypes: AuditType[],
    scanType: 'quick-check' | 'full-scan' | 'deep-scan' = 'full-scan'
): ScanRoutingPlan {
    const decisions = auditTypes.map(routeAudit);
    const totalEstimatedCost = estimateScanCost(auditTypes);
    
    // Estimate duration: ~10s per audit for fast models, ~20s for slower
    const estimatedDurationMs = decisions.reduce((total, d) => {
        const baseTime = d.modelId === 'gpt-4o-mini' ? 8000 : 15000;
        return total + baseTime;
    }, 0);
    
    return {
        scanType,
        decisions,
        totalEstimatedCost,
        estimatedDurationMs,
    };
}

/**
 * Get human-readable reason for model selection
 */
function getRoutingReason(auditType: AuditType, modelId: ModelId): string {
    switch (auditType) {
        case 'ship-ready':
            return 'Complex UX analysis requires nuanced reasoning';
        case 'blind-spot':
            return 'Assumption detection needs sophisticated inference';
        case 'kill-list':
            return 'Fast, decisive categorization task';
        case 'investor-diligence':
            return 'Comprehensive analysis requires depth';
        case 'unclaimed-value':
            return 'Creative opportunity spotting benefits from broader reasoning';
        case 'coherence-loop':
            return 'Comparison task suitable for efficient model';
        default:
            return `Selected ${modelId} for optimal cost-quality balance`;
    }
}

/**
 * Check if deep scan (multi-model) is available for user tier
 */
export function isDeepScanAvailable(userTier: 'free' | 'pro' | 'team'): boolean {
    // Deep scan is a paid add-on, available to pro/team
    return userTier !== 'free';
}

/**
 * Get models for deep scan (ensemble)
 */
export function getDeepScanModels(): ModelId[] {
    return ['claude-sonnet', 'gpt-4o', 'gpt-4o-mini'];
}

/**
 * Estimate cost for deep scan (multi-model)
 */
export function estimateDeepScanCost(auditTypes: AuditType[]): number {
    const baseCost = estimateScanCost(auditTypes);
    // Deep scan runs 3 models, so roughly 3x base cost
    return baseCost * 2.5; // Some discount for lighter synthesis pass
}
