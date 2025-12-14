/**
 * Agent Framework Selector Component
 * Allows selection of agent frameworks filtered by task category
 */

import React from 'react';
import { TaskCategory } from '../../lib/ai/types-agent-selector';
import { getAgentFrameworksByTask } from '../../lib/ai/agent-catalog';
import { cn } from '../../lib/utils';

interface AgentFrameworkSelectorProps {
    taskCategory: TaskCategory;
    selectedAgent?: string;
    onAgentSelect: (agentId: string | null) => void;
}

export const AgentFrameworkSelector: React.FC<AgentFrameworkSelectorProps> = ({
    taskCategory,
    selectedAgent,
    onAgentSelect
}) => {
    const filteredAgents = getAgentFrameworksByTask(taskCategory);

    return (
        <div className="space-y-2">
            <label className="text-label-sm text-text-muted">
                AGENT FRAMEWORK <span className="text-text-soft">(OPTIONAL)</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Raw Model Only option */}
                <button
                    onClick={() => onAgentSelect(null)}
                    className={cn(
                        'w-full px-3 py-2 rounded-lg border text-left transition-all',
                        !selectedAgent
                            ? 'border-brand-magenta bg-brand-magenta/10'
                            : 'border-border-subtle bg-background-default hover:border-brand-magenta/50'
                    )}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <span
                            className={cn(
                                'text-label-sm font-semibold',
                                !selectedAgent ? 'text-brand-magenta' : 'text-text-primary'
                            )}
                        >
                            Raw Model Only
                        </span>
                    </div>
                    <p className="text-body-sm text-text-muted ml-7">
                        Direct access to AI model without agent framework
                    </p>
                </button>

                {/* Agent frameworks */}
                {filteredAgents.map(agent => {
                    const isSelected = selectedAgent === agent.id;

                    return (
                        <button
                            key={agent.id}
                            onClick={() => onAgentSelect(agent.id)}
                            className={cn(
                                'w-full px-3 py-2 rounded-lg border text-left transition-all',
                                isSelected
                                    ? 'border-brand-magenta bg-brand-magenta/10'
                                    : 'border-border-subtle bg-background-default hover:border-brand-magenta/50'
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={cn(
                                        'text-label-sm font-semibold',
                                        isSelected ? 'text-brand-magenta' : 'text-text-primary'
                                    )}
                                >
                                    {agent.name}
                                </span>
                                {agent.isIntegrationOnly && (
                                    <span className="text-label-xs px-2 py-0.5 rounded bg-state-info/10 text-state-info border border-state-info/30">
                                        Integration
                                    </span>
                                )}
                            </div>
                            <p className="text-body-sm text-text-muted line-clamp-2">
                                {agent.description}
                            </p>
                            {agent.docsUrl && (
                                <a
                                    href={agent.docsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-body-xs text-brand-teal hover:underline mt-1 inline-block"
                                >
                                    View docs →
                                </a>
                            )}
                        </button>
                    );
                })}

                {filteredAgents.length === 0 && (
                    <div className="px-3 py-4 text-center text-body-sm text-text-muted border border-border-subtle rounded-lg bg-background-subtle">
                        No agent frameworks available for this task category
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentFrameworkSelector;
