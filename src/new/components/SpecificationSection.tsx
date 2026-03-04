/**
 * SPECIFICATION SECTION
 * Reusable section wrapper component for the Specification
 */

import { useState } from 'react';
import { SpecificationSection as SpecificationSectionType } from '../../domain/types';
import {
    ChevronDown,
    ChevronRight,
    Edit2,
    Check,
} from 'lucide-react';

import { VisualDirectionSection } from './sections/VisualDirectionSection';
import { GoalsSection } from './sections/GoalsSection';
import { ComponentsSection } from './sections/ComponentsSection';
import { Button } from '@/components/ui/Button';
import { OutputBlock } from './OutputBlock';

interface SpecificationSectionProps {
    section: SpecificationSectionType;
    isActive?: boolean;
    onUpdate?: (sectionId: string, content: Record<string, unknown>) => void;
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    ready: 'Verified',
};

export function SpecificationSection({ section, isActive, onUpdate }: SpecificationSectionProps) {
    const [isCollapsed, setIsCollapsed] = useState(section.collapsed ?? false);
    const [isEditing, setIsEditing] = useState(false);

    const statusLabel = STATUS_LABELS[section.status] || 'Needs review';

    return (
        <OutputBlock
            title={section.title}
            status={statusLabel}
            footer={
                <span className="uppercase tracking-wider text-[10px] text-text-soft">
                    Source: {section.source.replace('_', ' ')}
                </span>
            }
            className={isActive ? 'ring-1 ring-zinc-200' : ''}
        >
            <div className="space-y-[var(--space-sm)]">
                <div className="flex items-center justify-between gap-[var(--space-md)]">
                    <div className="flex items-center gap-2">
                        {section.type === 'constraints' && (
                            <Button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-1 hover:bg-zinc-100 rounded transition-colors"
                                aria-label="Toggle constraints"
                            >
                                {isCollapsed ? (
                                    <ChevronRight size={14} className="text-text-soft" />
                                ) : (
                                    <ChevronDown size={14} className="text-text-soft" />
                                )}
                            </Button>
                        )}
                        {section.description && (
                            <p className="text-xs text-text-soft italic">{section.description}</p>
                        )}
                    </div>

                    {section.editable && (
                        <Button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`
                                p-1 rounded transition-colors
                                ${isEditing
                                    ? 'bg-zinc-900 text-white'
                                    : 'text-text-soft hover:text-text-primary hover:bg-zinc-100'
                                }
                            `}
                            aria-label={isEditing ? 'Save section' : 'Edit section'}
                        >
                            {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                        </Button>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="pt-[var(--space-xs)]">
                        {renderSectionContent(section, isEditing, onUpdate)}
                    </div>
                )}
            </div>
        </OutputBlock>
    );
}

/**
 * Render section content based on type
 */
function renderSectionContent(
    section: SpecificationSectionType,
    isEditing: boolean,
    onUpdate?: (sectionId: string, content: Record<string, unknown>) => void
) {
    const content = section.content;

    switch (section.type) {
        case 'overview':
            return (
                <div className="space-y-4">
                    <div>
                        <span className="block text-xs text-zinc-400 mb-1 font-semibold">Summary</span>
                        <p className="text-sm text-zinc-700 leading-relaxed">
                            {content.summary as string || 'No summary provided.'}
                        </p>
                    </div>
                    {Boolean(content.oneLineGoal) && (
                        <div>
                            <span className="block text-xs text-zinc-400 mb-1 font-semibold">Core Goal</span>
                            <p className="text-sm text-zinc-700 italic">
                                &quot;{String(content.oneLineGoal)}&quot;
                            </p>
                        </div>
                    )}
                    <div>
                        <span className="block text-xs text-zinc-400 mb-1 font-semibold">Stage</span>
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
                        <span className="block text-xs text-zinc-400 mb-1 font-semibold">Primary Audience</span>
                        <span className="inline-block px-3 py-1 text-sm bg-white border border-zinc-200 rounded-full">
                            {content.primaryAudience as string}
                        </span>
                    </div>
                    {(content.secondaryAudiences as string[])?.length > 0 && (
                        <div>
                            <span className="block text-xs text-zinc-400 mb-2 font-semibold">Secondary Audiences</span>
                            <div className="flex flex-wrap gap-1">
                                {(content.secondaryAudiences as string[]).map((audience, i) => (
                                    <span key={i} className="px-2 py-1 text-xs bg-zinc-100 text-zinc-600 rounded-full">
                                        {audience}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <span className="block text-xs text-zinc-400 mb-1 font-semibold">Desired Emotional Response</span>
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
                            <span className="block text-xs text-zinc-400 mb-2 font-semibold">Must Avoid</span>
                            <ul className="space-y-1">
                                {(content.mustAvoids as string[]).map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {Boolean(content.brandAssets) && (
                        <div>
                            <span className="block text-xs text-zinc-400 mb-1 font-semibold">Brand Assets</span>
                            <span className="text-sm text-zinc-700">{String(content.brandAssets)}</span>
                        </div>
                    )}
                    <div className="flex gap-6">
                        {Boolean(content.riskTolerance) && (
                            <div>
                                <span className="block text-xs text-zinc-400 mb-1 font-semibold">Risk Tolerance</span>
                                <span className="text-sm text-zinc-700">{String(content.riskTolerance)}</span>
                            </div>
                        )}
                        {(content.approvalRequired as string[])?.length > 0 && (
                            <div>
                                <span className="block text-xs text-zinc-400 mb-1 font-semibold">Approval Required</span>
                                <span className="text-sm text-zinc-700">{(content.approvalRequired as string[]).join(', ')}</span>
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
                                <span className="block text-xs text-zinc-400 mb-1 font-semibold">Layout Tendency</span>
                                <span className="inline-block px-3 py-1 text-sm bg-white border border-zinc-200 rounded-full">
                                    {String(content.layoutTendency)}
                                </span>
                            </div>
                        )}
                        {Boolean(content.emphasis) && (
                            <div>
                                <span className="block text-xs text-zinc-400 mb-1 font-semibold">Emphasis</span>
                                <span className="inline-block px-3 py-1 text-sm bg-white border border-zinc-200 rounded-full">
                                    {String(content.emphasis)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case 'content_outline': {
            const outline = (content.outline as { item: string; suggested: boolean }[]) || [];
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
                                    <span className="text-xs text-zinc-400">suggested</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            );
        }

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
