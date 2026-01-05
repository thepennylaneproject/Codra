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
import { Button } from '@/components/ui/Button';

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
            <header className="sticky top-0 z-50 glass-panel-light border-0 border-b border-[#1A1A1A]/5 rounded-none bg-[#FFFAF0]/80 px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        onClick={() => navigate('/projects')}
                        className="p-2 hover:bg-zinc-100 rounded-xl transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Global Settings</h1>
                        <p className="text-xs font-mono text-zinc-400">Application Workspace Defaults</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-text-secondary bg-[#1A1A1A]/5 px-3 py-1 rounded-full border border-[#1A1A1A]/10">
                        System v2.5
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-12 px-8">
                <div className="grid gap-12">

                    {/* Subscription & Plan */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A]/10 flex items-center justify-center text-text-primary">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Subscription &amp; Plan</h2>
                                <p className="text-xs text-zinc-400">Manage your production level and billing</p>
                            </div>
                        </div>

                        <div className="p-8 bg-[#1A1A1A] rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-[#1A1A1A]/20 relative overflow-hidden group">
                           {/* Decorative glow removed per accent governance (prohibited: decorative usage) */}

                           <div className="relative z-10">
                               <div className="flex items-center gap-3 mb-4">
                                   <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                                       Active Plan
                                   </span>
                               </div>
                               <h3 className="text-xl font-semibold mb-2 italic font-serif opacity-90">Free Tier</h3>
                               <p className="text-xs text-zinc-400 font-medium">Precision intake for solo exploration • 25 AI completions left</p>
                           </div>

                           <Button
                                onClick={() => navigate('/pricing')}
                                className="relative z-10 px-8 py-4 bg-white text-text-primary rounded-2xl font-semibold text-xs flex items-center gap-3 hover:bg-zinc-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                           >
                                Open billing settings
                                <ArrowUpRight size={16} strokeWidth={3} />
                           </Button>
                        </div>
                    </section>

                    {/* AI Configuration */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">AI & Intelligence Defaults</h2>
                                <p className="text-xs text-zinc-400">Preferred models and processing strategies</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <label className="block text-xs font-semibold text-zinc-400 mb-4">Quality vs. Cost Priority</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {QUALITY_PRIORITY_OPTIONS.map(opt => (
                                        <Button
                                            key={opt.id}
                                            onClick={() => handleAIUpdate({ qualityPriority: opt.id })}
                                            className={`p-4 rounded-xl border transition-all text-left group ${aiDefaults.qualityPriority === opt.id
                                                ? 'border-[#1A1A1A] bg-[#1A1A1A]/5'
                                                : 'border-zinc-100 hover:border-zinc-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs font-semibold ${aiDefaults.qualityPriority === opt.id ? 'text-text-primary' : 'text-zinc-600'}`}>
                                                    {opt.label}
                                                </span>
                                                {aiDefaults.qualityPriority === opt.id && <Check size={12} className="text-text-primary" />}
                                            </div>
                                            <p className="text-xs text-zinc-400 leading-tight">{opt.description}</p>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400">
                                            <BrainCircuit size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">Show Model per Step</p>
                                            <p className="text-xs text-zinc-400">Always display which model is being used</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => updateAIDefaults({ showModelPerStep: !aiDefaults.showModelPerStep })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${aiDefaults.showModelPerStep ? 'bg-[#1A1A1A]' : 'bg-zinc-200'}`}
                                    >
                                        <motion.div
                                            animate={{ x: aiDefaults.showModelPerStep ? 26 : 4 }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Financial Guardrails */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <CircleDollarSign size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Financial Guardrails</h2>
                                <p className="text-xs text-zinc-400">Budget management and spending alerts</p>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm">
                            <label className="block text-xs font-semibold text-zinc-400 mb-6">Default Budget Mode</label>
                            <div className="grid sm:grid-cols-3 gap-6">
                                {BUDGET_MODE_OPTIONS.map(opt => (
                                    <Button
                                        key={opt.id}
                                        onClick={() => handleBudgetUpdate({ budgetMode: opt.id })}
                                        className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-3 ${budgetDefaults.budgetMode === opt.id
                                            ? 'border-emerald-500 bg-emerald-500/5 shadow-inner'
                                            : 'border-zinc-100 hover:border-zinc-200 bg-zinc-50/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-semibold ${budgetDefaults.budgetMode === opt.id ? 'text-emerald-600' : 'text-zinc-700'}`}>
                                                {opt.label}
                                            </span>
                                            {budgetDefaults.budgetMode === opt.id && <Check size={14} className="text-emerald-500" />}
                                        </div>
                                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{opt.description}</p>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Autonomy & Safety */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Autonomy & Safety</h2>
                                <p className="text-xs text-zinc-400">Agent permissions and automatic execution</p>
                            </div>
                        </div>

                        <div className="bg-white border border-[#1A1A1A]/5 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-zinc-50">
                                <h3 className="text-xs font-semibold text-zinc-400 mb-1">Default Autonomy Level</h3>
                                <p className="text-xs text-zinc-500 mb-6">How much can the AI do without your intervention?</p>

                                <div className="space-y-3">
                                    {['manual', 'guided', 'auto-apply'].map((level) => (
                                        <Button
                                            key={level}
                                            onClick={() => handlePermissionsUpdate({ defaultAutonomy: level as any })}
                                            className={`w-full p-4 rounded-xl border flex items-center justify-between group transition-all ${permissionsDefaults.defaultAutonomy === level
                                                ? 'border-rose-500 bg-rose-500/[0.02] shadow-sm'
                                                : 'border-zinc-100 hover:border-zinc-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${permissionsDefaults.defaultAutonomy === level ? 'bg-rose-500 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600'}`}>
                                                    <LayoutPanelTop size={14} />
                                                </div>
                                                <span className={`text-xs font-semibold ${permissionsDefaults.defaultAutonomy === level ? 'text-rose-600' : 'text-zinc-600'}`}>
                                                    {level.replace(/-/g, ' ')}
                                                </span>
                                            </div>
                                            {permissionsDefaults.defaultAutonomy === level && <Check size={16} className="text-rose-500" />}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer / Status */}
            <footer className="mt-12 py-12 border-t border-[#1A1A1A]/5 bg-white/50 text-center">
                <p className="text-xs font-mono text-zinc-300">Codra • Production defaults</p>
            </footer>
        </div>
    );
}
