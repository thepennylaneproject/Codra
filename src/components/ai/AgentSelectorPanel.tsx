/**
 * Agent Selector Panel
 * Main orchestrator component that combines all selector components
 */

import React, { useState, useEffect } from 'react';
import { AgentSelectionState } from '../../lib/ai/types-agent-selector';
import TaskSelector from './TaskSelector';
import AgentFrameworkSelector from './AgentFrameworkSelector';
import ModelEngineSelector from './ModelEngineSelector';
import PresetSelector from './PresetSelector';
import { getTaskCategoryInfo } from './TaskCategoryData';

interface AgentSelectorPanelProps {
    onSelectionChange: (selection: AgentSelectionState) => void;
    initialSelection?: AgentSelectionState;
    availableModels: any[]; // Raw ModelInfo[] from AIMLAPI
    isLoadingModels?: boolean;
}

export const AgentSelectorPanel: React.FC<AgentSelectorPanelProps> = ({
    onSelectionChange,
    initialSelection,
    availableModels,
    isLoadingModels = false
}) => {
    const [selection, setSelection] = useState<AgentSelectionState>(
        initialSelection || { isRawModelMode: true }
    );

    // Update parent when selection changes
    useEffect(() => {
        onSelectionChange(selection);
    }, [selection, onSelectionChange]);

    const handleTaskSelect = (taskCategory: typeof selection.taskCategory) => {
        const newSelection: AgentSelectionState = {
            taskCategory,
            agentFramework: undefined,
            modelId: undefined,
            preset: undefined,
            isRawModelMode: true
        };
        setSelection(newSelection);
    };

    const handleAgentSelect = (agentId: string | null) => {
        const newSelection: AgentSelectionState = {
            ...selection,
            agentFramework: agentId || undefined,
            isRawModelMode: !agentId
        };
        setSelection(newSelection);
    };

    const handleModelSelect = (modelId: string) => {
        const newSelection: AgentSelectionState = {
            ...selection,
            modelId,
            preset: undefined // Clear preset when manually selecting
        };
        setSelection(newSelection);
    };

    const handlePresetSelect = (preset: any) => {
        const newSelection: AgentSelectionState = {
            taskCategory: preset.taskCategory,
            agentFramework: preset.agentFramework,
            modelId: preset.modelId,
            preset: preset.id,
            isRawModelMode: !preset.agentFramework
        };
        setSelection(newSelection);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="pb-3 border-b border-border-subtle">
                <h3 className="text-label-md text-cream font-semibold mb-1">Agent Selector</h3>
                <p className="text-body-sm text-text-muted">
                    Choose your task and AI configuration
                </p>
            </div>

            {/* Quick Presets - Show first for convenience */}
            <PresetSelector
                onPresetSelect={handlePresetSelect}
                currentTaskCategory={selection.taskCategory}
            />

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle"></div>
                </div>
                <div className="relative flex justify-center text-label-xs">
                    <span className="px-2 bg-background-elevated text-text-muted">
                        OR CUSTOMIZE
                    </span>
                </div>
            </div>

            {/* Task Selection */}
            <TaskSelector
                selectedTask={selection.taskCategory}
                onTaskSelect={handleTaskSelect}
            />

            {/* Agent & Model Selection - Show only if task is selected */}
            {selection.taskCategory && (
                <>
                    <AgentFrameworkSelector
                        taskCategory={selection.taskCategory}
                        selectedAgent={selection.agentFramework}
                        onAgentSelect={handleAgentSelect}
                    />

                    {isLoadingModels ? (
                        <div className="px-4 py-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-magenta"></div>
                            <p className="text-body-sm text-text-muted mt-2">Loading models...</p>
                        </div>
                    ) : (
                        <ModelEngineSelector
                            taskCategory={selection.taskCategory}
                            agentFramework={selection.agentFramework}
                            availableModels={availableModels}
                            selectedModel={selection.modelId}
                            onModelSelect={handleModelSelect}
                        />
                    )}
                </>
            )}

            {/* Current Selection Summary */}
            {selection.modelId && (
                <div className="p-3 rounded-lg bg-background-default border border-brand-magenta/30">
                    <p className="text-label-xs text-text-muted mb-2">CURRENT SELECTION</p>
                    <div className="space-y-1 text-body-sm">
                        {selection.taskCategory && (
                            <div className="flex items-center gap-2">
                                <span className="text-text-muted">Task:</span>
                                <span className="text-text-primary font-medium">
                                    {getTaskCategoryInfo(selection.taskCategory)?.name}
                                </span>
                            </div>
                        )}
                        {selection.agentFramework && (
                            <div className="flex items-center gap-2">
                                <span className="text-text-muted">Agent:</span>
                                <span className="text-brand-teal font-medium">{selection.agentFramework}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-text-muted">Model:</span>
                            <span className="text-text-primary font-medium">{selection.modelId}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentSelectorPanel;
