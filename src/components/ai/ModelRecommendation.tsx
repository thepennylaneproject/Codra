
import React, { useState, useEffect } from 'react';
import { costEngine, CostComparison } from '../../lib/ai/cost';

interface ModelRecommendationProps {
    prompt: string;
}

export const ModelRecommendation: React.FC<ModelRecommendationProps> = ({ prompt }) => {
    const [comparisons, setComparisons] = useState<CostComparison[]>([]);

    useEffect(() => {
        if (!prompt) {
            setComparisons([]);
            return;
        }
        const results = costEngine.compareModels(prompt, costEngine.getAllModels().map(m => m.id));
        setComparisons(results);
    }, [prompt]);

    if (!prompt) return null;

    return (
        <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Smart Recommendations
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Best Value (Budget) */}
                {comparisons.find(c => c.recommendation === 'budget') && (
                    <RecommendationCard
                        title="Best Value"
                        data={comparisons.find(c => c.recommendation === 'budget')!}
                        icon="💰"
                    />
                )}

                {/* Balanced */}
                {comparisons.find(c => c.recommendation === 'balanced') && (
                    <RecommendationCard
                        title="Balanced Choice"
                        data={comparisons.find(c => c.recommendation === 'balanced')!}
                        icon="⚖️"
                        highlight
                    />
                )}

                {/* Best Quality */}
                {comparisons.find(c => c.recommendation === 'best') && (
                    <RecommendationCard
                        title="Maximum Quality"
                        data={comparisons.find(c => c.recommendation === 'best')!}
                        icon="✨"
                    />
                )}
            </div>
        </div>
    );
};

const RecommendationCard: React.FC<{ title: string, data: CostComparison, icon: string, highlight?: boolean }> = ({ title, data, icon, highlight }) => (
    <div className={`p-4 rounded-lg border ${highlight ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{icon}</span>
            <span className={`font-semibold ${highlight ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                {title}
            </span>
        </div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {data.model}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
            <div>Est. Cost: ${data.estimatedCost.toFixed(5)}</div>
            <div>Quality Score: {(data.qualityScore * 100).toFixed(0)}%</div>
        </div>
    </div>
);
