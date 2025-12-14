export type TaskType = 'completion' | 'explanation' | 'review' | 'refactoring' | 'chat_coding' | 'chat_general';

export interface ModelSelection {
    provider: string; // e.g., 'openai', 'anthropic', 'deepseek'
    model: string;    // e.g., 'gpt-4', 'claude-3-opus', 'deepseek-coder'
    temperature: number;
}

export class ModelRouter {

    /**
     * Selects the appropriate model and provider based on the task type.
     */
    selectModel(task: TaskType): ModelSelection {
        switch (task) {
            case 'completion':
                return {
                    provider: 'deepseek',
                    model: 'deepseek-coder',
                    temperature: 0.1
                };

            case 'explanation':
                return {
                    provider: 'anthropic',
                    model: 'claude-3-sonnet',
                    temperature: 0.2
                };

            case 'review':
                return {
                    provider: 'openai',
                    model: 'gpt-4',
                    temperature: 0.0
                };

            case 'refactoring':
                return {
                    provider: 'deepseek', // DeepSeek is strong at pure code manipulation
                    model: 'deepseek-coder',
                    temperature: 0.0
                };

            case 'chat_coding':
                return {
                    provider: 'anthropic',
                    model: 'claude-3-opus', // High reasoning for complex coding questions
                    temperature: 0.4
                };

            case 'chat_general':
                return {
                    provider: 'openai',
                    model: 'gpt-4', // Broad knowledge base
                    temperature: 0.7
                };

            default:
                return {
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7
                };
        }
    }
}
