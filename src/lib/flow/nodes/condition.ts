import { NodeExecutor, ExecutionContext, ValidationResult } from '../types';
import { AppNode } from '../../../types/flow';

export const conditionExecutor: NodeExecutor<AppNode> = {
    async execute(node: AppNode, _inputs: Record<string, any>, _context: ExecutionContext) {
        // Condition node logic
        // node.data should have 'condition' (expression) or 'rules'
        // For simplicity: node.data.expression which evaluates to truthy/falsy

        // Since executor resolves templates, node.data.expression might be resolved string "true" or "false" 
        // or actual boolean if we handled types well.

        // But usually condition expressions are like "foo == 'bar'". 
        // If we resolved templates, we might get "bar == 'bar'".

        // WARNING: Evaluating arbitrary strings is risky (eval). 
        // Safer to use a simple comparison logic configuration:
        // { left: "{{var}}", operator: "equals", right: "value" }

        const data = node.data as any;
        let result = false;

        if (data.operator) {
            const left = data.left; // resolved value
            const right = data.right; // resolved value

            switch (data.operator) {
                case 'equals': result = left == right; break;
                case 'notEquals': result = left != right; break;
                case 'contains': result = String(left).includes(String(right)); break;
                case 'greaterThan': result = Number(left) > Number(right); break;
                case 'lessThan': result = Number(left) < Number(right); break;
                default: result = !!left;
            }
        } else {
            // Fallback or simple boolean toggle
            result = !!data.value;
        }

        // Return special property _nextHandle to tell executor which path to take.
        // Assuming handles are named 'true' and 'false' or similar.
        return {
            result,
            _nextHandle: result ? 'true' : 'false'
        };
    },

    validate(node: AppNode): ValidationResult {
        const data = node.data as any;
        if (!data.operator && data.value === undefined) {
            return { valid: false, errors: ['Missing condition configuration'] };
        }
        return { valid: true };
    }
};
