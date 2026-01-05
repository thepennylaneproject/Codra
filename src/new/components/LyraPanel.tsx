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
import { Heading, Text, Label } from './index';
import { Button } from '@/components/ui/Button';

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
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-transparent">
                <Sparkles size={32} className="text-shell-text-secondary mb-4" />
                <Text variant="muted" size="sm">Lyra module available after project setup.</Text>
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
        <div className="h-full flex flex-col bg-transparent">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
                <Heading size="sm" className="tracking-tight text-text-soft uppercase text-[11px]">Lyra</Heading>
                <Button
                    variant="ghost"
                    onClick={hide}
                    size="sm"
                    className="p-1"
                    aria-label="Hide Lyra module"
                >
                    <X size={14} />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 text-[13px] text-text-soft">
                <div className="flex flex-col items-center gap-6">
                    {/* Static Avatar */}
                    <div className={`relative ${suggestion?.type === 'suggestion' ? 'ring-1 ring-zinc-300' : ''} rounded-full`}>
                        <LyraAvatar
                            appearance={state.appearance}
                            size={40}
                            showGlow={false}
                        />
                    </div>

                    {/* Dynamic Content */}
                    <div className="w-full">
                        <AnimatePresence mode="wait">
                            {/* Thinking State */}
                            {shouldShowThinking && (
                                <div key="thinking" className="flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-[var(--shell-border)] border-t-zinc-500 rounded-full animate-spin" />
                                    <Label variant="muted">Thinking...</Label>
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
