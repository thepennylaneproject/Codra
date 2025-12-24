/**
 * EDITORIAL NOTES PANEL
 * Generated summary of project intent in neutral, editorial voice
 * No metaphors - clear, scannable
 */

import { SpreadSection as SpreadSectionType } from '../../../domain/types';
import { FileText, Edit2 } from 'lucide-react';

// ============================================
// Types
// ============================================

interface EditorialNotesPanelProps {
    section: SpreadSectionType;
    editable?: boolean;
    onEdit?: () => void;
}

// ============================================
// Component
// ============================================

export function EditorialNotesPanel({ section, editable = false, onEdit }: EditorialNotesPanelProps) {
    const content = section.content as {
        summary?: string;
        keyPoints?: string[];
        audience?: string;
        tone?: string;
    };

    return (
        <div className="p-6 bg-white border border-zinc-200 rounded-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-zinc-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        Editorial Notes
                    </span>
                </div>
                {editable && onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={12} />
                    </button>
                )}
            </div>

            {/* Summary */}
            {content.summary && (
                <p className="text-sm text-zinc-700 leading-relaxed mb-4">
                    {content.summary}
                </p>
            )}

            {/* Key Points */}
            {content.keyPoints && content.keyPoints.length > 0 && (
                <div className="mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block mb-2">
                        Key Points
                    </span>
                    <ul className="space-y-2">
                        {content.keyPoints.map((point, i) => (
                            <li key={i} className="flex gap-3 text-sm text-zinc-600">
                                <span className="text-zinc-300 font-mono text-xs mt-0.5">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-6 pt-4 border-t border-zinc-100">
                {content.audience && (
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block mb-1">
                            Audience
                        </span>
                        <span className="text-xs text-zinc-600">{content.audience}</span>
                    </div>
                )}
                {content.tone && (
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block mb-1">
                            Tone
                        </span>
                        <span className="text-xs text-zinc-600">{content.tone}</span>
                    </div>
                )}
                <div className="ml-auto">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${section.source === 'onboarding'
                            ? 'bg-blue-50 text-blue-600'
                            : section.source === 'tear_sheet'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-zinc-100 text-zinc-500'
                        }`}>
                        From {section.source.replace('_', ' ')}
                    </span>
                </div>
            </div>
        </div>
    );
}
