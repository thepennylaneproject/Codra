/**
 * TASK PROMPT EDITOR
 * View and customize AI-generated prompts before execution
 * 
 * Features:
 * - View system + user prompt
 * - Fill in variables
 * - Adjust model and parameters
 * - Preview rendered prompt
 */

import React, { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { usePromptArchitect } from '../../../lib/prompt-architect';
import type { TaskPrompt, ProjectSpec } from '../../../types/architect';

interface TaskPromptEditorProps {
    prompt: TaskPrompt;
    project: ProjectSpec;
    onUpdate: (updates: Partial<TaskPrompt>) => void;
    onExecute: (renderedPrompt: string, variables: Record<string, string>) => void;
}

export const TaskPromptEditor: React.FC<TaskPromptEditorProps> = ({
    prompt,
    project,
    onUpdate,
    onExecute,
}) => {
    const { open: openPromptArchitect } = usePromptArchitect();

    const [variables, setVariables] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        if (prompt.variables) {
            prompt.variables.forEach((v) => {
                initial[v.name] = v.defaultValue || '';
            });
        }
        return initial;
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editedUserPrompt, setEditedUserPrompt] = useState(prompt.userPrompt);

    // Handler to open Prompt Architect with task context
    const handleGeneratePrompt = () => {
        openPromptArchitect({
            projectId: project.id,
            projectTitle: project.title,
            taskId: prompt.taskId,
            taskDescription: editedUserPrompt,
            outputType: 'code', // Default for tasks
        });
    };

    // Render prompt with variables filled in
    const renderedPrompt = useMemo(() => {
        let result = editedUserPrompt;
        Object.entries(variables).forEach(([key, value]) => {
            // Use logic to replace {{variableName}} with value
            // Regex escapes curly braces
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, value);
        });
        return result;
    }, [editedUserPrompt, variables]);

    const handleVariableChange = (name: string, value: string) => {
        setVariables((prev) => ({ ...prev, [name]: value }));
    };

    const handleExecute = () => {
        onExecute(renderedPrompt, variables);
    };

    const canExecute = !prompt.variables || prompt.variables
        .filter((v) => v.required)
        .every((v) => variables[v.name]?.trim());

    return (
        <div className="space-y-6">
            {/* System Prompt (read-only) */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-label-sm text-text-muted uppercase tracking-wide">
                        System Context
                    </label>
                    <span className="text-body-sm text-text-soft">Read-only</span>
                </div>
                <div className="p-4 bg-background-subtle rounded-lg border border-border-subtle">
                    <pre className="text-body-sm text-text-secondary whitespace-pre-wrap font-mono">
                        {prompt.systemPrompt}
                    </pre>
                </div>
            </div>

            {/* Variables */}
            {prompt.variables && prompt.variables.length > 0 && (
                <div>
                    <label className="text-label-sm text-text-muted uppercase tracking-wide mb-3 block">
                        Variables
                    </label>
                    <div className="space-y-3">
                        {prompt.variables.map((variable) => (
                            <div key={variable.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-label-sm text-text-primary">
                                        {variable.name}
                                        {variable.required && <span className="text-brand-magenta ml-1">*</span>}
                                    </label>
                                    {variable.description && (
                                        <span className="text-body-sm text-text-muted">{variable.description}</span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={variables[variable.name] || ''}
                                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                                    placeholder={variable.defaultValue || `Enter ${variable.name}...`}
                                    className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm focus:outline-none focus:border-brand-teal"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User Prompt */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-label-sm text-text-muted uppercase tracking-wide">
                        Prompt
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleGeneratePrompt}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-body-sm text-energy-teal hover:bg-energy-teal/10 rounded-md transition-colors border border-glass-edge"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate</span>
                        </button>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-body-sm text-brand-teal hover:text-brand-teal/80"
                        >
                            {isEditing ? 'Preview' : 'Edit'}
                        </button>
                    </div>
                </div>

                {isEditing ? (
                    <textarea
                        value={editedUserPrompt}
                        onChange={(e) => setEditedUserPrompt(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm font-mono focus:outline-none focus:border-brand-teal resize-none"
                    />
                ) : (
                    <div className="p-4 bg-background-default rounded-lg border border-border-subtle">
                        <pre className="text-body-sm text-text-primary whitespace-pre-wrap">
                            {renderedPrompt}
                        </pre>
                    </div>
                )}
            </div>

            {/* Model Selection */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="text-label-sm text-text-muted uppercase tracking-wide mb-2 block">
                        Model
                    </label>
                    <select
                        value={prompt.suggestedModel}
                        onChange={(e) => onUpdate({ suggestedModel: e.target.value })}
                        className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm focus:outline-none focus:border-brand-teal"
                    >
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                        <option value="deepseek-chat">DeepSeek Chat</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </select>
                </div>

                <div className="w-24">
                    <label className="text-label-sm text-text-muted uppercase tracking-wide mb-2 block">
                        Temp
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={prompt.temperature || 0.7}
                        onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm focus:outline-none focus:border-brand-teal"
                    />
                </div>
            </div>

            {/* Execute Button */}
            <button
                onClick={handleExecute}
                disabled={!canExecute}
                className="w-full py-3 bg-brand-magenta text-background-default text-label-md font-semibold rounded-full hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-magenta"
            >
                Execute Prompt
            </button>
        </div>
    );
};
