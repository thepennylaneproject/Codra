/**
 * Router Settings Panel
 * 
 * Configure Smart Router weights and defaults:
 * - Weight sliders (cost, latency, quality, taskMatch)
 * - Budget defaults
 */

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAdminSettings, AppSettings } from '../../hooks/useAdminSettings';

const WORKSPACE_ID = 'default'; // Placeholder

export function RouterSettingsPanel() {
    const { appSettings, updateAppSettings, isLoading } = useAdminSettings(WORKSPACE_ID);

    const [weights, setWeights] = useState({
        cost: 25,
        latency: 25,
        quality: 25,
        taskMatch: 25,
    });

    const [budgets, setBudgets] = useState({
        maxCostPerRun: 1.0,
        monthlyBudget: 100.0,
    });

    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load settings when they arrive
    useEffect(() => {
        if (appSettings) {
            setWeights({
                cost: appSettings.router_weight_cost,
                latency: appSettings.router_weight_latency,
                quality: appSettings.router_weight_quality,
                taskMatch: appSettings.router_weight_task_match,
            });
            setBudgets({
                maxCostPerRun: appSettings.max_cost_per_run_usd,
                monthlyBudget: appSettings.monthly_budget_usd,
            });
        }
    }, [appSettings]);

    const handleWeightChange = (key: keyof typeof weights, value: number) => {
        setWeights(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleBudgetChange = (key: keyof typeof budgets, value: number) => {
        setBudgets(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateAppSettings({
                router_weight_cost: weights.cost,
                router_weight_latency: weights.latency,
                router_weight_quality: weights.quality,
                router_weight_task_match: weights.taskMatch,
                max_cost_per_run_usd: budgets.maxCostPerRun,
                monthly_budget_usd: budgets.monthlyBudget,
            });
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save router settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const totalWeight = weights.cost + weights.latency + weights.quality + weights.taskMatch;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-zinc-400">Loading router settings...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Router Settings</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Configure Smart Router weights and budget defaults
                    </p>
                </div>

                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            {/* Router Weights */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <h3 className="font-semibold text-zinc-100 mb-4">Router Weights</h3>
                <p className="text-sm text-zinc-400 mb-6">
                    Adjust how the Smart Router prioritizes different factors when selecting models.
                    Total: {totalWeight}
                </p>

                <div className="space-y-6">
                    {/* Cost Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-300">Cost Optimization</label>
                            <span className="text-sm text-zinc-400">{weights.cost}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={weights.cost}
                            onChange={(e) => handleWeightChange('cost', parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>

                    {/* Latency Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-300">Latency Optimization</label>
                            <span className="text-sm text-zinc-400">{weights.latency}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={weights.latency}
                            onChange={(e) => handleWeightChange('latency', parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>

                    {/* Quality Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-300">Quality Optimization</label>
                            <span className="text-sm text-zinc-400">{weights.quality}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={weights.quality}
                            onChange={(e) => handleWeightChange('quality', parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>

                    {/* Task Match Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-300">Task Type Matching</label>
                            <span className="text-sm text-zinc-400">{weights.taskMatch}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={weights.taskMatch}
                            onChange={(e) => handleWeightChange('taskMatch', parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>
                </div>
            </div>

            {/* Budget Defaults */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <h3 className="font-semibold text-zinc-100 mb-4">Budget Defaults</h3>
                <p className="text-sm text-zinc-400 mb-6">
                    Set default budget limits for AI operations.
                </p>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Max Cost Per Run (USD)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={budgets.maxCostPerRun}
                            onChange={(e) => handleBudgetChange('maxCostPerRun', parseFloat(e.target.value))}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Monthly Budget (USD)
                        </label>
                        <input
                            type="number"
                            step="1"
                            min="0"
                            value={budgets.monthlyBudget}
                            onChange={(e) => handleBudgetChange('monthlyBudget', parseFloat(e.target.value))}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-teal-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
