
import React, { useState, useEffect } from 'react';
import { costEngine } from '../../lib/ai/cost';

export const CostEstimator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [models] = useState(costEngine.getAllModels());

    useEffect(() => {
        // Simple token estimation: chars / 4
        // Assume +500 output tokens for estimation
        const estimatedTokens = (prompt.length / 4) + 500;
        const cost = costEngine.estimateCost(selectedModel, estimatedTokens);
        setEstimatedCost(cost);
    }, [prompt, selectedModel]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">AI Cost Estimator</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Model
                    </label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {models.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.id} ({model.provider})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Draft Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Est. Tokens: {Math.ceil(prompt.length / 4)} input + 500 output
                    </p>
                </div>

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Cost per Run</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            ${estimatedCost.toFixed(5)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
