import React from 'react';
import { Edit2, Copy, Trash2, Star, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Prompt } from '../../types/prompt';

interface PromptCardProps {
    prompt: Prompt;
    onEdit: (id: string) => void;
    onFork: (id: string) => void;
    onDelete: (id: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onEdit, onFork, onDelete }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/prompts/${prompt.id}`);
    };

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation(); // Prevent card click when clicking action buttons
        action();
    };

    return (
        <div
            onClick={handleCardClick}
            className="bg-surface-card border border-border-subtle rounded-xl p-4 hover:border-brand-magenta/50 hover:shadow-lg hover:shadow-brand-magenta/10 transition-all group relative cursor-pointer"
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">{prompt.name}</h3>
                    <p className="text-sm text-text-muted line-clamp-2">{prompt.description}</p>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => handleActionClick(e, () => onEdit(prompt.id))}
                        className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-indigo-400 transition-colors"
                        title="Edit Prompt"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => handleActionClick(e, () => onFork(prompt.id))}
                        className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-emerald-400 transition-colors"
                        title="Fork Prompt"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => handleActionClick(e, () => onDelete(prompt.id))}
                        className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-red-400 transition-colors"
                        title="Delete Prompt"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Variables Preview */}
            <div className="flex flex-wrap gap-2 mb-4">
                {prompt.variables.map((v) => (
                    <span
                        key={v.name}
                        className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono"
                    >
                        {`{{${v.name}}}`}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{prompt.usageCount} uses</span>
                    </div>
                    {prompt.averageRating && (
                        <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                            <span>{prompt.averageRating}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>v{prompt.currentVersion}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {prompt.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
