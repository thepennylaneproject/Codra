/**
 * LYRA PANEL - SIMPLIFIED
 * Single-purpose suggestion panel showing ONE recommended action at a time
 */

import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useLyraOptional } from '../../lib/lyra';
import { X, Sparkles } from 'lucide-react';
import { LyraAvatar } from './LyraAvatar';
import {
    LyraSuggestion,
    LyraClarification,
    LyraInput,
    useLyraSuggestion,
    useLyraExecution,
} from './lyra';

// ============================================
// Main Component
// ============================================

interface LyraPanelProps {
    spreadId?: string;
    deskId?: string;
}

export function LyraPanel({ spreadId, deskId }: LyraPanelProps) {
    const lyra = useLyraOptional();
    const { suggestion, isLoading, refresh } = useLyraSuggestion(spreadId, deskId);
    const { execute, isExecuting } = useLyraExecution();
    const [isDismissed, setIsDismissed] = useState(false);

    // Handle task execution
    const handleExecute = useCallback(async (taskId: string) => {
        const result = await execute(taskId);

        if (result.success) {
            // Refresh suggestions after successful execution
            refresh();
            setIsDismissed(false);
        } else {
            console.error('Execution failed:', result.error);
        }
    }, [execute, refresh]);

    // Handle dismissal
    const handleDismiss = useCallback(() => {
        setIsDismissed(true);
    }, []);

    // Handle clarification selection
    const handleClarificationSelect = useCallback((value: string) => {
        console.log('Clarification selected:', value);
        // TODO: Send selection to backend and refresh suggestions
        refresh();
    }, [refresh]);

    // Handle user input submission
    const handleInputSubmit = useCallback((input: string) => {
        console.log('User input:', input);
        // TODO: Send input to backend and refresh suggestions
        setIsDismissed(false);
        refresh();
    }, [refresh]);

    // If Lyra context isn't available, show a minimal placeholder
    if (!lyra) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#12121A]">
                <Sparkles size={32} className="text-zinc-600 mb-4" />
                <p className="text-sm text-zinc-500">Lyra will appear once your project is set up.</p>
            </div>
        );
    }

    const { state, hide } = lyra;

    // Don't render if hidden
    if (!state.visible) {
        return null;
    }

    // Determine which state to show
    const shouldShowIdle = isDismissed || suggestion?.type === 'idle';
    const shouldShowThinking = isLoading && !suggestion;

    return (
        <div className="h-full flex flex-col bg-[#12121A]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-bold tracking-tight text-zinc-200">Lyra</span>
                <button
                    onClick={hide}
                    className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Hide Lyra"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center gap-6">
                    {/* Static Avatar */}
                    <div className={`relative ${suggestion?.type === 'suggestion' ? 'ring-1 ring-[#FF6B6B]' : ''} rounded-full`}>
                        <LyraAvatar
                            appearance={state.appearance}
                            size={48}
                            showGlow={false}
                        />
                    </div>

                    {/* Dynamic Content */}
                    <div className="w-full">
                        <AnimatePresence mode="wait">
                            {/* Thinking State */}
                            {shouldShowThinking && (
                                <div key="thinking" className="flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-[#FF6B6B] rounded-full animate-spin" />
                                    <p className="text-xs text-zinc-500">Thinking...</p>
                                </div>
                            )}

                            {/* Suggestion State */}
                            {!shouldShowThinking && suggestion?.type === 'suggestion' && suggestion.action && !isDismissed && (
                                <LyraSuggestion
                                    key="suggestion"
                                    text={suggestion.text}
                                    action={suggestion.action}
                                    onExecute={handleExecute}
                                    onDismiss={handleDismiss}
                                    isExecuting={isExecuting}
                                />
                            )}

                            {/* Clarification State */}
                            {!shouldShowThinking && suggestion?.type === 'clarification' && suggestion.options && !isDismissed && (
                                <LyraClarification
                                    key="clarification"
                                    text={suggestion.text}
                                    options={suggestion.options}
                                    onSelect={handleClarificationSelect}
                                />
                            )}

                            {/* Idle State */}
                            {!shouldShowThinking && shouldShowIdle && (
                                <LyraInput
                                    key="idle"
                                    onSubmit={handleInputSubmit}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
