/**
 * TASK LAUNCH PANEL
 * One per Production Desk - entry point for starting work with Lyra
 */

import { ProductionDesk, ProductionDeskId } from '../../../domain/types';
import {
    Palette,
    Code,
    PenTool,
    BarChart3,
    Sparkles,
    ChevronRight,
} from 'lucide-react';

// ============================================
// Desk Icons
// ============================================

const DESK_ICONS: Record<ProductionDeskId, typeof Palette> = {
    'design': Palette,
    'code': Code,
    'write': PenTool,
    'analyze': BarChart3,
};

// ============================================
// Types
// ============================================

interface TaskLaunchPanelProps {
    desk: ProductionDesk;
    projectContext: {
        whatWereMaking?: string;
        audience?: string;
        constraints?: string[];
    };
    onStartWithLyra?: (deskId: ProductionDeskId) => void;
}

// ============================================
// Component
// ============================================

export function TaskLaunchPanel({ desk, projectContext, onStartWithLyra }: TaskLaunchPanelProps) {
    const DeskIcon = DESK_ICONS[desk.id];

    return (
        <div className="p-5 bg-white border border-zinc-200 rounded-sm hover:border-zinc-300 transition-colors group">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-zinc-100 rounded-full group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    <DeskIcon size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-zinc-900">{desk.label}</h3>
                    <p className="text-xs text-zinc-400">{desk.description}</p>
                </div>
            </div>

            {/* Context */}
            <div className="space-y-3 mb-4">
                {projectContext.whatWereMaking && (
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block mb-1">
                            What we're making
                        </span>
                        <p className="text-sm text-zinc-600">{projectContext.whatWereMaking}</p>
                    </div>
                )}

                {projectContext.audience && (
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block mb-1">
                            Audience
                        </span>
                        <p className="text-sm text-zinc-600">{projectContext.audience}</p>
                    </div>
                )}

                {projectContext.constraints && projectContext.constraints.length > 0 && (
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block mb-1">
                            Constraints
                        </span>
                        <ul className="space-y-1">
                            {projectContext.constraints.slice(0, 3).map((c, i) => (
                                <li key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* CTA */}
            <button
                onClick={() => onStartWithLyra?.(desk.id)}
                className="w-full p-3 bg-zinc-900 text-white rounded-sm flex items-center justify-center gap-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
                <Sparkles size={14} />
                Start with Lyra
                <ChevronRight size={14} />
            </button>
        </div>
    );
}
