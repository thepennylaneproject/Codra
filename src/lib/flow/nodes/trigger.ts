import { NodeExecutor, ExecutionContext, ValidationResult } from '../types';
import { AppNode } from '../../../types/flow';

export const triggerExecutor: NodeExecutor<AppNode> = {
    async execute(_node: AppNode, _inputs: Record<string, any>, context: ExecutionContext) {
        // Trigger node execution logic
        // For manual triggers, inputs come from the initial execution call.
        // For webhooks, the payload is in the inputs.

        // We map the inputs to the context variables so downstream nodes can access them.
        // E.g. {{trigger.body.foo}}

        // In our VariableSystem, we initialized variables with global inputs.
        // But we also want to expose them specifically as 'trigger' output for clarity?
        // Or just pass inputs through as output.
        // For trigger nodes, the initial flow inputs are in context.variables.
        return Object.fromEntries(context.variables);
    },

    validate(_node: AppNode): ValidationResult {
        return { valid: true };
    }
};
