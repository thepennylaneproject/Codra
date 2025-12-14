/**
 * DIFF UTILITIES
 * Helpers for calculating differences between text content
 */

export interface DiffChunk {
    type: 'added' | 'removed' | 'unchanged';
    value: string;
}

export function calculateDiff(original: string, modified: string): DiffChunk[] {
    // Simple line-by-line diff
    // For larger files, we might want to use a library like 'diff' or 'jsdiff'
    // but for now this simple implementation is sufficient for viewing changes

    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const result: DiffChunk[] = [];

    const maxLen = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLen; i++) {
        const origLine = originalLines[i];
        const modLine = modifiedLines[i];

        if (origLine === modLine) {
            if (origLine !== undefined) {
                result.push({ type: 'unchanged', value: origLine });
            }
        } else {
            if (origLine !== undefined) {
                result.push({ type: 'removed', value: origLine });
            }
            if (modLine !== undefined) {
                result.push({ type: 'added', value: modLine });
            }
        }
    }

    return result;
}

export function hashContentSync(content: string): string {
    // Simple sync hash for client-side use if needed, 
    // though we prefer the async crypto version in version-manager
    let hash = 0;
    if (content.length === 0) return hash.toString(16);
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}
