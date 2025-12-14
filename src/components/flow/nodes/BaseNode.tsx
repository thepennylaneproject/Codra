import React, { memo, ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { usePromptArchitect } from '../../../lib/prompt-architect';
import { cn } from '../../../lib/utils';
import { AppNode } from '../../../types/flow';

interface BaseNodeProps {
    data: AppNode['data'];
    selected?: boolean;
    icon: ReactNode;
    color: 'magenta' | 'gold' | 'teal' | 'cream';
    title: string;
    inputs?: { id: string; label?: string }[];
    outputs?: { id: string; label?: string }[];
    children?: React.ReactNode;
}

// Color mapping for the new brand palette
const colorMap = {
    magenta: {
        bg: 'bg-brand-magenta/10',
        border: 'border-brand-magenta/40',
        text: 'text-brand-magenta',
        glow: 'glow-magenta'
    },
    gold: {
        bg: 'bg-brand-gold/10',
        border: 'border-brand-gold/40',
        text: 'text-brand-gold',
        glow: 'glow-gold'
    },
    teal: {
        bg: 'bg-brand-teal/10',
        border: 'border-brand-teal/40',
        text: 'text-brand-teal',
        glow: 'glow-teal'
    },
    cream: {
        bg: 'bg-brand-cream/10',
        border: 'border-brand-cream/40',
        text: 'text-brand-cream',
        glow: 'glow-gold'
    }
};

export const BaseNode = memo(({
    data,
    selected,
    icon,
    color,
    title,
    inputs = [],
    outputs = [],
    children
}: BaseNodeProps) => {
    const colors = colorMap[color];
    const { open: openPromptArchitect } = usePromptArchitect();

    // Handler to open Prompt Architect with node context
    const handleGeneratePrompt = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent node selection
        openPromptArchitect({
            taskDescription: `Generate prompt for ${data.label || title} node`,
            outputType: title.toLowerCase().includes('image') ? 'image' :
                title.toLowerCase().includes('text') ? 'copy' : 'code',
        });
    };

    return (
        <div className={cn(
            "min-w-[280px] bg-background-elevated/80 border-2 rounded-xl shadow-xl backdrop-blur-md transition-all duration-200",
            selected
                ? cn(`${colors.border} ring-2`, colors.glow)
                : cn(`border-border-subtle hover:${colors.border}`)
        )}>
            {/* Header */}
            <div className={cn(
                "px-4 py-3 border-b flex items-center gap-3 rounded-t-lg bg-background-default",
                `border-border-subtle`
            )}>
                <div className={cn(
                    "p-2 rounded-lg border shadow-inner",
                    colors.bg,
                    colors.border
                )}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-label-md font-semibold text-text-primary tracking-tight">
                        {data.label || title}
                    </h3>
                    <p className="text-label-sm text-text-muted mt-1">
                        {title}
                    </p>
                </div>
                {/* Generate button for AI nodes */}
                {(title.toLowerCase().includes('ai') || title.toLowerCase().includes('text') || title.toLowerCase().includes('image')) && (
                    <button
                        onClick={handleGeneratePrompt}
                        className="p-1 text-energy-teal/60 hover:text-energy-teal hover:bg-energy-teal/10 rounded transition-colors"
                        title="Generate with Prompt Architect"
                    >
                        <Sparkles className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Inputs (Left) */}
            <div className="absolute -left-3 top-16 flex flex-col gap-3">
                {inputs.map((input) => (
                    <div key={input.id} className="relative group">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={input.id}
                            className={cn(
                                "!w-3 !h-3 !bg-background-elevated !border-2 !border-border-strong transition-colors",
                                `group-hover:!border-${color} group-hover:!bg-background-default`
                            )}
                        />
                        {input.label && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-sm text-text-muted bg-background-elevated px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border-subtle pointer-events-none">
                                {input.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Outputs (Right) */}
            <div className="absolute -right-3 top-16 flex flex-col gap-3">
                {outputs.map((output) => (
                    <div key={output.id} className="relative group">
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={output.id}
                            className={cn(
                                "!w-3 !h-3 !bg-background-elevated !border-2 !border-border-strong transition-colors",
                                `group-hover:!border-${color} group-hover:!bg-background-default`
                            )}
                        />
                        {output.label && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body-sm text-text-muted bg-background-elevated px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border-subtle pointer-events-none">
                                {output.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {children}
            </div>
        </div>
    );
});

BaseNode.displayName = 'BaseNode';
