/**
 * Agent Selector Type Definitions
 * Comprehensive types for the task-oriented agent and model selection system
 */

import { ModelInfo } from './types';

/**
 * Task categories for organizing agents and models
 */
export enum TaskCategory {
    CODE_ASSISTANCE = 'code_assistance',
    AUTONOMOUS_WORKFLOWS = 'autonomous_workflows',
    CONTENT_GENERATION = 'content_generation',
    DATA_ANALYSIS = 'data_analysis',
    RESEARCH = 'research',
    GENERAL_PURPOSE = 'general_purpose'
}

/**
 * Cost tiers for model pricing
 */
export enum CostTier {
    FREE = 'free',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    PREMIUM = 'premium'
}

/**
 * Latency performance tiers
 */
export enum LatencyTier {
    FAST = 'fast',        // < 500ms
    MEDIUM = 'medium',    // 500ms - 2s
    SLOW = 'slow'         // > 2s
}

/**
 * Agent Framework definition
 * Represents integration tools like AutoGPT, Cline, Cursor, etc.
 */
export interface AgentFramework {
    id: string;
    name: string;
    description: string;
    taskCategories: TaskCategory[];
    recommendedModels: string[];
    docsUrl?: string;
    icon?: string;
    isIntegrationOnly: boolean;  // true = shows in UI but requires external setup
    tags?: string[];
}

/**
 * Enhanced ModelInfo with task categorization and metadata
 * Extends base ModelInfo from types.ts
 */
export interface EnhancedModelInfo extends ModelInfo {
    taskCategories: TaskCategory[];
    costTier: CostTier;
    latencyTier: LatencyTier;
    bestForTasks: string[];
    strengths: string[];
    limitations: string[];
    tags?: string[];
}

/**
 * Preset configuration for common use cases
 * Provides recommended agent + model combinations
 */
export interface AgentPreset {
    id: string;
    name: string;
    description: string;
    taskCategory: TaskCategory;
    agentFramework?: string;  // Optional - can be raw model only
    modelId: string;
    reasoning: string;  // Why this combination works
    estimatedCostTier: CostTier;
    estimatedLatencyTier: LatencyTier;
    icon?: string;
}

/**
 * Selection state for the agent selector
 * Tracks user's current selection through the flow
 */
export interface AgentSelectionState {
    taskCategory?: TaskCategory;
    agentFramework?: string;
    modelId?: string;
    preset?: string;
    isRawModelMode: boolean;
}

/**
 * Task category display information
 */
export interface TaskCategoryInfo {
    id: TaskCategory;
    name: string;
    description: string;
    icon: string;
    color: string;
}

/**
 * Helper type for filtering
 */
export interface ModelFilterOptions {
    taskCategory?: TaskCategory;
    agentFramework?: string;
    costTier?: CostTier;
    provider?: string;
    minContextWindow?: number;
}
