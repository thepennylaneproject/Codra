import { NodeExecutor, ExecutionContext, ValidationResult } from '../types';
import { AppNode } from '../../../types/flow';

export const transformExecutor: NodeExecutor<AppNode> = {
    async execute(node: AppNode, _inputs: Record<string, any>, _context: ExecutionContext) {
        // Transform node logic
        // node.data usually contains the 'transformation' definition.
        // e.g. a JSON object where values are templates.

        // Executor.ts already resolves templates in node.data before passing it here!
        // So if node.data.outputStructure was "{{trigger.name}}", it is already "Alice" here.

        // However, if we want to support more complex transformations that require runtime logic *inside* the executor 
        // (like array mapping), we might need raw data. 
        // But for this phase, let's assume the 'resolvedData' passed by executor handles the main transformation 
        // via the VariableSystem.

        // So we just return the resolved configuration as the output.
        // We might need to select a specific property from data to return.

        const config = node.data as any;
        // Assuming the user configures an 'output' property in the node configuration
        return config.output || config;
    },

    validate(node: AppNode): ValidationResult {
        if (!node.data) return { valid: false, errors: ['No data configuration'] };
        return { valid: true };
    }
};
