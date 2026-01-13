/**
 * Monaco Inline Completion Provider
 * Provides AI-powered code suggestions as you type (like GitHub Copilot)
 */

import * as monaco from 'monaco-editor';

export interface InlineCompletionConfig {
    apiKey?: string;
    model?: string;
    debounceMs?: number;
    maxTokens?: number;
    enabled?: boolean;
}

// API call to get completions - uses server-side Netlify function
async function getAICompletion(
    prefix: string,
    suffix: string,
    language: string,
    accessToken: string,
    model: string = 'deepseek-coder'
): Promise<string | null> {
    try {
        const response = await fetch('/api/ai/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert code completion assistant. Complete the code naturally. Only return the completion text, no explanations.`
                    },
                    {
                        role: 'user',
                        content: `Language: ${language}\n\nCode before cursor:\n${prefix}\n\nCode after cursor:\n${suffix}\n\nComplete the code at the cursor position. Return ONLY the completion text.`
                    }
                ],
                model,
                temperature: 0.1,
                maxTokens: 150,
            }),
        });

        if (!response.ok) {
            console.warn('[InlineCompletion] API error:', response.status);
            return null;
        }

        const data = await response.json();
        if (!data.success) {
            return null;
        }

        return data.data?.content?.trim() || null;
    } catch (error) {
        console.warn('[InlineCompletion] Error:', error);
        return null;
    }
}

// Debounce helper (exported for potential external use)
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    ms: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), ms);
    };
}

export class AIInlineCompletionProvider implements monaco.languages.InlineCompletionsProvider {
    private config: InlineCompletionConfig;
    private accessToken: string | null = null;
    private pending: AbortController | null = null;

    constructor(config: InlineCompletionConfig = {}) {
        this.config = {
            debounceMs: 500,
            maxTokens: 150,
            enabled: true,
            model: 'deepseek-coder',
            ...config,
        };
    }

    public setAccessToken(token: string) {
        this.accessToken = token;
    }

    public setEnabled(enabled: boolean) {
        this.config.enabled = enabled;
    }

    public setModel(model: string) {
        this.config.model = model;
    }

    async provideInlineCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.InlineCompletionContext,
        token: monaco.CancellationToken
    ): Promise<monaco.languages.InlineCompletions | null> {
        // Check if enabled and authenticated
        if (!this.config.enabled || !this.accessToken) {
            return null;
        }

        // Only trigger on explicit or automatic invocations
        if (context.triggerKind === monaco.languages.InlineCompletionTriggerKind.Explicit) {
            // Explicit trigger - always provide
        }

        // Cancel any pending request
        if (this.pending) {
            this.pending.abort();
        }

        // Get code context
        const fullText = model.getValue();
        const offset = model.getOffsetAt(position);
        const prefix = fullText.substring(Math.max(0, offset - 2000), offset);
        const suffix = fullText.substring(offset, Math.min(fullText.length, offset + 500));

        // Get language
        const languageId = model.getLanguageId();

        // Don't trigger on small content or at start of line
        const lineContent = model.getLineContent(position.lineNumber);
        if (lineContent.trim().length < 2) {
            return null;
        }

        try {
            this.pending = new AbortController();

            // Check for cancellation
            if (token.isCancellationRequested) {
                return null;
            }

            // Call AI
            const completion = await getAICompletion(
                prefix,
                suffix,
                languageId,
                this.accessToken,
                this.config.model
            );

            // Check for cancellation again
            if (token.isCancellationRequested || !completion) {
                return null;
            }

            // Return inline completion
            return {
                items: [{
                    insertText: completion,
                    range: new monaco.Range(
                        position.lineNumber,
                        position.column,
                        position.lineNumber,
                        position.column
                    ),
                }],
            };
        } catch (error) {
            console.warn('[InlineCompletion] Provider error:', error);
            return null;
        } finally {
            this.pending = null;
        }
    }

    // Required by Monaco InlineCompletionsProvider interface
    disposeInlineCompletions(): void {
        // Cleanup if needed
    }

    freeInlineCompletions(): void {
        // Legacy cleanup method
    }
}

// Helper to register the provider with Monaco
export function registerInlineCompletionProvider(
    monacoInstance: typeof monaco,
    provider: AIInlineCompletionProvider,
    languages: string[] = ['javascript', 'typescript', 'typescriptreact', 'javascriptreact', 'python', 'go', 'rust', 'java', 'c', 'cpp']
): monaco.IDisposable[] {
    return languages.map(lang =>
        monacoInstance.languages.registerInlineCompletionsProvider(lang, provider)
    );
}

// Singleton instance
let providerInstance: AIInlineCompletionProvider | null = null;

export function getInlineCompletionProvider(): AIInlineCompletionProvider {
    if (!providerInstance) {
        providerInstance = new AIInlineCompletionProvider();
    }
    return providerInstance;
}
