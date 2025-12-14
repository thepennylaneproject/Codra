
import React, { useState } from 'react';
import { CostEstimator } from '../components/ai/CostEstimator';
import { ModelRecommendation } from '../components/ai/ModelRecommendation';
import { BudgetMeter } from '../components/billing/BudgetMeter';
import { OptimizationPanel } from '../components/billing/OptimizationPanel';

export const AIPlayground: React.FC = () => {
    const [prompt, setPrompt] = useState('Write a python script to scrape a website');

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8 space-y-8">
            <h1 className="text-3xl font-bold">AI Smart Routing Playground</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                        <h2 className="text-xl font-semibold mb-4">Cost Estimator</h2>
                        <CostEstimator />
                    </section>

                    <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                        <h2 className="text-xl font-semibold mb-4">Budget Controls</h2>
                        <div className="space-y-6">
                            <BudgetMeter workspaceId="demo-workspace" />
                            <OptimizationPanel />
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                        <h2 className="text-xl font-semibold mb-4">Smart Router</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Test Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <ModelRecommendation prompt={prompt} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
