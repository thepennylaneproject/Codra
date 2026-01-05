/**
 * IMPORT CONTEXT MODAL
 * Confirmation modal for importing context from a past project
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ImportedContext } from './SimilarProjectsList';

interface ImportContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (editedContext: EditedContext) => void;
    sourceContext: ImportedContext;
}

export interface EditedContext {
    description: string;
    goals?: string[];
    audience?: string;
}

export const ImportContextModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    sourceContext 
}: ImportContextModalProps) => {
    const [description, setDescription] = useState(sourceContext.description);
    const [audience, setAudience] = useState(sourceContext.audience || '');
    const [goalsText, setGoalsText] = useState(sourceContext.goals?.join(', ') || '');
    
    if (!isOpen) return null;
    
    const handleConfirm = () => {
        const goals = goalsText
            .split(',')
            .map(g => g.trim())
            .filter(g => g.length > 0);
        
        onConfirm({
            description,
            goals: goals.length > 0 ? goals : undefined,
            audience: audience || undefined,
        });
    };
    
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-[#1A1A1A]/40 flex items-center justify-center p-6 z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-[#FFFAF0] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-[#1A1A1A]/10">
                    <div>
                        <h2 className="text-lg font-medium text-text-primary mb-1">
                            Context import from "{sourceContext.projectName}"
                        </h2>
                        <p className="text-sm text-text-soft">
                            Review and edit the context before importing
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#1A1A1A]/5 rounded transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} className="text-text-soft" />
                    </button>
                </div>
                
                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Project Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded bg-white text-text-primary placeholder:text-text-soft focus:outline-none focus:border-[#1A1A1A]/40 resize-none"
                            placeholder="Describe your project..."
                        />
                    </div>
                    
                    {/* Audience */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Target Audience
                        </label>
                        <input
                            type="text"
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded bg-white text-text-primary placeholder:text-text-soft focus:outline-none focus:border-[#1A1A1A]/40"
                            placeholder="Who is this for?"
                        />
                    </div>
                    
                    {/* Goals */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Project Goals
                        </label>
                        <input
                            type="text"
                            value={goalsText}
                            onChange={(e) => setGoalsText(e.target.value)}
                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded bg-white text-text-primary placeholder:text-text-soft focus:outline-none focus:border-[#1A1A1A]/40"
                            placeholder="goal 1, goal 2, goal 3..."
                        />
                        <p className="text-xs text-text-soft mt-1">
                            Separate multiple goals with commas
                        </p>
                    </div>
                    
                    <div className="bg-[#1A1A1A]/5 rounded p-3">
                        <p className="text-xs text-text-soft">
                            All fields are editable. Your new project name will be used instead of "{sourceContext.projectName}".
                        </p>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-[#1A1A1A]/10">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="text-text-secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="primary"
                    >
                        Use This Context
                    </Button>
                </div>
            </div>
        </div>
    );
};
