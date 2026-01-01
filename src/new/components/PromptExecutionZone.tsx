import { useState } from 'react';
import { SpreadTask } from '../../domain/task-queue';
import { LyraPanel } from './LyraPanel';
import { LyraProvider } from '../../lib/lyra';
import { Spread } from '../../domain/types';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { Sparkles, Terminal, Play, ChevronRight, Info, Mic, MicOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PromptExecutionZoneProps {
    activeTask: SpreadTask | null;
    spread: Spread | null;
    extendedProfile: ExtendedOnboardingProfile | null;
    pastMemories?: Array<{ title: string; memory: string }>;
    onRun: (taskId: string) => void;
}

import { useVoiceToPrompt } from '../../hooks/useVoiceToPrompt';

export function PromptExecutionZone({ activeTask, spread, extendedProfile, pastMemories, onRun }: PromptExecutionZoneProps) {
    const [viewMode, setViewMode] = useState<'prompt' | 'workflow'>('prompt');
    const [voiceTranscript, setVoiceTranscript] = useState('');

    const voice = useVoiceToPrompt({
        onTranscriptUpdate: (transcript) => setVoiceTranscript(transcript),
        onFinalTranscript: (transcript) => {
            // Final transcript captured - could be sent to Lyra
            console.log('Voice Prompt:', transcript);
        },
    });

    if (!activeTask) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
                    <Sparkles className="text-rose-500" size={32} />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-serif font-medium text-zinc-900 dark:text-zinc-50">
                        Ready to Build
                    </h3>
                    <p className="text-sm text-zinc-500">
                        Select a task from the backlog to start generating code, assets, and content.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {/* Context Header */}
            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500 text-white shadow-lg shadow-rose-500/10">
                        <Terminal size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-serif font-medium text-zinc-900 dark:text-zinc-50">
                            {activeTask.title}
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            <span>{activeTask.deskId}</span>
                            <ChevronRight size={10} />
                            <span>Build Context</span>
                            {pastMemories && pastMemories.length > 0 && (
                                <>
                                    <ChevronRight size={10} />
                                    <span className="text-rose-500 animate-pulse flex items-center gap-1">
                                        <Sparkles size={10} />
                                        {pastMemories.length} Memories Injected
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg flex gap-1">
                    <button
                        onClick={() => setViewMode('prompt')}
                        className={cn(
                            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                            viewMode === 'prompt' ? "bg-white dark:bg-zinc-900 text-rose-500 shadow-sm" : "text-zinc-500"
                        )}
                    >
                        Prompt View
                    </button>
                    <button
                        onClick={() => setViewMode('workflow')}
                        className={cn(
                            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                            viewMode === 'workflow' ? "bg-white dark:bg-zinc-900 text-rose-500 shadow-sm" : "text-zinc-500"
                        )}
                    >
                        Workflow
                    </button>
                </div>

                {/* Voice Mode Toggle */}
                {voice.isSupported && (
                    <button
                        onClick={voice.isListening ? voice.stopListening : voice.startListening}
                        className={cn(
                            "p-2.5 rounded-lg transition-all flex items-center gap-2",
                            voice.isListening
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-500"
                        )}
                        title={voice.isListening ? 'Stop listening' : 'Start voice input'}
                    >
                        {voice.isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        {voice.isListening && (
                            <div className="flex flex-col items-start translate-y-[-1px]">
                                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Listening...</span>
                                {voiceTranscript && (
                                    <span className="text-[8px] text-rose-200 mt-1 max-w-[120px] truncate block opacity-80">
                                        "{voiceTranscript}"
                                    </span>
                                )}
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* Main Execution Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-8 space-y-8">

                    {/* Task Brief */}
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Info size={12} />
                                The Assignment
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 italic">
                                estimated {activeTask.status === 'complete' ? 'Done' : '≈ 30s'}
                            </span>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                {activeTask.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Target Section</span>
                                    <span className="text-xs text-zinc-700 dark:text-zinc-200">{activeTask.tearSheetAnchor || 'General Workspace'}</span>
                                </div>
                                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Priority</span>
                                    <span className="text-xs text-zinc-700 dark:text-zinc-200 capitalize">{activeTask.priority}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Lyra Integration */}
                    <section className="relative min-h-[500px] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xl">
                        <LyraProvider initialSpread={spread || undefined} initialProfile={extendedProfile}>
                            <LyraPanel
                                spreadId={spread?.id}
                                deskId={activeTask.deskId}
                            />
                        </LyraProvider>

                        {/* Overlay Controls */}
                        {activeTask.status !== 'in-progress' && (
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => onRun(activeTask.id)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white text-sm font-medium rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Play size={16} fill="white" />
                                    Run {activeTask.title}
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
