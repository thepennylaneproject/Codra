/**
 * TASK EXECUTION PANEL
 * Main orchestration component for executing task prompts
 */

import React, { useState } from 'react';
import { TaskPromptEditor } from './TaskPromptEditor';
import { TaskArtifactPreview } from './TaskArtifactPreview';
import { RegenerationControls } from './RegenerationControls';
import { getExecutor } from '../../../lib/ai/client-executor';
import type { TaskPrompt, ProjectSpec, ProjectTask, Artifact } from '../../../types/architect';
import { LoadingIcon } from '../../icons';

interface TaskExecutionPanelProps {
    prompt: TaskPrompt;
    task: ProjectTask;
    project: ProjectSpec;
    onPromptUpdate: (updates: Partial<TaskPrompt>) => void;
    onArtifactCreated: (artifact: Artifact) => void;
    onArtifactUpdated: (artifact: Artifact) => void;
}

export const TaskExecutionPanel: React.FC<TaskExecutionPanelProps> = ({
    prompt,
    task,
    project,
    onPromptUpdate,
    onArtifactCreated,
    onArtifactUpdated
}) => {
    const [isExecuting, setIsExecuting] = useState(false);
    const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
    const [activeContent, setActiveContent] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExecute = async (renderedPrompt: string, _variables: Record<string, string>) => {
        setIsExecuting(true);
        setError(null);
        setShowPreview(true);
        setActiveContent(''); // reset content

        try {
            const executor = getExecutor();

            // Execute the prompt
            const result = await executor.execute({
                model: prompt.suggestedModel,
                prompt: renderedPrompt,
                systemPrompt: prompt.systemPrompt,
                temperature: prompt.temperature,
                maxTokens: prompt.maxTokens,
                provider: 'aimlapi'
            });

            setActiveContent(result.content);

            // Save artifact (mock for now, should call parent or store action)
            // In a real implementation this would likely be an async creation call
            // For now we just prepare the data to pass up
            const newArtifact: Artifact = {
                id: crypto.randomUUID(), // Temp ID
                projectId: project.id,
                taskId: task.id,
                name: task.title + ' Output',
                type: 'code', // Detect based on content?
                status: 'draft',
                currentVersionId: 'v1',
                versionCount: 1,
                contentType: 'text',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // We assume the parent handles the actual saving and returning the real artifact
            onArtifactCreated(newArtifact);

            // We set local state for preview
            setActiveArtifact(newArtifact);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Execution failed');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleRegenerate = (feedback: string, tags: string[]) => {
        // Prepare feedback context
        // This would append feedback to the prompt context for the next run
        // For now, this is a placeholder implementation
        console.log('Regenerating with feedback:', feedback, tags);

        // Optionally execute immediately or just update prompt state
    };

    return (
        <div className="flex flex-col h-full bg-background-elevated border-l border-border-subtle overflow-hidden">
            <div className="p-4 border-b border-border-subtle">
                <h3 className="text-label-md font-semibold text-text-primary">
                    {task.title}
                </h3>
                <p className="text-body-sm text-text-muted truncate">
                    {task.description}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Editor Section */}
                <TaskPromptEditor
                    prompt={prompt}
                    project={project}
                    onUpdate={onPromptUpdate}
                    onExecute={handleExecute}
                />

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-state-error/10 border border-state-error/30 rounded-lg text-state-error text-body-sm">
                        Error: {error}
                    </div>
                )}

                {/* Results Section */}
                {(showPreview || isExecuting) && (
                    <div className="space-y-4 pt-4 border-t border-border-subtle animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-label-sm text-text-muted uppercase">Result</h4>
                            {isExecuting && <LoadingIcon className="animate-spin text-brand-teal" size={16} />}
                        </div>

                        <TaskArtifactPreview
                            content={activeContent}
                            type="code"
                            isStreaming={isExecuting}
                        />

                        {!isExecuting && activeArtifact && (
                            <RegenerationControls
                                artifactId={activeArtifact.id}
                                onRegenerate={handleRegenerate}
                                onApprove={() => {
                                    // Update artifact status
                                    setActiveArtifact({ ...activeArtifact, status: 'approved' });
                                    onArtifactUpdated({ ...activeArtifact, status: 'approved' });
                                }}
                                isRegenerating={isExecuting}
                            />
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
