import { useState } from 'react';
import { EnvVar } from '../../../../lib/deploy/types';
import { Key, Lock, Edit3, Check, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface EnvVarEditorProps {
    envVars: EnvVar[];
    onSave: (key: string, value: string) => Promise<void>;
    loading?: boolean;
    className?: string;
}

export function EnvVarEditor({ envVars, onSave, loading, className }: EnvVarEditorProps) {
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    const handleEdit = (v: EnvVar) => {
        setEditingKey(v.key);
        setEditValue(v.value);
    };

    const handleSave = async () => {
        if (!editingKey) return;
        setSaving(true);
        await onSave(editingKey, editValue);
        setSaving(false);
        setEditingKey(null);
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 w-full bg-zinc-50 dark:bg-zinc-900 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            <header className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Key size={10} />
                    Environment Config
                </h3>
            </header>

            <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Key</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Value</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                        {envVars.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-12 text-center text-zinc-400 text-sm">
                                    No environment variables detected.
                                </td>
                            </tr>
                        )}
                        {envVars.map((env) => (
                            <tr key={env.key} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all">
                                <td className="px-4 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400 font-bold">
                                    {env.key}
                                </td>
                                <td className="px-4 py-4 text-xs font-mono text-zinc-400">
                                    {editingKey === env.key ? (
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            autoFocus
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <Lock size={10} />
                                            <span>••••••••</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    {editingKey === env.key ? (
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                                title="Save Changes"
                                            >
                                                {saving ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                                ) : (
                                                    <Check size={14} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setEditingKey(null)}
                                                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                                                title="Cancel"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(env)}
                                            className="p-2 rounded-lg text-zinc-300 hover:text-rose-500 dark:text-zinc-700 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
