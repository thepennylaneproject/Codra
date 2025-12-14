/**
 * Model Engine Selector Component
 * Intelligent model selector with metadata display and filtering
 */

import React, { useMemo } from 'react';
import { TaskCategory } from '../../lib/ai/types-agent-selector';
import { categorizeModel, filterModelsByTask, filterModelsByAgent } from '../../lib/ai/model-categorizer';
import { getAgentFramework } from '../../lib/ai/agent-catalog';
import { CostBadge, LatencyBadge } from './MetadataBadges';

interface ModelEngineSelectorProps {
    taskCategory: TaskCategory;
    agentFramework?: string;
    availableModels: any[]; // Raw ModelInfo[] from AIMLAPI
    selectedModel?: string;
    onModelSelect: (modelId: string) => void;
}

export const ModelEngineSelector: React.FC<ModelEngineSelectorProps> = ({
    taskCategory,
    agentFramework,
    availableModels,
    selectedModel,
    onModelSelect
}) => {
    // Categorize and filter models
    const filteredModels = useMemo(() => {
        const enhanced = availableModels.map(categorizeModel);
        let filtered = filterModelsByTask(enhanced, taskCategory);

        // If agent framework selected, reorder by recommendations
        if (agentFramework) {
            const framework = getAgentFramework(agentFramework);
            if (framework) {
                filtered = filterModelsByAgent(filtered, framework.recommendedModels);
            }
        }

        return filtered;
    }, [availableModels, taskCategory, agentFramework]);

    const selectedModelData = useMemo(() => {
        return filteredModels.find(m => m.id === selectedModel);
    }, [filteredModels, selectedModel]);

    return (
        <div className="space-y-3">
            {/* Model Selector Dropdown */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-label-sm text-text-muted">MODEL ENGINE</label>
                    <span className="text-label-xs text-text-soft">
                        {filteredModels.length} available
                    </span>
                </div>
                <select
                    value={selectedModel || ''}
                    onChange={e => onModelSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20"
                >
                    <option value="" disabled>Select a model...</option>
                    {filteredModels.map(model => (
                        <option key={model.id} value={model.id}>
                            {model.name} • {model.provider} • {model.costTier}
                        </option>
                    ))}
                </select>
            </div>

            {/* Model Metadata Card */}
            {selectedModelData && (
                <div className="p-3 rounded-lg border border-border-subtle bg-background-elevated">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h4 className="text-label-md font-semibold text-text-primary">
                                {selectedModelData.name}
                            </h4>
                            <p className="text-body-sm text-text-muted">{selectedModelData.provider}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <CostBadge tier={selectedModelData.costTier} />
                            <LatencyBadge tier={selectedModelData.latencyTier} />
                        </div>
                    </div>

                    {/* Strengths */}
                    {selectedModelData.strengths.length > 0 && (
                        <div className="mb-2">
                            <p className="text-label-xs text-text-muted mb-1">STRENGTHS</p>
                            <div className="flex flex-wrap gap-1">
                                {selectedModelData.strengths.slice(0, 3).map((strength, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded bg-state-success/10 text-state-success text-body-xs"
                                    >
                                        ✓ {strength}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Best For */}
                    {selectedModelData.bestForTasks.length > 0 && (
                        <div>
                            <p className="text-label-xs text-text-muted mb-1">BEST FOR</p>
                            <p className="text-body-sm text-text-primary">
                                {selectedModelData.bestForTasks.slice(0, 2).join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Context Window */}
                    <div className="mt-2 pt-2 border-t border-border-subtle">
                        <div className="flex justify-between text-body-sm">
                            <span className="text-text-muted">Context Window</span>
                            <span className="text-text-primary font-medium">
                                {selectedModelData.contextWindow.toLocaleString()} tokens
                            </span>
                        </div>
                        <div className="flex justify-between text-body-sm mt-1">
                            <span className="text-text-muted">Cost</span>
                            <span className="text-text-primary font-medium">
                                ${selectedModelData.costPer1kPrompt}/1K • ${selectedModelData.costPer1kCompletion}/1K
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelEngineSelector;
