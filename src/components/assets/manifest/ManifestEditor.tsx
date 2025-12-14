import { useState, useEffect } from 'react';
import { manifestClient } from '../../../lib/api/manifest-client';
import { AssetManifestJSON } from '../../../lib/assets/manifest/types';
import { validateManifest, formatValidationErrors } from '../../../lib/assets/manifest/validate';
import { Loader2, Save, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
    bundleId: string | null;
    workspaceId: string;
    userId: string;
    onSaved?: () => void;
}

const DEFAULT_MANIFEST: AssetManifestJSON = {
    version: '1.0.0',
    bundle: {
        name: 'New Bundle',
        description: '',
        tags: []
    },
    assets: []
};

export function ManifestEditor({ bundleId, workspaceId, userId, onSaved }: Props) {
    const [jsonContent, setJsonContent] = useState<string>(JSON.stringify(DEFAULT_MANIFEST, null, 2));
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        if (bundleId) {
            loadBundle(bundleId);
        }
    }, [bundleId]);

    const loadBundle = async (id: string) => {
        setLoading(true);
        try {
            const data = await manifestClient.get(id);
            setJsonContent(JSON.stringify(data, null, 2));
            validate(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(err);
            setErrors(["Failed to load bundle"]);
        } finally {
            setLoading(false);
        }
    };

    const validate = (content: string) => {
        try {
            const parsed = JSON.parse(content);
            const res = validateManifest(parsed);
            if (!res.success && res.errors) {
                setErrors(formatValidationErrors(res.errors));
                setIsValid(false);
            } else {
                setErrors([]);
                setIsValid(true);
            }
        } catch (e) {
            setErrors(["Invalid JSON syntax"]);
            setIsValid(false);
        }
    };

    const handleChange = (newContent: string) => {
        setJsonContent(newContent);
        // Debounce validation? For now instant
        validate(newContent);
    };

    const handleSave = async () => {
        if (!isValid) return;
        setSaving(true);
        try {
            const parsed = JSON.parse(jsonContent);
            await manifestClient.save(parsed, workspaceId, userId);
            if (onSaved) onSaved();
        } catch (err: any) {
            setErrors([err.message || "Save failed"]);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex flex-col h-full bg-zinc-900">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-zinc-900">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {isValid ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {isValid ? 'Valid Spec' : 'Validation Errors'}
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!isValid || saving}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Manifest
                </button>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor */}
                <div className="flex-1 border-r border-white/10 flex flex-col">
                    <div className="px-4 py-2 bg-zinc-800/50 text-xs font-mono text-zinc-400 border-b border-white/5">
                        JSON Source
                    </div>
                    <textarea
                        value={jsonContent}
                        onChange={(e) => handleChange(e.target.value)}
                        className="flex-1 w-full bg-zinc-950 p-4 font-mono text-sm text-zinc-300 focus:outline-none resize-none"
                        spellCheck={false}
                    />
                </div>

                {/* Validation Panel */}
                <div className="w-80 bg-zinc-900 border-l border-white/10 overflow-auto">
                    <div className="px-4 py-2 bg-zinc-800/50 text-xs font-mono text-zinc-400 border-b border-white/5">
                        Status
                    </div>
                    <div className="p-4 space-y-4">
                        {!isValid && errors.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-red-400">Errors</h4>
                                {errors.map((err, i) => (
                                    <div key={i} className="text-xs text-red-300 bg-red-950/30 p-2 rounded border border-red-900/50 break-words">
                                        {err}
                                    </div>
                                ))}
                            </div>
                        )}
                        {isValid && (
                            <div className="text-sm text-green-400">
                                No validation errors found.
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10">
                            <h4 className="text-sm font-semibold text-zinc-400 mb-2">Editor Tips</h4>
                            <ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4">
                                <li>Use <code className="text-zinc-300">bundle.name</code> to identifier the collection.</li>
                                <li>Each asset needs at least one file in <code className="text-zinc-300">files</code>.</li>
                                <li>Images require <code className="text-zinc-300">a11y</code> block (alt text or decorative).</li>
                                <li>Placements are optional but recommended for tracking usage.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
