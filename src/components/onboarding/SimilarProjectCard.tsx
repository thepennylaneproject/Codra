/**
 * SIMILAR PROJECT CARD
 * Compact card displaying a similar past project with match score
 */

import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import type { ScoredProject } from '@/lib/context-similarity';

interface SimilarProjectCardProps {
    project: ScoredProject;
    onImport: () => void;
}

/**
 * Get color class for match score badge
 */
function getScoreColor(score: number): string {
    if (score >= 0.8) return 'text-emerald-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-text-secondary';
}

/**
 * Get type badge display text
 */
function getTypeLabel(type: string | null): string {
    if (!type) return 'Custom';
    
    const labels: Record<string, string> = {
        'campaign': 'Campaign',
        'product': 'Product',
        'content': 'Content',
        'custom': 'Custom',
    };
    
    return labels[type] || type;
}

export const SimilarProjectCard = memo<SimilarProjectCardProps>(({ project, onImport }) => {
    const scorePercentage = Math.round(project.matchScore * 100);
    const scoreColor = getScoreColor(project.matchScore);
    const typeLabel = getTypeLabel(project.type);
    
    return (
        <div className="flex justify-between items-center p-3 bg-white border border-[#1A1A1A]/10 rounded hover:border-[#1A1A1A]/20 transition-all group">
            <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                        {project.name}
                    </p>
                    <span className="text-xs px-2 py-0.5 bg-[#1A1A1A]/5 text-text-soft rounded flex-shrink-0">
                        {typeLabel}
                    </span>
                </div>
                <p className="text-xs text-text-soft">
                    {project.matchReason}
                </p>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-sm font-medium ${scoreColor}`}>
                    {scorePercentage}% match
                </span>
                <Button
                    onClick={onImport}
                    size="sm"
                    variant="ghost"
                    className="border border-[#1A1A1A]/20 text-text-primary hover:bg-[#1A1A1A]/5"
                >
                    Import Context
                </Button>
            </div>
        </div>
    );
});

SimilarProjectCard.displayName = 'SimilarProjectCard';
