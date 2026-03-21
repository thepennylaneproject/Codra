import { NodeExecutor, ExecutionContext, ValidationResult } from '../types';
import { AppNode } from '../../../types/flow';

/** Equality that treats resolved numbers and string literals as comparable (e.g. 10 vs "10"). */
function looseEqual(leftValue: unknown, rightValue: unknown): boolean {
    if (leftValue === rightValue) return true;
    if (typeof leftValue === 'number' && typeof rightValue === 'string') {
        return !Number.isNaN(Number(rightValue)) && leftValue === Number(rightValue);
    }
    if (typeof leftValue === 'string' && typeof rightValue === 'number') {
        return !Number.isNaN(Number(leftValue)) && Number(leftValue) === rightValue;
    }
    return String(leftValue) === String(rightValue);
}

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

        const conditionConfig = node.data as any;
        let conditionResult = false;

        if (conditionConfig.operator) {
            const left = conditionConfig.left; // resolved value
            const right = conditionConfig.right; // resolved value

            switch (conditionConfig.operator) {
                case 'equals': conditionResult = looseEqual(left, right); break;
                case 'notEquals': conditionResult = !looseEqual(left, right); break;
                case 'contains': conditionResult = String(left).includes(String(right)); break;
                case 'greaterThan': conditionResult = Number(left) > Number(right); break;
                case 'lessThan': conditionResult = Number(left) < Number(right); break;
                default: conditionResult = !!left;
            }
        } else {
            // Fallback or simple boolean toggle
            conditionResult = !!conditionConfig.value;
        }

        // Return special property _nextHandle to tell executor which path to take.
        // Assuming handles are named 'true' and 'false' or similar.
        return {
            result: conditionResult,
            _nextHandle: conditionResult ? 'true' : 'false'
        };
    },

    validate(node: AppNode): ValidationResult {
        const conditionConfig = node.data as any;
        if (!conditionConfig.operator && conditionConfig.value === undefined) {
            return { valid: false, errors: ['Missing condition configuration'] };
        }
        return { valid: true };
    }
};
