/**
 * NAME SUGGESTIONS
 * AI-generated name suggestions component
 */

import React, { useState } from 'react';
import { Sparkles, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { nameGenerator, NameSuggestion } from '../../../lib/naming/name-generator';
import type { NamingScope, NamingTargetType } from '../../../types/architect';

interface NameSuggestionsProps {
    projectId: string;
    kind: NamingTargetType;
    scope: NamingScope;
    description: string;
    existingNames?: string[];
    onSelect: (name: string) => void;
    className?: string;
}

export const NameSuggestions: React.FC<NameSuggestionsProps> = ({
    projectId,
    kind,
    scope,
    description,
    existingNames = [],
    onSelect,
    className = '',
}) => {
    const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateNames = async () => {
        if (!description) {
            setError('Please provide a description first');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const results = await nameGenerator.generate(
                projectId,
                kind,
                scope,
                description,
                existingNames
            );
            setSuggestions(results);
        } catch (err) {
            setError('Failed to generate names');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`p-4 bg-background-subtle rounded-lg border border-border-subtle space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-label-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-purple" />
                    AI Suggestions
                </h3>
                <button
                    onClick={generateNames}
                    disabled={loading || !description}
                    className="text-body-xs text-brand-teal hover:text-brand-teal/80 disabled:opacity-50 flex items-center gap-1"
                >
                    {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3 h-3" />
                    )}
                    {suggestions.length > 0 ? 'Regenerate' : 'Generate'}
                </button>
            </div>

            {!description && (
                <p className="text-body-xs text-text-muted italic">
                    Enter a description to get suggestions
                </p>
            )}

            {error && (
                <p className="text-body-xs text-state-error">{error}</p>
            )}

            {loading && (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-background-default animate-pulse rounded-md" />
                    ))}
                </div>
            )}

            {!loading && suggestions.length > 0 && (
                <div className="space-y-2">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(suggestion.name)}
                            className="w-full text-left p-2 bg-background-default hover:bg-background-hover border border-border-subtle rounded-md group transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-body-sm text-text-primary group-hover:text-brand-teal transition-colors">
                                    {suggestion.name}
                                </span>
                                <Plus className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-body-xs text-text-muted mt-1">
                                {suggestion.reasoning}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
