import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Zap,
    CircleDollarSign,
    ArrowLeft,
    Check,
    LayoutPanelTop,
    BrainCircuit,
    CreditCard,
    ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../lib/store/useSettingsStore';
import {
    QUALITY_PRIORITY_OPTIONS,
    BUDGET_MODE_OPTIONS
} from '../../domain/onboarding-types';
import { useToast } from '../components/Toast';

export function SettingsPage() {
    const navigate = useNavigate();
    const {
        aiDefaults,
        budgetDefaults,
        permissionsDefaults,
        updateAIDefaults,
        updateBudgetDefaults,
        updatePermissionsDefaults
    } = useSettingsStore();

    const toast = useToast();

    // Wrapper functions with toast feedback
    const handleAIUpdate = (updates: Parameters<typeof updateAIDefaults>[0]) => {
        updateAIDefaults(updates);
        toast.success('AI preferences saved');
    };

    const handleBudgetUpdate = (updates: Parameters<typeof updateBudgetDefaults>[0]) => {
        updateBudgetDefaults(updates);
        toast.success('Budget settings saved');
    };

    const handlePermissionsUpdate = (updates: Parameters<typeof updatePermissionsDefaults>[0]) => {
        updatePermissionsDefaults(updates);
        toast.success('Permissions saved');
    };

    return (
        <div className="min-h-screen bg-[#FFFAF0] text-text-primary font-sans selection:bg-[#1A1A1A]/10">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--ui-border)] bg-[var(--color-ivory)] px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Global Settings</h1>
                        <p className="text-xs font-mono text-zinc-400">Application Workspace Defaults</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">System v2.5</span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-12 px-8">
                <div className="grid gap-12">

                    {/* Subscription & Plan */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Subscription &amp; Plan</h2>
                                <p className="text-xs text-zinc-400">Manage your production level and billing</p>
                            </div>
                        </div>

                        <div className="py-6 border-t border-[var(--ui-border)] flex flex-col md:flex-row items-center justify-between gap-6">
                           <div>
                               <div className="flex items-center gap-3 mb-2">
                                   <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">Active plan</span>
                               </div>
                               <h3 className="text-lg font-semibold mb-1">Free Tier</h3>
                               <p className="text-xs text-zinc-500 font-medium">Precision intake for solo exploration • 25 AI completions left</p>
                           </div>

                           <button
                                onClick={() => navigate('/pricing')}
                                className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-primary flex items-center gap-2"
                           >
                                Open billing settings
                                <ArrowUpRight size={14} strokeWidth={2} />
                           </button>
                        </div>
                    </section>

                    {/* AI Configuration */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">AI & Intelligence Defaults</h2>
                                <p className="text-xs text-zinc-400">Preferred models and processing strategies</p>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <div className="pt-6 border-t border-[var(--ui-border)]">
                                <label className="block text-xs font-semibold text-zinc-400 mb-4">Quality vs. Cost Priority</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {QUALITY_PRIORITY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAIUpdate({ qualityPriority: opt.id })}
                                            className={`p-2 text-left border-b transition-all ${aiDefaults.qualityPriority === opt.id
                                                ? 'border-[#1A1A1A] text-text-primary'
                                                : 'border-[var(--ui-border)] text-zinc-600 hover:text-text-primary'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                                                    {opt.label}
                                                </span>
                                                {aiDefaults.qualityPriority === opt.id && <Check size={12} className="text-text-primary" />}
                                            </div>
                                            <p className="text-xs text-zinc-400 leading-tight">{opt.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[var(--ui-border)]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 border border-[var(--ui-border)] text-zinc-500">
                                            <BrainCircuit size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">Show Model per Step</p>
                                            <p className="text-xs text-zinc-400">Always display which model is being used</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateAIDefaults({ showModelPerStep: !aiDefaults.showModelPerStep })}
                                        className={`w-12 h-6 border border-[var(--ui-border)] transition-colors relative ${aiDefaults.showModelPerStep ? 'bg-[var(--color-ink)]' : 'bg-transparent'}`}
                                    >
                                        <motion.div
                                            animate={{ x: aiDefaults.showModelPerStep ? 26 : 4 }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Financial Guardrails */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <CircleDollarSign size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Financial Guardrails</h2>
                                <p className="text-xs text-zinc-400">Budget management and spending alerts</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--ui-border)]">
                            <label className="block text-xs font-semibold text-zinc-400 mb-6">Default Budget Mode</label>
                            <div className="grid sm:grid-cols-3 gap-6">
                                {BUDGET_MODE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleBudgetUpdate({ budgetMode: opt.id })}
                                        className={`p-2 border-b transition-all text-left flex flex-col gap-2 ${budgetDefaults.budgetMode === opt.id
                                            ? 'border-[#1A1A1A] text-text-primary'
                                            : 'border-[var(--ui-border)] text-zinc-600 hover:text-text-primary'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                                                {opt.label}
                                            </span>
                                            {budgetDefaults.budgetMode === opt.id && <Check size={14} className="text-text-primary" />}
                                        </div>
                                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{opt.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Autonomy & Safety */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Autonomy & Safety</h2>
                                <p className="text-xs text-zinc-400">Agent permissions and automatic execution</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--ui-border)]">
                            <div className="pb-6 border-b border-zinc-200">
                                <h3 className="text-xs font-semibold text-zinc-400 mb-1">Default Autonomy Level</h3>
                                <p className="text-xs text-zinc-500 mb-6">How much can the AI do without your intervention?</p>

                                <div className="space-y-3">
                                    {['manual', 'guided', 'auto-apply'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => handlePermissionsUpdate({ defaultAutonomy: level as any })}
                                            className={`w-full p-2 border-b flex items-center justify-between group transition-all ${permissionsDefaults.defaultAutonomy === level
                                                ? 'border-[#1A1A1A] text-text-primary'
                                                : 'border-[var(--ui-border)] text-zinc-600 hover:text-text-primary'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 border border-[var(--ui-border)] ${permissionsDefaults.defaultAutonomy === level ? 'bg-[var(--color-ink)] text-white' : 'bg-transparent text-zinc-500 group-hover:text-zinc-700'}`}>
                                                    <LayoutPanelTop size={14} />
                                                </div>
                                                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                                                    {level.replace(/-/g, ' ')}
                                                </span>
                                            </div>
                                            {permissionsDefaults.defaultAutonomy === level && <Check size={16} className="text-text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer / Status */}
            <footer className="mt-12 py-12 border-t border-[#1A1A1A]/5 bg-[var(--color-ivory)] text-center">
                <p className="text-xs font-mono text-zinc-400">Codra • Production defaults</p>
            </footer>
        </div>
    );
}
