/**
 * Preset Selector Component
 * Quick selection of recommended agent + model combinations
 */

import React, { useState } from 'react';
import { AgentPreset, TaskCategory } from '../../lib/ai/types-agent-selector';
import { AGENT_PRESETS, getPresetsForTask } from '../../lib/ai/agent-presets';
import { CostBadge, LatencyBadge } from './MetadataBadges';

interface PresetSelectorProps {
    onPresetSelect: (preset: AgentPreset) => void;
    currentTaskCategory?: TaskCategory;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    onPresetSelect,
    currentTaskCategory
}) => {
    const [filterCategory, setFilterCategory] = useState<TaskCategory | undefined>(currentTaskCategory);

    const filteredPresets = filterCategory
        ? getPresetsForTask(filterCategory)
        : AGENT_PRESETS;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-label-sm text-text-muted">RECOMMENDED PRESETS</label>
                {filterCategory && (
                    <button
                        onClick={() => setFilterCategory(undefined)}
                        className="text-label-xs text-brand-magenta hover:underline"
                    >
                        Show All
                    </button>
                )}
            </div>

            <div className="grid gap-2 max-h-80 overflow-y-auto">
                {filteredPresets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => onPresetSelect(preset)}
                        className="px-4 py-3 rounded-lg border border-border-subtle bg-background-default hover:border-brand-magenta/50 hover:bg-background-elevated text-left transition-all group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {preset.icon && <span className="text-lg">{preset.icon}</span>}
                                <span className="text-label-sm font-semibold text-text-primary group-hover:text-brand-magenta transition-colors">
                                    {preset.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CostBadge tier={preset.estimatedCostTier} />
                                <LatencyBadge tier={preset.estimatedLatencyTier} />
                            </div>
                        </div>

                        <p className="text-body-sm text-text-muted mb-2">
                            {preset.description}
                        </p>

                        {/* Configuration details */}
                        <div className="flex items-center gap-2 text-body-xs text-text-soft mb-2">
                            {preset.agentFramework && (
                                <span className="px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal border border-brand-teal/30">
                                    {preset.agentFramework}
                                </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-background-subtle text-text-primary border border-border-subtle">
                                {preset.modelId}
                            </span>
                        </div>

                        {/* Reasoning */}
                        <p className="text-body-xs text-text-soft italic border-l-2 border-brand-gold pl-2">
                            💡 {preset.reasoning}
                        </p>
                    </button>
                ))}
            </div>

            {filteredPresets.length === 0 && (
                <div className="px-4 py-8 text-center text-body-sm text-text-muted border border-border-subtle rounded-lg bg-background-subtle">
                    No presets available for the selected category
                </div>
            )}
        </div>
    );
};

export default PresetSelector;
