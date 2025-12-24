// src/lib/flow/types.ts

import { AppNode, AppEdge } from '../../types/flow';

export type { AppNode, AppEdge };

export type FlowNodeType = "trigger" | "aiText" | "aiImage" | "code" | "condition" | "transform" | "output";

export interface FlowNodeMeta {
    provider: "deepseek" | "claude" | "gpt" | "brave" | "local";
    promptTemplateId?: string;
    [key: string]: any;
}

// FlowNode should be as compatible as possible with AppNode
export interface FlowNode extends AppNode {
    meta?: FlowNodeMeta;
    label?: string;
    description?: string;
}

export interface CodraFlow {
    id: string;
    name: string;
    nodes: (AppNode | FlowNode)[];
    edges: AppEdge[];
}

export type Flow = CodraFlow;

export interface ExecutionContext {
    variables: Map<string, any>;
    nodeOutputs: Map<string, any>;
    currentNode: string;
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

export interface ExecutionResult {
    success: boolean;
    outputs: Record<string, any>;
    steps: StepResult[];
    duration: number;
    cost: number;
    error?: string;
}

export interface StepResult {
    nodeId: string;
    success: boolean;
    outputs?: any;
    duration: number;
    timestamp: number;
    error?: string;
}

export interface FlowExecutor {
    execute(flow: Flow, inputs?: Record<string, any>, options?: { onStep?: (step: StepResult) => void }): Promise<ExecutionResult>;
    pause(): void;
    resume(): void;
    cancel(): void;
}

export interface NodeExecutor<T = any> {
    execute(node: T, inputs: Record<string, any>, context: ExecutionContext): Promise<any>;
    validate?(node: T): ValidationResult;
}

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
