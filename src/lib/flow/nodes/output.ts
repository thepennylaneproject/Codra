import { NodeExecutor, ExecutionContext, ValidationResult } from '../types';
import { AppNode } from '../../../types/flow';

export const outputExecutor: NodeExecutor<AppNode> = {
    async execute(node: AppNode, inputs: Record<string, any>, _context: ExecutionContext) {
        // Output node simply collects the inputs it receives and returns them.
        // The Executor engine looks for 'output' nodes to aggregate final results.

        // If the node configuration specifies specific mapping (e.g. key aliases), apply them here.
        // Assuming simple pass-through or key-value mapping from data.

        const output: Record<string, any> = {};
        const config = node.data as Record<string, any>;

        if (config.mappings && typeof config.mappings === 'object') {
            // e.g. mappings: { "finalResult": "{{step1.result}}" } -> already resolved by executor before calling this?
            // Wait, executor resolves node.data before calling.
            // So config.mappings values are already resolved values!
            Object.assign(output, config.mappings);
        } else {
            // Default behavior: pass through inputs
            Object.assign(output, inputs);
        }

        return output;
    },

    validate(_node: AppNode): ValidationResult {
        return { valid: true };
    }
};
