import { JSONPath } from 'jsonpath-plus';
import { v4 as uuidv4 } from 'uuid';

export class VariableSystem {
    static resolve(template: string, variables: Map<string, any>): any {
        if (!template || typeof template !== 'string') {
            return template;
        }

        // Handle exact variable match (e.g. "{{foo}}" -> object)
        const exactMatch = template.match(/^\{\{([^}]+)\}\}$/);
        if (exactMatch) {
            const path = exactMatch[1].trim();
            return this.evaluatePath(path, variables);
        }

        // Handle string interpolation (e.g. "params: {{foo}}" -> "params: bar")
        return template.replace(/\{\{([^}]+)\}\}/g, (_fullMatch, path) => {
            const value = this.evaluatePath(path.trim(), variables);
            return value !== undefined && value !== null ? String(value) : '';
        });
    }

    private static evaluatePath(path: string, variables: Map<string, any>): any {
        // Built-in functions
        if (path.startsWith('$')) {
            return this.evaluateBuiltIn(path);
        }

        // Convert Map to plain object for JSONPath if needed, or just look up first segment
        // Accessing Map directly is faster for simple keys.
        const parts = path.split('.');
        const rootKey = parts[0];

        // We construct a content object from the map to allow JSONPath traversal across the whole context if needed.
        // Optimization: Only construct if it looks like a deep path or we fail simple lookup.

        // Simple lookup
        if (parts.length === 1) {
            return variables.get(rootKey);
        }

        // Deep lookup with JSONPath
        // We need to convert the variables map to an object for JSONPath to work effectively across it.
        const context = Object.fromEntries(variables);

        try {
            // Try accessing directly first to avoid JSONPath overhead if it's just dot notation
            let current = context;
            for (const pathSegment of parts) {
                if (current === undefined || current === null) return undefined;
                // robust handling for array access in dot notation e.g. items[0]
                if (pathSegment.includes('[')) {
                    // Falls back to JSONPath for complex array syntax mixed with dots for now
                    // or we could implement a simple parser. JSONPath is safer.
                    throw new Error('Use JSONPath');
                }
                current = (current as any)[pathSegment];
            }
            return current;
        } catch {
            // Fallback to JSONPath
            // JSONPath expects the query to start with $ usually, or just property names.
            // jsonpath-plus handles just property names fine usually.
            try {
                const result = JSONPath({ path: path, json: context, wrap: false });
                return result;
            } catch (e) {
                console.warn(`Failed to resolve path: ${path}`, e);
                return undefined;
            }
        }
    }

    private static evaluateBuiltIn(func: string): any {
        switch (func) {
            case '$now':
                return new Date().toISOString();
            case '$uuid':
                return uuidv4();
            case '$random':
                return Math.random();
            default:
                return undefined;
        }
    }
}
