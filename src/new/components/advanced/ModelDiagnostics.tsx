/**
 * MODEL DIAGNOSTICS PANEL
 * Advanced panel for power users to view and override Smart Mode routing decisions.
 * Only accessible via Cmd/Ctrl+Shift+M keyboard shortcut.
 */

import { useState, useMemo } from 'react';
import { X, Cpu, Zap, AlertCircle, Info } from 'lucide-react';
import { useFlowStore } from '../../../lib/store/useFlowStore';
import { smartRouter } from '../../../lib/ai/router/smart-router';
import { useProviderRegistry } from '../../../lib/ai/registry/useProviderRegistry';
import { ModelRegistryEntry, ProviderRegistryEntry } from '../../../lib/ai/registry/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelDiagnosticsProps {
    isOpen: boolean;
    onClose: () => void;
    currentTask?: string;
}

export function ModelDiagnostics({ isOpen, onClose, currentTask }: ModelDiagnosticsProps) {
    const { lastRoutingDecision } = useFlowStore();
    const { providers } = useProviderRegistry();

    const [overrideModelId, setOverrideModelId] = useState<string>('');
    const [overrideProviderId, setOverrideProviderId] = useState<string>('');
    const [rememberOverride, setRememberOverride] = useState(false);

    // Get all available models
    const allModels = useMemo(() => {
        return providers.flatMap((p: ProviderRegistryEntry) =>
            p.models.map((m: ModelRegistryEntry) => ({
                ...m,
                providerId: p.id,
                providerName: p.displayName
            }))
        );
    }, [providers]);

    // Get current Smart Mode selection details
    const smartModeModel = lastRoutingDecision
        ? smartRouter.getModelDisplayName(lastRoutingDecision.selected.modelId)
        : 'No selection yet';

    const selectionReason = lastRoutingDecision?.ranked[0]?.reasons[0] || 'Awaiting first task';

    const taskDescription = currentTask || 'No active task';

    const handleApplyOverride = () => {
        if (!overrideModelId || !overrideProviderId) {
            return;
        }

        // TODO: Implement override logic
        // This would store the override in the flow store or task executor
        console.log('Apply override:', { overrideModelId, overrideProviderId, rememberOverride });

        // Close the panel after applying
        onClose();
    };

    const handleUseSmartMode = () => {
        // Clear any overrides and use Smart Mode
        setOverrideModelId('');
        setOverrideProviderId('');
        setRememberOverride(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
                    >
                        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-dark)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-500/10">
                                        <Cpu size={20} className="text-rose-500" />
                                    </div>
                                    <h2 className="text-lg font-black uppercase tracking-tight text-[var(--color-text-primary)]">
                                        Model Diagnostics
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text-muted)]"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Current Task */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                        Current Task
                                    </label>
                                    <div className="px-4 py-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                                        <p className="text-sm font-mono text-[var(--color-text-primary)]">
                                            {taskDescription}
                                        </p>
                                    </div>
                                </div>

                                {/* Smart Mode Selection */}
                                <div className="space-y-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-emerald-500" />
                                        <label className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                                            Smart Mode Selection
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                                <span className="text-sm font-bold text-emerald-600">
                                                    {smartModeModel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 mt-2">
                                        <Info size={12} className="text-emerald-500/60 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-emerald-600/80 font-mono">
                                            {selectionReason}
                                        </p>
                                    </div>
                                </div>

                                {/* Override Section */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                        Override (this task only)
                                    </label>

                                    <select
                                        value={overrideModelId ? `${overrideProviderId}:${overrideModelId}` : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const [providerId, modelId] = e.target.value.split(':');
                                                setOverrideProviderId(providerId);
                                                setOverrideModelId(modelId);
                                            } else {
                                                setOverrideModelId('');
                                                setOverrideProviderId('');
                                            }
                                        }}
                                        className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                                    >
                                        <option value="">Select model...</option>
                                        {allModels.map((model) => (
                                            <option
                                                key={`${model.providerId}:${model.id}`}
                                                value={`${model.providerId}:${model.id}`}
                                            >
                                                {model.displayName} ({model.providerName})
                                            </option>
                                        ))}
                                    </select>

                                    {/* Remember Checkbox */}
                                    <label className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={rememberOverride}
                                            onChange={(e) => setRememberOverride(e.target.checked)}
                                            className="w-4 h-4 rounded border-amber-500/30 text-amber-500 focus:ring-amber-500/50"
                                        />
                                        <div className="flex items-start gap-2 flex-1">
                                            <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-amber-600">
                                                    Remember override for similar tasks
                                                </span>
                                                <p className="text-[10px] text-amber-600/70">
                                                    This will bypass Smart Mode for tasks of the same type
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-dark)]">
                                <button
                                    onClick={handleUseSmartMode}
                                    className="px-5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
                                >
                                    Use Smart Mode
                                </button>
                                <button
                                    onClick={handleApplyOverride}
                                    disabled={!overrideModelId}
                                    className="px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:bg-[var(--color-border)] disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider text-white transition-colors shadow-lg shadow-rose-500/20 disabled:shadow-none"
                                >
                                    Apply Override
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
