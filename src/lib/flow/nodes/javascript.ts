import { NodeExecutor, ExecutionContext, ValidationResult } from '../types';
import { AppNode } from '../../../types/flow';

export const javascriptExecutor: NodeExecutor<AppNode> = {
    async execute(node: AppNode, inputs: Record<string, any>, context: ExecutionContext) {
        // node.data.code contains the user's code.
        // We assume the code bodies a function or is a script that returns a value.
        // Convention: Code should be:
        // "return inputs.value + 1;" 
        // or
        // "const x = inputs.a; return x * 2;"

        const code = node.data.code as string;
        if (!code) return {};

        try {
            // Create a function from the code
            // We expose 'inputs' and some utilities
            const fn = new Function('inputs', 'context', 'console', `
            try {
                ${code}
            } catch(e) {
                throw e;
            }
        `);

            // Mock console to capture logs if needed (not implemented fully here but good practice)
            const safeConsole = {
                log: (...args: any[]) => console.log(`[Node ${node.id}]`, ...args),
                error: (...args: any[]) => console.error(`[Node ${node.id}]`, ...args),
                warn: (...args: any[]) => console.warn(`[Node ${node.id}]`, ...args)
            };

            const result = await fn(inputs, context, safeConsole);
            return result || {};
        } catch (e: any) {
            throw new Error(`Code execution failed: ${e.message}`);
        }
    },

    validate(node: AppNode): ValidationResult {
        if (!node.data.code) return { valid: false, errors: ['No code provided'] };
        return { valid: true };
    }
};
