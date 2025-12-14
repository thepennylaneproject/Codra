/**
 * NEXT STEPS PANEL
 * Persistent panel showing 1-3 smart suggestions
 * Answers: "What's the best next action for me?"
 */

import React from 'react';
import {
    ArrowRight,
    ClipboardCheck,
    GitBranch,
    Play,
    Palette,
    CheckCircle,
    Archive,
    Sparkles,
} from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import type { NextAction } from '../../lib/briefing';

interface NextStepsPanelProps {
    actions: NextAction[];
    onActionClick: (action: NextAction) => void;
    isNonTechnical?: boolean;
}

const ACTION_ICONS: Record<NextAction['type'], React.ElementType> = {
    claim_task: ClipboardCheck,
    create_flow: GitBranch,
    run_flow: Play,
    generate_asset: Palette,
    review: CheckCircle,
    archive: Archive,
};

const ACTION_COLORS: Record<NextAction['type'], string> = {
    claim_task: 'bg-energy-teal/20 text-energy-teal',
    create_flow: 'bg-energy-magenta/20 text-energy-magenta',
    run_flow: 'bg-energy-gold/20 text-energy-gold',
    generate_asset: 'bg-purple-500/20 text-purple-400',
    review: 'bg-green-500/20 text-green-400',
    archive: 'bg-gray-500/20 text-gray-400',
};

export const NextStepsPanel: React.FC<NextStepsPanelProps> = ({
    actions,
    onActionClick,
    isNonTechnical = false,
}) => {
    if (actions.length === 0) {
        return (
            <GlassPanel variant="primary" className="p-5" data-tour="next-steps">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-energy-teal" />
                    <h3 className="text-label-md text-text-primary font-semibold">
                        Next Steps
                    </h3>
                </div>
                <p className="text-body-sm text-text-muted">
                    {isNonTechnical
                        ? "Looking good! No urgent actions right now."
                        : "Project is in good shape. No urgent actions."
                    }
                </p>
            </GlassPanel>
        );
    }

    return (
        <GlassPanel variant="primary" className="p-5" data-tour="next-steps">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-energy-teal" />
                <h3 className="text-label-md text-text-primary font-semibold">
                    Next Steps
                </h3>
            </div>

            {/* Actions List */}
            <div className="space-y-2">
                {actions.map((action) => {
                    const Icon = ACTION_ICONS[action.type];
                    const colorClass = ACTION_COLORS[action.type];

                    return (
                        <button
                            key={action.id}
                            onClick={() => onActionClick(action)}
                            className="w-full group flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
                        >
                            <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-body-sm text-text-primary font-medium group-hover:text-energy-teal transition-colors">
                                    {action.label}
                                </p>
                                <p className="text-label-xs text-text-muted mt-0.5 truncate">
                                    {action.description}
                                </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-energy-teal group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                        </button>
                    );
                })}
            </div>
        </GlassPanel>
    );
};

export default NextStepsPanel;
