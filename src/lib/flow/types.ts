import { AppNode, AppEdge } from '../../types/flow';
export type { AppNode, AppEdge };

export interface Flow {
    nodes: AppNode[];
    edges: AppEdge[];
}

export interface ExecutionContext {
    variables: Map<string, any>;
    nodeOutputs: Map<string, any>;
    currentNode: string;
    status: 'running' | 'paused' | 'completed' | 'error';
}

export interface StepResult {
    nodeId: string;
    success: boolean;
    outputs?: any;
    error?: string;
    duration: number;
    timestamp: number;
}

export interface ExecutionResult {
    success: boolean;
    outputs: Record<string, any>;
    steps: StepResult[];
    duration: number;
    cost: number;
    error?: string;
}

export interface FlowExecutor {
    execute(flow: Flow, inputs?: Record<string, any>, options?: { onStep?: (step: StepResult) => void }): Promise<ExecutionResult>;
    executeStep(flow: Flow, nodeId: string, context: ExecutionContext): Promise<StepResult>;
    pause(): void;
    resume(): void;
    cancel(): void;
}

export interface NodeExecutor<T extends AppNode = AppNode> {
    execute(node: T, inputs: Record<string, any>, context: ExecutionContext): Promise<any>;
    validate(node: T): ValidationResult;
}

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
