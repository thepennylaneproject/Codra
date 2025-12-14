/**
 * PROMPT ARCHITECT - Intent Input
 * src/components/prompt-architect/IntentInput.tsx
 * 
 * Plain-language intent capture with no AI jargon
 */

import React, { useRef, useEffect, useState } from 'react';
import { Lightbulb, Paperclip, X } from 'lucide-react';
import { usePromptArchitectStore } from '../../lib/prompt-architect';
import { AssetPicker } from '../assets/AssetPicker';
import type { Asset, AssetRef } from '../../types/shared';
import { cn } from '../../lib/utils';

// ============================================================
// Component
// ============================================================

export const IntentInput: React.FC = () => {
    const intent = usePromptArchitectStore(state => state.intent);
    const setIntent = usePromptArchitectStore(state => state.setIntent);
    const context = usePromptArchitectStore(state => state.context);
    const mergeContext = usePromptArchitectStore(state => state.mergeContext);
    const generatePrompt = usePromptArchitectStore(state => state.generatePrompt);
    const status = usePromptArchitectStore(state => state.status);
    const isGenerating = usePromptArchitectStore(state => state.isGenerating);

    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [intent]);

    // Handle key events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Cmd/Ctrl + Enter to generate
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!isGenerating && intent.trim()) {
                generatePrompt();
            }
        }
    };

    const handleAssetsSelected = (selection: Asset | Asset[]) => {
        const newAssets = Array.isArray(selection) ? selection : [selection];
        const assetRefs: AssetRef[] = newAssets.map(a => ({
            id: a.id,
            type: a.type,
            url: a.publicUrl,
            name: a.name,
            mimeType: a.mimeType,
            source: 'import'
        }));

        const currentAssets = context.assets || [];
        // Dedup by ID
        const merged = [...currentAssets, ...assetRefs].filter((v, i, a) =>
            a.findIndex(t => t.id === v.id) === i
        );

        mergeContext({ assets: merged });
        setShowAssetPicker(false);
    };

    const removeAsset = (assetId: string) => {
        if (!context.assets) return;
        mergeContext({
            assets: context.assets.filter(a => a.id !== assetId)
        });
    };

    const charCount = intent.length;
    const isNearLimit = charCount > 800;

    return (
        <div className="p-4 border-b border-glass-edge">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-energy-gold" />
                    <span className="text-xs font-medium text-stardust-muted uppercase tracking-wide">
                        What do you want to create?
                    </span>
                </div>
                <button
                    onClick={() => setShowAssetPicker(true)}
                    className="flex items-center gap-1.5 text-[11px] text-stardust-dim hover:text-energy-teal transition-colors"
                >
                    <Paperclip className="w-3 h-3" />
                    Attach Context
                </button>
            </div>

            {/* Input Area */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what you want to create or accomplish…"
                    disabled={isGenerating}
                    className={cn(
                        'w-full bg-void-soft border border-glass-edge rounded-lg px-4 py-3',
                        'text-sm text-stardust placeholder:text-stardust-dim',
                        'focus:outline-none focus:border-energy-teal/50 focus:ring-1 focus:ring-energy-teal/20',
                        'transition-all resize-none min-h-[80px]',
                        'custom-scrollbar',
                        isGenerating && 'opacity-60 cursor-not-allowed'
                    )}
                    rows={3}
                />

                {/* Character Count */}
                <div className={cn(
                    'absolute bottom-2 right-2 text-[10px]',
                    isNearLimit ? 'text-energy-amber' : 'text-stardust-dim'
                )}>
                    {charCount > 0 && `${charCount} chars`}
                </div>
            </div>

            {/* Attached Assets */}
            {context.assets && context.assets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {context.assets.map(asset => (
                        <div
                            key={asset.id}
                            className="flex items-center gap-2 px-2 py-1 bg-void border border-glass-edge rounded text-[11px] text-stardust max-w-[200px]"
                        >
                            <span className="truncate">{asset.name || 'Untitled Asset'}</span>
                            <button
                                onClick={() => removeAsset(asset.id)}
                                className="text-stardust-dim hover:text-energy-red transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Hint */}
            <p className="mt-2 text-[11px] text-stardust-dim">
                Press <kbd className="px-1 py-0.5 bg-void-soft rounded text-stardust-muted">⌘↵</kbd> to generate prompt
            </p>

            {/* Quick Suggestions (when empty) */}
            {!intent && status === 'idle' && (
                <div className="mt-4">
                    <p className="text-[11px] text-stardust-dim mb-2">Quick starts:</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => setIntent(suggestion)}
                                className="px-2 py-1 text-[11px] bg-void-soft border border-glass-edge rounded-md text-stardust-muted hover:text-stardust hover:border-glass-edge-bright transition-all"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Asset Picker Modal */}
            {showAssetPicker && (
                <AssetPicker
                    workspaceId="placeholder-workspace-id" // In real app, get from store/context
                    onSelect={handleAssetsSelected}
                    onClose={() => setShowAssetPicker(false)}
                    allowMultiple={true}
                />
            )}
        </div>
    );
};

// ============================================================
// Quick Suggestions
// ============================================================

const QUICK_SUGGESTIONS = [
    'Create a landing page hero section',
    'Write an API endpoint for user auth',
    'Design an icon for notifications',
    'Draft copy for a product launch email',
];

export default IntentInput;
