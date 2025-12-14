import { CodeContext } from './code';

export interface ContextConfig {
    maxContextTokens: number;
    tokensReservedForResponse: number;
}

export class ContextManager {
    private activeFiles: Map<string, CodeContext> = new Map();
    private config: ContextConfig;

    constructor(config: ContextConfig = { maxContextTokens: 8000, tokensReservedForResponse: 2000 }) {
        this.config = config;
    }

    addFile(context: CodeContext) {
        this.activeFiles.set(context.file, context);
    }

    removeFile(filePath: string) {
        this.activeFiles.delete(filePath);
    }

    getActiveContexts(): CodeContext[] {
        return Array.from(this.activeFiles.values());
    }

    /**
     * Simple heuristic for token counting (approx 4 chars per token)
     */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Prunes context to fit within the limit.
     * Prioritizes the focused file (passed as argument) and then other open files.
     */
    getOptimizedContext(focusedFile: string): CodeContext[] {
        const focusedContext = this.activeFiles.get(focusedFile);
        if (!focusedContext) return [];

        let currentTokens = this.estimateTokens(focusedContext.content);
        const availableTokens = this.config.maxContextTokens - this.config.tokensReservedForResponse;
        const optimizedContexts: CodeContext[] = [focusedContext];

        if (currentTokens >= availableTokens) {
            // Truncate focused file if it's too huge on its own (keep around cursor if possible)
            // For simplicity, just return truncated content here or warn.
            // Ideally we'd slice around the cursor.
            return optimizedContexts;
        }

        // Add other files until limit is reached
        for (const [path, context] of this.activeFiles) {
            if (path === focusedFile) continue;

            const fileTokens = this.estimateTokens(context.content);
            if (currentTokens + fileTokens <= availableTokens) {
                optimizedContexts.push(context);
                currentTokens += fileTokens;
            } else {
                // Check if we can add a summary or partial? (Skipping for mvp)
                break;
            }
        }

        return optimizedContexts;
    }
}
