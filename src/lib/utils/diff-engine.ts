/**
 * DIFF ENGINE
 * src/lib/utils/diff-engine.ts
 * 
 * Semantic diffing utility for comparing project revisions.
 */

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffNode {
    type: DiffType;
    oldValue?: any;
    newValue?: any;
    children?: Record<string, DiffNode>;
}

/**
 * Computes a semantic diff between two values (objects, arrays, or primitives).
 */
export function computeSemanticDiff(oldVal: any, newVal: any): DiffNode {
    // 1. Primitive comparison
    if (oldVal === newVal) {
        return { type: 'unchanged', oldValue: oldVal, newValue: newVal };
    }

    // 2. Type mismatch or nulls
    if (typeof oldVal !== typeof newVal || oldVal === null || newVal === null) {
        return { type: 'modified', oldValue: oldVal, newValue: newVal };
    }

    // 3. Array comparison (simplified set-based check for primitives)
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        // If they are different lengths or contents, mark as modified for simplicity in this phase
        // (A more complex diffing would identify specific element moves)
        return { type: 'modified', oldValue: oldVal, newValue: newVal };
    }

    // 4. Object comparison
    if (typeof oldVal === 'object') {
        const diffs: Record<string, DiffNode> = {};
        const allKeys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]));

        for (const key of allKeys) {
            const inOld = key in oldVal;
            const inNew = key in newVal;

            if (inOld && !inNew) {
                diffs[key] = { type: 'removed', oldValue: oldVal[key] };
            } else if (!inOld && inNew) {
                diffs[key] = { type: 'added', newValue: newVal[key] };
            } else {
                const childDiff = computeSemanticDiff(oldVal[key], newVal[key]);
                if (childDiff.type !== 'unchanged') {
                    diffs[key] = childDiff;
                }
            }
        }

        if (Object.keys(diffs).length === 0) {
            return { type: 'unchanged', oldValue: oldVal, newValue: newVal };
        }

        return { type: 'modified', oldValue: oldVal, newValue: newVal, children: diffs };
    }

    return { type: 'modified', oldValue: oldVal, newValue: newVal };
}

/**
 * Higher-level helper to diff two objects and return flat map of changed keys.
 */
export function getChangedKeys(oldObj: any, newObj: any): Set<string> {
    const diff = computeSemanticDiff(oldObj, newObj);
    const changed = new Set<string>();

    if (diff.children) {
        Object.keys(diff.children).forEach(key => changed.add(key));
    }

    return changed;
}
