/**
 * SPREAD SECTION
 * Reusable section wrapper component for the Spread
 */

import { useState } from 'react';
import { SpreadSection as SpreadSectionType, SpreadSectionSource } from '../../domain/types';
import {
    ChevronDown,
    ChevronRight,
    Edit2,
    Check,
    FileText,
    Users,
    Target,
    AlertTriangle,
    Palette,
    Layout,
    List,
    Box,
    StickyNote,
    LucideIcon,
    MoreHorizontal,
    Share2,
} from 'lucide-react';

import { VisualDirectionSection } from './sections/VisualDirectionSection';
import { GoalsSection } from './sections/GoalsSection';
import { ComponentsSection } from './sections/ComponentsSection';

interface SpreadSectionProps {
    section: SpreadSectionType;
    isActive?: boolean;
    onUpdate?: (sectionId: string, content: Record<string, unknown>) => void;
}

// Icon mapping for section types
const SECTION_ICONS: Record<SpreadSectionType['type'], LucideIcon> = {
    overview: FileText,
    audience: Users,
    goals: Target,
    constraints: AlertTriangle,
    visual_direction: Palette,
    layout_direction: Layout,
    content_outline: List,
    components_or_assets: Box,
    notes: StickyNote,
};

// Source badge colors
const SOURCE_COLORS: Record<SpreadSectionSource, { bg: string; text: string }> = {
    onboarding: { bg: 'bg-blue-50', text: 'text-blue-600' },
    tear_sheet: { bg: 'bg-rose-50', text: 'text-rose-600' },
    moodboard: { bg: 'bg-purple-50', text: 'text-purple-600' },
    inferred: { bg: 'bg-zinc-100', text: 'text-zinc-500' },
    manual: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

export function SpreadSection({ section, isActive, onUpdate }: SpreadSectionProps) {
    const [isCollapsed, setIsCollapsed] = useState(section.collapsed ?? false);
    const [isEditing, setIsEditing] = useState(false);

    const Icon = SECTION_ICONS[section.type];
    const sourceColor = SOURCE_COLORS[section.source];

    return (
        <section
            id={`section-${section.id}`}
            className={`
                mb-8 scroll-mt-20
                ${isActive ? 'ring-2 ring-rose-200 ring-offset-4' : ''}
            `}
        >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Collapse Toggle (for constraints) */}
                    {section.type === 'constraints' && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1 hover:bg-zinc-100 rounded transition-colors"
                        >
                            {isCollapsed ? (
                                <ChevronRight size={16} className="text-zinc-400" />
                            ) : (
                                <ChevronDown size={16} className="text-zinc-400" />
                            )}
                        </button>
                    )}

                    {/* Icon */}
                    <Icon size={16} className="text-rose-500" />

                    {/* Title */}
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">
                        {section.title}
                    </h3>

                    {/* Source Badge */}
                    <span className={`
                        px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full
                        ${sourceColor.bg} ${sourceColor.text}
                    `}>
                        {section.source.replace('_', ' ')}
                    </span>

                    {/* Status Badge */}
                    <span className={`
                        px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full
                        ${section.status === 'draft' ? 'bg-amber-50 text-amber-600' :
                            section.status === 'ready' ? 'bg-green-50 text-green-600' :
                                'bg-zinc-100 text-zinc-500'}
                    `}>
                        {section.status}
                    </span>
                </div>

                {/* Section Toolbar */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                        <Share2 size={14} />
                    </button>
                    <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                        <MoreHorizontal size={14} />
                    </button>
                </div>

                {/* Edit Toggle */}
                {section.editable && (
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`
                            p-1.5 rounded transition-colors
                            ${isEditing
                                ? 'bg-zinc-900 text-white'
                                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
                            }
                        `}
                    >
                        {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                    </button>
                )}
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-400 mb-4 italic">
                {section.description}
            </p>

            {/* Content (collapsible for constraints) */}
            {!isCollapsed && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-inner">
                    {renderSectionContent(section, isEditing, onUpdate)}
                </div>
            )}
        </section>
    );
}

/**
 * Render section content based on type
 */
function renderSectionContent(
    section: SpreadSectionType,
    isEditing: boolean,
    onUpdate?: (sectionId: string, content: Record<string, unknown>) => void
) {
    const content = section.content;

    switch (section.type) {
        case 'overview':
            return (
                <div className="space-y-4">
                    <div>
                        <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                            Summary
                        </span>
                        <p className="text-sm text-zinc-700 leading-relaxed">
                            {content.summary as string || 'No summary provided.'}
                        </p>
                    </div>
                    {Boolean(content.oneLineGoal) && (
                        <div>
                            <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                                Core Goal
                            </span>
                            <p className="text-sm text-zinc-700 italic">
                                "{String(content.oneLineGoal)}"
                            </p>
                        </div>
                    )}
                    <div>
                        <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                            Stage
                        </span>
                        <span className="inline-block px-2 py-1 text-xs bg-white border border-zinc-200 rounded">
                            {content.currentStage as string}
                        </span>
                    </div>
                </div>
            );

        case 'audience':
            return (
                <div className="space-y-4">
                    <div>
                        <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                            Primary Audience
                        </span>
                        <span className="inline-block px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-full">
                            {content.primaryAudience as string}
                        </span>
                    </div>
                    {(content.secondaryAudiences as string[])?.length > 0 && (
                        <div>
                            <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-2 font-bold">
                                Secondary Audiences
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {(content.secondaryAudiences as string[]).map((audience, i) => (
                                    <span key={i} className="px-2.5 py-1 text-xs bg-zinc-100 text-zinc-600 rounded-full">
                                        {audience}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                            Desired Emotional Response
                        </span>
                        <p className="text-sm text-zinc-700">
                            {content.desiredEmotionalResponse as string}
                        </p>
                    </div>
                </div>
            );

        case 'goals':
            return <GoalsSection content={content} isEditing={isEditing} onUpdate={(newContent) => onUpdate?.(section.id, newContent)} />;

        case 'constraints':
            return (
                <div className="space-y-4">
                    {(content.mustAvoids as string[])?.length > 0 && (
                        <div>
                            <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-2 font-bold">
                                Must Avoid
                            </span>
                            <ul className="space-y-1.5">
                                {(content.mustAvoids as string[]).map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {Boolean(content.brandAssets) && (
                        <div>
                            <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                                Existing Brand Assets
                            </span>
                            <span className="text-sm text-zinc-700">{String(content.brandAssets)}</span>
                        </div>
                    )}
                    <div className="flex gap-6">
                        {Boolean(content.riskTolerance) && (
                            <div>
                                <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                                    Risk Tolerance
                                </span>
                                <span className="text-sm text-zinc-700">{String(content.riskTolerance)}</span>
                            </div>
                        )}
                        {(content.approvalRequired as string[])?.length > 0 && (
                            <div>
                                <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                                    Requires Approval
                                </span>
                                <span className="text-sm text-zinc-700">
                                    {(content.approvalRequired as string[]).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case 'visual_direction':
            return <VisualDirectionSection content={content} isEditing={isEditing} onUpdate={(newContent) => onUpdate?.(section.id, newContent)} />;

        case 'layout_direction':
            return (
                <div className="space-y-4">
                    <div className="flex gap-8">
                        {Boolean(content.layoutTendency) && (
                            <div>
                                <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                                    Layout Tendency
                                </span>
                                <span className="inline-block px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-full">
                                    {String(content.layoutTendency)}
                                </span>
                            </div>
                        )}
                        {Boolean(content.emphasis) && (
                            <div>
                                <span className="block text-[10px] uppercase tracking-wide text-zinc-400 mb-1 font-bold">
                                    Emphasis
                                </span>
                                <span className="inline-block px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-full">
                                    {String(content.emphasis)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case 'content_outline':
            const outline = content.outline as { item: string; suggested: boolean }[] || [];
            return (
                <div>
                    {Boolean(content.useCase) && (
                        <p className="text-xs text-zinc-500 mb-4">
                            Suggested for: <span className="font-medium text-zinc-700">{String(content.useCase)}</span>
                        </p>
                    )}
                    <ol className="space-y-2">
                        {outline.map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-zinc-700">
                                <span className="font-mono text-zinc-400 text-xs w-6">{i + 1}.</span>
                                <span>{item.item}</span>
                                {item.suggested && (
                                    <span className="text-[9px] text-zinc-400 uppercase tracking-wide">suggested</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            );

        case 'components_or_assets':
            return <ComponentsSection content={content} isEditing={isEditing} onUpdate={(newContent) => onUpdate?.(section.id, newContent)} />;

        case 'notes':
            return (
                <textarea
                    defaultValue={content.notes as string || ''}
                    placeholder="Add notes here..."
                    className="w-full min-h-[120px] p-0 bg-transparent text-sm text-zinc-700 placeholder:text-zinc-300 focus:outline-none resize-none"
                />
            );

        default:
            return (
                <pre className="text-xs text-zinc-500 overflow-auto">
                    {JSON.stringify(content, null, 2)}
                </pre>
            );
    }
}
