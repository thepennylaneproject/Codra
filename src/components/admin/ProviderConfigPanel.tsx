/**
 * Provider Config Panel
 * 
 * Edit provider/model metadata:
 * - Enable/disable providers
 * - Edit model settings (tags, context, pricing, latency)
 * - Set default models per task type
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { PROVIDER_REGISTRY, ProviderRegistryEntry, ModelRegistryEntry } from '../../lib/ai/registry/provider-registry';

// TODO: Get workspace_id from context or props
const WORKSPACE_ID = 'default'; // Placeholder

export function ProviderConfigPanel() {
    const {
        providerSettings,
        modelSettings,
        updateProviderSettings,
        updateModelSettings,
        isLoading,
    } = useAdminSettings(WORKSPACE_ID);

    const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());


    const toggleProvider = (providerId: string) => {
        setExpandedProviders(prev => {
            const next = new Set(prev);
            if (next.has(providerId)) {
                next.delete(providerId);
            } else {
                next.add(providerId);
            }
            return next;
        });
    };

    const handleToggleProvider = async (provider: ProviderRegistryEntry) => {
        const existing = providerSettings.find(s => s.provider_id === provider.id);
        const newEnabled = !(existing?.enabled ?? true);

        await updateProviderSettings({
            provider_id: provider.id,
            enabled: newEnabled,
        });
    };

    const handleToggleModel = async (model: ModelRegistryEntry) => {
        const existing = modelSettings.find(s => s.model_id === model.id);
        const newEnabled = !(existing?.enabled ?? true);

        await updateModelSettings({
            model_id: model.id,
            enabled: newEnabled,
        });
    };

    const isProviderEnabled = (providerId: string) => {
        const setting = providerSettings.find(s => s.provider_id === providerId);
        return setting?.enabled ?? true;
    };

    const isModelEnabled = (modelId: string) => {
        const setting = modelSettings.find(s => s.model_id === modelId);
        return setting?.enabled ?? true;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-zinc-400">Loading provider configuration...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Provider Configuration</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Manage providers and model metadata (non-secret)
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {PROVIDER_REGISTRY.map((provider) => {
                    const isExpanded = expandedProviders.has(provider.id);
                    const isEnabled = isProviderEnabled(provider.id);

                    return (
                        <div
                            key={provider.id}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden"
                        >
                            {/* Provider Header */}
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <button
                                            onClick={() => toggleProvider(provider.id)}
                                            className="text-zinc-400 hover:text-zinc-100 transition"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5" />
                                            )}
                                        </button>

                                        <div className="flex-1">
                                            <h3 className="font-semibold text-zinc-100">{provider.displayName}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {provider.models.length} models • {provider.modalities.join(', ')}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleProvider(provider)}
                                        className={`
                                            px-4 py-1.5 rounded-lg text-xs font-medium transition-colors
                                            ${isEnabled
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                                            }
                                        `}
                                    >
                                        {isEnabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Models List */}
                            {isExpanded && (
                                <div className="border-t border-zinc-800 bg-zinc-900/30 p-4">
                                    <h4 className="text-sm font-medium text-zinc-300 mb-3">Models</h4>
                                    <div className="space-y-2">
                                        {provider.models.map((model) => {
                                            const modelEnabled = isModelEnabled(model.id);

                                            return (
                                                <div
                                                    key={model.id}
                                                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-zinc-100 text-sm">
                                                                {model.displayName}
                                                            </span>
                                                            {model.tags?.includes('recommended') && (
                                                                <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[10px] font-semibold rounded uppercase">
                                                                    Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                                            <span>{model.contextWindow.toLocaleString()} tokens</span>
                                                            {model.priceHint && (
                                                                <span>
                                                                    ${model.priceHint.inputPer1k.toFixed(4)}/1k in •
                                                                    ${model.priceHint.outputPer1k.toFixed(4)}/1k out
                                                                </span>
                                                            )}
                                                            {model.latencyHintMs && (
                                                                <span>~{model.latencyHintMs}ms</span>
                                                            )}
                                                        </div>
                                                        {model.tags && model.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {model.tags.map(tag => (
                                                                    <span
                                                                        key={tag}
                                                                        className="px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 text-[10px] rounded"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleToggleModel(model)}
                                                        className={`
                                                            ml-4 p-1.5 rounded transition-colors
                                                            ${modelEnabled
                                                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                                                : 'text-zinc-600 hover:bg-zinc-700'
                                                            }
                                                        `}
                                                    >
                                                        {modelEnabled ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            <X className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
