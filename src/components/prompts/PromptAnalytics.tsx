import React from 'react';
import { BarChart2, TrendingUp, ThumbsUp } from 'lucide-react';
import { Prompt } from '../../types/prompt';

interface PromptAnalyticsProps {
    prompt: Prompt;
    onClose: () => void;
}

export const PromptAnalytics: React.FC<PromptAnalyticsProps> = ({ prompt, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-surface-card border border-border-subtle rounded-xl w-[500px] shadow-2xl">
                <div className="p-4 border-b border-border-subtle flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                        Analytics: {prompt.name}
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">✕</button>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-background-base p-4 rounded-lg border border-border-subtle">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">Total Usage</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{prompt.usageCount}</p>
                    </div>

                    <div className="bg-background-base p-4 rounded-lg border border-border-subtle">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">Success Rate</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">98.5%</p>
                    </div>

                    <div className="col-span-2 bg-background-base p-4 rounded-lg border border-border-subtle">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <span className="text-sm">Model Performance</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>GPT-4o</span>
                                <span className="text-emerald-400">High (120ms)</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '90%' }} />
                            </div>

                            <div className="flex justify-between text-sm mt-3">
                                <span>Claude 3.5 Sonnet</span>
                                <span className="text-indigo-400">Medium (450ms)</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '70%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
