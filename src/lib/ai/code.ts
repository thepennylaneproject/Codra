import { AIRouter } from './router';
import { ModelRouter } from './model-router';
// import { AICompletionOptions, AICompletionResult } from './types';

export interface CodeContext {
    file: string;
    language: string;
    content: string;
    cursorPosition?: { line: number; column: number };
    selection?: { start: number; end: number };
}

export interface CodeReviewIssue {
    severity: 'error' | 'warning' | 'suggestion';
    line: number;
    message: string;
    fix?: string;
}

export interface CodeReview {
    summary: string;
    issues: CodeReviewIssue[];
    score: number;
}

export interface CodeDiff {
    original: string;
    modified: string;
    explanation: string;
}

export interface CodeAssistant {
    complete(context: CodeContext, prompt?: string): Promise<string>;
    explain(context: CodeContext): Promise<string>;
    review(context: CodeContext): Promise<CodeReview>;
    refactor(context: CodeContext, instruction: string): Promise<CodeDiff>;
    generateTests(context: CodeContext): Promise<string>;
    chat(context: CodeContext[], message: string): Promise<string>;
}

export class CodraAssistant implements CodeAssistant {
    private router: AIRouter;
    private modelRouter: ModelRouter;

    constructor(router: AIRouter) {
        this.router = router;
        this.modelRouter = new ModelRouter();
    }

    private buildSystemPrompt(role: string): string {
        return `You are an expert AI coding assistant. Your role is: ${role}.
    Provide concise, correct, and high-quality code or explanations.
    Do not be conversational unless in chat mode.`;
    }

    async complete(context: CodeContext, prompt?: string): Promise<string> {
        const systemPrompt = this.buildSystemPrompt('Code Completion Expert');
        const userPrompt = `
      File: ${context.file}
      Language: ${context.language}
      Context: ${context.content}
      ${context.cursorPosition ? `Cursor: Line ${context.cursorPosition.line}, Col ${context.cursorPosition.column}` : ''}
      ${prompt ? `Instruction: ${prompt}` : 'Complete the code at the cursor.'}
    `;

        const selection = this.modelRouter.selectModel('completion');

        const result = await this.router.complete({
            model: selection.model,
            provider: selection.provider,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: selection.temperature
        });

        return result.content;
    }

    async explain(context: CodeContext): Promise<string> {
        const selectedCode = context.selection
            ? context.content.substring(context.selection.start, context.selection.end)
            : context.content;

        const selection = this.modelRouter.selectModel('explanation');

        const result = await this.router.complete({
            model: selection.model,
            provider: selection.provider,
            messages: [
                { role: 'system', content: this.buildSystemPrompt('Code Explainer') },
                { role: 'user', content: `Explain this code:\n\n${selectedCode}` }
            ],
            temperature: selection.temperature,
        });

        return result.content;
    }

    async review(context: CodeContext): Promise<CodeReview> {
        const selection = this.modelRouter.selectModel('review');

        const result = await this.router.complete({
            model: selection.model,
            provider: selection.provider,
            messages: [
                { role: 'system', content: this.buildSystemPrompt('Code Reviewer. partial JSON response format required.') },
                { role: 'user', content: `Review this code for bugs, security issues, and style. Return JSON with summary, score (0-100), and issues list.\n\nCode:\n${context.content}` }
            ],
            temperature: selection.temperature,
            // Valid JSON constraint would be ideal here if provider supports it
        });

        try {
            // Simple heuristic parsing if raw text
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : result.content;
            return JSON.parse(jsonStr) as CodeReview;
        } catch (e) {
            return {
                summary: "Failed to parse review result",
                issues: [],
                score: 0
            };
        }
    }

    async refactor(context: CodeContext, instruction: string): Promise<CodeDiff> {
        const selectedCode = context.selection
            ? context.content.substring(context.selection.start, context.selection.end)
            : context.content;

        const selection = this.modelRouter.selectModel('refactoring');

        const result = await this.router.complete({
            model: selection.model,
            provider: selection.provider,
            messages: [
                { role: 'system', content: this.buildSystemPrompt('Refactoring Expert') },
                { role: 'user', content: `Refactor this code according to instruction: "${instruction}".\n\nCode:\n${selectedCode}\n\nReturn only the new code.` }
            ],
            temperature: selection.temperature,
        });

        return {
            original: selectedCode,
            modified: result.content,
            explanation: "Refactored based on instruction."
        };
    }

    async generateTests(context: CodeContext): Promise<string> {
        const selection = this.modelRouter.selectModel('refactoring'); // Tests are code generation

        const result = await this.router.complete({
            model: selection.model,
            provider: selection.provider,
            messages: [
                { role: 'system', content: this.buildSystemPrompt('QA Engineer') },
                { role: 'user', content: `Generate unit tests for this code:\n\n${context.content}` }
            ],
            temperature: selection.temperature,
        });
        return result.content;
    }

    async chat(contexts: CodeContext[], message: string): Promise<string> {
        const contextStr = contexts.map(c => `File: ${c.file}\n\`\`\`${c.language}\n${c.content}\n\`\`\``).join('\n\n');

        const selection = this.modelRouter.selectModel('chat_coding');

        const result = await this.router.complete({
            model: selection.model,
            provider: selection.provider,
            messages: [
                { role: 'system', content: this.buildSystemPrompt('Helpful Coding Assistant') },
                { role: 'user', content: `Context:\n${contextStr}\n\nUser Question: ${message}` }
            ],
            temperature: selection.temperature,
        });

        return result.content;
    }
}
