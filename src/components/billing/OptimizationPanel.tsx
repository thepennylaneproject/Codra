
import React from 'react';

export const OptimizationPanel: React.FC = () => {
    // In a real implementation, this would analyze actual usage logs
    // For now, we provide static best-practice suggestions
    const suggestions = [
        {
            id: 1,
            title: "Switch Chat to GPT-4o",
            description: "You're using GPT-4 for general chat. Switching to GPT-4o could save ~50% with similar quality.",
            potentialSavings: "$12.50/mo",
            action: "Apply Config"
        },
        {
            id: 2,
            title: "Use Haiku for Summaries",
            description: "Routine summarization tasks can be handled by Claude 3 Haiku at significantly lower cost.",
            potentialSavings: "$5.20/mo",
            action: "Update Routing"
        }
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span>⚡</span> Optimization Opportunities
            </h3>

            <div className="space-y-3">
                {suggestions.map(suggestion => (
                    <div key={suggestion.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">{suggestion.title}</span>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">{suggestion.potentialSavings}</span>
                        </div>
                        <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                            {suggestion.description}
                        </p>
                        <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors">
                            {suggestion.action}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
