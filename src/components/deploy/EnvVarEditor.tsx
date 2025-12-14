import { useState } from 'react';
import { EnvVar } from '@/lib/deploy/types';

interface EnvVarEditorProps {
    envVars: EnvVar[];
    onSave: (key: string, value: string) => Promise<void>;
    loading?: boolean;
}

export function EnvVarEditor({ envVars, onSave, loading }: EnvVarEditorProps) {
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
        return <div className="text-center py-4 text-text-muted">Loading environment variables...</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Environment Variables</h3>
                {/* Logic to add new env var could go here */}
            </div>

            <div className="border border-border-subtle rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-background-elevated text-text-muted text-xs uppercase">
                        <tr>
                            <th className="px-4 py-2 font-medium">Key</th>
                            <th className="px-4 py-2 font-medium">Value</th>
                            <th className="px-4 py-2 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-background-subtle">
                        {envVars.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                                    No environment variables set.
                                </td>
                            </tr>
                        )}
                        {envVars.map((env) => (
                            <tr key={env.key} className="group hover:bg-background-elevated transition-colors">
                                <td className="px-4 py-3 font-mono text-text-primary">{env.key}</td>
                                <td className="px-4 py-3 text-text-soft font-mono max-w-xs truncate">
                                    {editingKey === env.key ? (
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-background-default border border-border-strong rounded px-2 py-1 text-text-primary focus:outline-none focus:border-text-accent"
                                        />
                                    ) : (
                                        '••••••••' // Masked by default
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {editingKey === env.key ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
                                            >
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => setEditingKey(null)}
                                                className="text-xs text-text-muted hover:text-text-primary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(env)}
                                            className="text-xs text-text-accent hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Edit
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
