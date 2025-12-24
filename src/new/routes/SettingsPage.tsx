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
        <div className="min-h-screen bg-[#FFFAF0] text-[#1A1A1A] font-sans selection:bg-[#FF4D4D]/20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FFFAF0]/80 backdrop-blur-xl border-b border-[#1A1A1A]/5 px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/projects')}
                        className="p-2 hover:bg-zinc-100 rounded-xl transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight">Global Settings</h1>
                        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Application Workspace Defaults</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4D4D] bg-[#FF4D4D]/5 px-3 py-1.5 rounded-full border border-[#FF4D4D]/10">
                        System v2.5
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-16 px-8">
                <div className="grid gap-16">

                    {/* Subscription & Plan */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-[#FF4D4D]/10 flex items-center justify-center text-[#FF4D4D]">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest">Subscription & Plan</h2>
                                <p className="text-xs text-zinc-400">Manage your production level and billing</p>
                            </div>
                        </div>

                        <div className="p-8 bg-[#1A1A1A] rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-[#1A1A1A]/20 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4D4D]/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                           
                           <div className="relative z-10">
                               <div className="flex items-center gap-3 mb-4">
                                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4D4D] bg-[#FF4D4D]/10 px-3 py-1 rounded-full border border-[#FF4D4D]/20">Active Plan</span>
                               </div>
                               <h3 className="text-4xl font-black tracking-tighter mb-2 italic font-serif opacity-90">Free Tier</h3>
                               <p className="text-xs text-zinc-400 font-medium">Precision intake for solo exploration • 25 AI completions left</p>
                           </div>

                           <button 
                                onClick={() => navigate('/pricing')}
                                className="relative z-10 px-10 py-5 bg-white text-[#1A1A1A] rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:bg-[#FF4D4D] hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                           >
                                Upgrade to Pro
                                <ArrowUpRight size={16} strokeWidth={3} />
                           </button>
                        </div>
                    </section>

                    {/* AI Configuration */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest">AI & Intelligence Defaults</h2>
                                <p className="text-xs text-zinc-400">Preferred models and processing strategies</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Quality vs. Cost Priority</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {QUALITY_PRIORITY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAIUpdate({ qualityPriority: opt.id })}
                                            className={`p-4 rounded-xl border transition-all text-left group ${aiDefaults.qualityPriority === opt.id
                                                ? 'border-[#FF4D4D] bg-[#FF4D4D]/5'
                                                : 'border-zinc-100 hover:border-zinc-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${aiDefaults.qualityPriority === opt.id ? 'text-[#FF4D4D]' : 'text-zinc-600'}`}>{opt.label}</span>
                                                {aiDefaults.qualityPriority === opt.id && <Check size={12} className="text-[#FF4D4D]" />}
                                            </div>
                                            <p className="text-[9px] text-zinc-400 leading-tight">{opt.description}</p>
                                        </button>
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
                                            <p className="text-[10px] font-black uppercase tracking-widest">Show Model per Step</p>
                                            <p className="text-[10px] text-zinc-400">Always display which model is being used</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateAIDefaults({ showModelPerStep: !aiDefaults.showModelPerStep })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${aiDefaults.showModelPerStep ? 'bg-[#FF4D4D]' : 'bg-zinc-200'}`}
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
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <CircleDollarSign size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest">Financial Guardrails</h2>
                                <p className="text-xs text-zinc-400">Budget management and spending alerts</p>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Default Budget Mode</label>
                            <div className="grid sm:grid-cols-3 gap-6">
                                {BUDGET_MODE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleBudgetUpdate({ budgetMode: opt.id })}
                                        className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-3 ${budgetDefaults.budgetMode === opt.id
                                            ? 'border-emerald-500 bg-emerald-500/5 shadow-inner'
                                            : 'border-zinc-100 hover:border-zinc-200 bg-zinc-50/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${budgetDefaults.budgetMode === opt.id ? 'text-emerald-600' : 'text-zinc-700'}`}>
                                                {opt.label}
                                            </span>
                                            {budgetDefaults.budgetMode === opt.id && <Check size={14} className="text-emerald-500" />}
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">{opt.description}</p>
                                    </button>
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
                                <h2 className="text-sm font-black uppercase tracking-widest">Autonomy & Safety</h2>
                                <p className="text-xs text-zinc-400">Agent permissions and automatic execution</p>
                            </div>
                        </div>

                        <div className="bg-white border border-[#1A1A1A]/5 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-zinc-50">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Default Autonomy Level</h3>
                                <p className="text-[11px] text-zinc-500 mb-6">How much can the AI do without your intervention?</p>

                                <div className="space-y-3">
                                    {['suggest-only', 'apply-with-approval', 'auto-apply'].map((level) => (
                                        <button
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
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${permissionsDefaults.defaultAutonomy === level ? 'text-rose-600' : 'text-zinc-600'}`}>
                                                    {level.replace(/-/g, ' ')}
                                                </span>
                                            </div>
                                            {permissionsDefaults.defaultAutonomy === level && <Check size={16} className="text-rose-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer / Status */}
            <footer className="mt-20 py-12 border-t border-[#1A1A1A]/5 bg-white/50 text-center">
                <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-[0.3em]">Codra • Production Ready Defaults</p>
            </footer>
        </div>
    );
}
