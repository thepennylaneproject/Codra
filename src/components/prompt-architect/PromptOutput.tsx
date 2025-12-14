/**
 * PROMPT ARCHITECT - Prompt Output
 * src/components/prompt-architect/PromptOutput.tsx
 * 
 * Tabbed display of generated prompts with editable content
 */

import React from 'react';
import { FileText, Settings, XCircle, Lightbulb, Pencil, Globe, ExternalLink } from 'lucide-react';
import { usePromptArchitectStore } from '../../lib/prompt-architect';
import { OutputTab } from '../../lib/prompt-architect/types';
import { cn } from '../../lib/utils';

// ============================================================
// Types
// ============================================================

interface TabConfig {
    id: OutputTab;
    label: string;
    icon: React.ReactNode;
    optional: boolean;
}

const TABS: TabConfig[] = [
    { id: 'prompt', label: 'Prompt', icon: <FileText className="w-3.5 h-3.5" />, optional: false },
    { id: 'system', label: 'System', icon: <Settings className="w-3.5 h-3.5" />, optional: true },
    { id: 'negative', label: 'Negative', icon: <XCircle className="w-3.5 h-3.5" />, optional: true },
    { id: 'sources', label: 'Sources', icon: <Globe className="w-3.5 h-3.5" />, optional: true },
    { id: 'assumptions', label: 'Assumptions', icon: <Lightbulb className="w-3.5 h-3.5" />, optional: false },
];

// ============================================================
// Component
// ============================================================

export const PromptOutput: React.FC = () => {
    const generatedPrompt = usePromptArchitectStore(state => state.generatedPrompt);
    const activeTab = usePromptArchitectStore(state => state.activeTab);
    const setActiveTab = usePromptArchitectStore(state => state.setActiveTab);
    const updatePromptContent = usePromptArchitectStore(state => state.updatePromptContent);
    const status = usePromptArchitectStore(state => state.status);
    const isGenerating = usePromptArchitectStore(state => state.isGenerating);

    // Don't render if no prompt and not generating
    if (!generatedPrompt && !isGenerating && status !== 'generating') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <FileText className="w-8 h-8 text-stardust-dim mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-stardust-dim">
                        Enter your intent above to generate a prompt
                    </p>
                </div>
            </div>
        );
    }

    // Loading state
    if (isGenerating) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-energy-teal/30 border-t-energy-teal rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-stardust-dim">
                        Generating optimized prompt...
                    </p>
                </div>
            </div>
        );
    }

    if (!generatedPrompt) return null;

    // Determine which tabs to show
    const visibleTabs = TABS.filter(tab => {
        if (!tab.optional) return true;
        if (tab.id === 'system') return !!generatedPrompt.system;
        if (tab.id === 'negative') return !!generatedPrompt.negative;
        if (tab.id === 'sources') return !!generatedPrompt.sources && generatedPrompt.sources.length > 0;
        return true;
    });

    // Get current tab content
    const getTabContent = (): string => {
        switch (activeTab) {
            case 'prompt': return generatedPrompt.primary;
            case 'system': return generatedPrompt.system || '';
            case 'negative': return generatedPrompt.negative || '';
            case 'assumptions': return generatedPrompt.assumptions.join('\n• ');
            case 'sources': return generatedPrompt.sourcesBlock || '';
            default: return '';
        }
    };

    const isEditable = activeTab !== 'assumptions' && activeTab !== 'sources';

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex border-b border-glass-edge px-2">
                {visibleTabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all relative',
                                isActive
                                    ? 'text-energy-teal'
                                    : 'text-stardust-muted hover:text-stardust'
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-energy-teal" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-hidden">
                {activeTab === 'assumptions' ? (
                    // Assumptions List (non-editable)
                    <div className="h-full overflow-auto custom-scrollbar">
                        <ul className="space-y-2">
                            {generatedPrompt.assumptions.map((assumption, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-stardust-muted">
                                    <span className="text-energy-gold">•</span>
                                    <span>{assumption}</span>
                                </li>
                            ))}
                        </ul>
                        {generatedPrompt.assumptions.length === 0 && (
                            <p className="text-sm text-stardust-dim">No assumptions made.</p>
                        )}
                    </div>
                ) : activeTab === 'sources' ? (
                    // Sources List (non-editable, clickable URLs)
                    <div className="h-full overflow-auto custom-scrollbar">
                        <div className="space-y-3">
                            {generatedPrompt.sources?.map((source, idx) => (
                                <div
                                    key={idx}
                                    className="bg-void-soft border border-glass-edge rounded-lg p-3"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="text-xs font-medium text-energy-cyan">[{idx + 1}]</span>
                                        <span className="text-xs text-stardust-dim capitalize">{source.source}</span>
                                    </div>
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-1.5 text-sm font-medium text-stardust hover:text-energy-teal transition-colors"
                                    >
                                        <span className="line-clamp-1">{source.title}</span>
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </a>
                                    {source.snippet && (
                                        <p className="mt-1 text-xs text-stardust-muted line-clamp-3">
                                            {source.snippet}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        {(!generatedPrompt.sources || generatedPrompt.sources.length === 0) && (
                            <p className="text-sm text-stardust-dim">No sources retrieved.</p>
                        )}
                    </div>
                ) : (
                    // Editable Prompt Content
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-stardust-dim uppercase tracking-wide">
                                {isEditable ? 'Editable' : 'Read-only'}
                            </span>
                            {isEditable && (
                                <Pencil className="w-3 h-3 text-stardust-dim" />
                            )}
                        </div>
                        <textarea
                            value={getTabContent()}
                            onChange={(e) => {
                                if (isEditable) {
                                    const field = activeTab === 'prompt' ? 'primary' : activeTab;
                                    if (field === 'primary' || field === 'system' || field === 'negative') {
                                        updatePromptContent(field, e.target.value);
                                    }
                                }
                            }}
                            readOnly={!isEditable}
                            className={cn(
                                'flex-1 w-full bg-void-soft border border-glass-edge rounded-lg p-3',
                                'text-sm text-stardust font-mono',
                                'focus:outline-none focus:border-energy-teal/50',
                                'resize-none custom-scrollbar',
                                !isEditable && 'cursor-default'
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptOutput;
