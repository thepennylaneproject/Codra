/**
 * PROMPT ARCHITECT - Panel Header
 * src/components/prompt-architect/PromptArchitectHeader.tsx
 * 
 * Header with title, mode selector, context chips, and actions
 */

import React from 'react';
import {
    X,
    Maximize2,
    Dock,
    Sparkles,
    Zap,
    Shield,
    Save,
    Play,
    ChevronDown,
} from 'lucide-react';
import { usePromptArchitectStore } from '../../lib/prompt-architect';
import { ArchitectMode, MODE_CONFIGS, OutputType } from '../../lib/prompt-architect/types';
import { cn } from '../../lib/utils';

// ============================================================
// Types
// ============================================================

interface PromptArchitectHeaderProps {
    onClose: () => void;
    onToggleFloat: () => void;
    onSave?: () => void;
    onRun?: () => void;
    isFloating: boolean;
}

// ============================================================
// Mode Icons
// ============================================================

const MODE_ICONS: Record<ArchitectMode, React.ReactNode> = {
    fast: <Zap className="w-3.5 h-3.5" />,
    precise: <Sparkles className="w-3.5 h-3.5" />,
    production: <Shield className="w-3.5 h-3.5" />,
};

// ============================================================
// Output Type Labels
// ============================================================

const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
    code: 'Code',
    icon: 'Icon',
    image: 'Image',
    copy: 'Copy',
    video: 'Video',
    component: 'Component',
    api: 'API',
    documentation: 'Docs',
    other: 'Other',
};

// ============================================================
// Component
// ============================================================

export const PromptArchitectHeader: React.FC<PromptArchitectHeaderProps> = ({
    onClose,
    onToggleFloat,
    onSave,
    onRun,
    isFloating,
}) => {
    const mode = usePromptArchitectStore(state => state.mode);
    const setMode = usePromptArchitectStore(state => state.setMode);
    const context = usePromptArchitectStore(state => state.context);
    const mergeContext = usePromptArchitectStore(state => state.mergeContext);
    const status = usePromptArchitectStore(state => state.status);
    const generatedPrompt = usePromptArchitectStore(state => state.generatedPrompt);

    const canRun = status === 'ready' && generatedPrompt !== null;
    const canSave = generatedPrompt !== null;

    return (
        <div className="flex flex-col border-b border-glass-edge bg-void-elevated/50">
            {/* Top Row: Title and Window Controls */}
            <div className="flex items-center justify-between px-4 py-3">
                {/* Title with Drag Handle */}
                <div className="flex items-center gap-2 cursor-move select-none">
                    <Sparkles className="w-4 h-4 text-energy-teal" />
                    <h2 className="text-sm font-medium text-stardust">Prompt Architect</h2>
                </div>

                {/* Window Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleFloat}
                        className="p-1.5 rounded-md hover:bg-white/5 text-stardust-muted hover:text-stardust transition-colors"
                        title={isFloating ? 'Dock panel' : 'Float panel'}
                    >
                        {isFloating ? <Dock className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-white/5 text-stardust-muted hover:text-stardust transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="px-4 pb-3">
                <div className="flex gap-1 p-1 bg-void-soft rounded-lg">
                    {(Object.keys(MODE_CONFIGS) as ArchitectMode[]).map((modeKey) => {
                        const config = MODE_CONFIGS[modeKey];
                        const isActive = mode === modeKey;

                        return (
                            <button
                                key={modeKey}
                                onClick={() => setMode(modeKey)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                    isActive
                                        ? 'bg-energy-teal/20 text-energy-teal border border-energy-teal/30'
                                        : 'text-stardust-muted hover:text-stardust hover:bg-white/5'
                                )}
                                title={config.description}
                            >
                                {MODE_ICONS[modeKey]}
                                <span>{config.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Context Chips */}
            <div className="px-4 pb-3 flex flex-wrap gap-2">
                {/* Project Chip */}
                {context.projectTitle && (
                    <ContextChip
                        label="Project"
                        value={context.projectTitle}
                        onRemove={() => mergeContext({ projectId: undefined, projectTitle: undefined })}
                    />
                )}

                {/* Output Type Chip */}
                <OutputTypeSelector
                    value={context.outputType}
                    onChange={(outputType) => mergeContext({ outputType })}
                />

                {/* Task Chip */}
                {context.taskDescription && (
                    <ContextChip
                        label="Task"
                        value={context.taskDescription.slice(0, 30) + (context.taskDescription.length > 30 ? '...' : '')}
                        onRemove={() => mergeContext({ taskId: undefined, taskDescription: undefined })}
                    />
                )}
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-3 flex gap-2">
                <button
                    onClick={onSave}
                    disabled={!canSave}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                        canSave
                            ? 'bg-void-soft hover:bg-white/5 text-stardust border border-glass-edge hover:border-glass-edge-bright'
                            : 'bg-void-soft/50 text-stardust-dim cursor-not-allowed border border-transparent'
                    )}
                >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                </button>
                <button
                    onClick={onRun}
                    disabled={!canRun}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                        canRun
                            ? 'bg-energy-teal text-void hover:bg-energy-teal/90 shadow-glow-teal-soft'
                            : 'bg-energy-teal/20 text-energy-teal/50 cursor-not-allowed'
                    )}
                >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run</span>
                </button>
            </div>
        </div>
    );
};

// ============================================================
// Context Chip Component
// ============================================================

interface ContextChipProps {
    label: string;
    value: string;
    onRemove?: () => void;
}

const ContextChip: React.FC<ContextChipProps> = ({ label, value, onRemove }) => (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-void-soft rounded-full text-xs border border-glass-edge">
        <span className="text-stardust-dim">{label}:</span>
        <span className="text-stardust">{value}</span>
        {onRemove && (
            <button
                onClick={onRemove}
                className="ml-0.5 p-0.5 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-3 h-3 text-stardust-muted" />
            </button>
        )}
    </div>
);

// ============================================================
// Output Type Selector
// ============================================================

interface OutputTypeSelectorProps {
    value?: OutputType;
    onChange: (type: OutputType) => void;
}

const OutputTypeSelector: React.FC<OutputTypeSelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1 bg-void-soft rounded-full text-xs border border-glass-edge hover:border-glass-edge-bright transition-colors"
            >
                <span className="text-stardust-dim">Output:</span>
                <span className="text-stardust">{value ? OUTPUT_TYPE_LABELS[value] : 'Any'}</span>
                <ChevronDown className="w-3 h-3 text-stardust-muted" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full mt-1 left-0 z-50 py-1 bg-void-elevated border border-glass-edge rounded-lg shadow-cosmic-sm min-w-[120px]">
                        {(Object.entries(OUTPUT_TYPE_LABELS) as [OutputType, string][]).map(([type, label]) => (
                            <button
                                key={type}
                                onClick={() => { onChange(type); setIsOpen(false); }}
                                className={cn(
                                    'w-full px-3 py-1.5 text-left text-xs transition-colors',
                                    value === type
                                        ? 'bg-energy-teal/10 text-energy-teal'
                                        : 'text-stardust hover:bg-white/5'
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PromptArchitectHeader;
