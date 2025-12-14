/**
 * Retrieval Settings Panel
 * 
 * Configure retrieval defaults:
 * - Default retrieval provider (auto/brave/tavily)
 * - Auto rules (keyword mapping)
 * - Default max results and timeout
 */

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useAdminSettings } from '../../hooks/useAdminSettings';

const WORKSPACE_ID = 'default'; // Placeholder

interface KeywordRule {
    keyword: string;
    provider: string;
}

export function RetrievalSettingsPanel() {
    const { appSettings, updateAppSettings, isLoading } = useAdminSettings(WORKSPACE_ID);

    const [provider, setProvider] = useState<'auto' | 'brave' | 'tavily'>('auto');
    const [maxResults, setMaxResults] = useState(5);
    const [timeout, setTimeout] = useState(5000);
    const [keywordRules, setKeywordRules] = useState<KeywordRule[]>([]);

    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load settings when they arrive
    useEffect(() => {
        if (appSettings) {
            setProvider(appSettings.default_retrieval_provider);
            setMaxResults(appSettings.default_retrieval_max_results);
            setTimeout(appSettings.default_retrieval_timeout_ms);
            setKeywordRules(appSettings.retrieval_keyword_rules || []);
        }
    }, [appSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateAppSettings({
                default_retrieval_provider: provider,
                default_retrieval_max_results: maxResults,
                default_retrieval_timeout_ms: timeout,
                retrieval_keyword_rules: keywordRules,
            });
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save retrieval settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const addKeywordRule = () => {
        setKeywordRules([...keywordRules, { keyword: '', provider: 'brave' }]);
        setHasChanges(true);
    };

    const updateKeywordRule = (index: number, field: keyof KeywordRule, value: string) => {
        const updated = [...keywordRules];
        updated[index] = { ...updated[index], [field]: value };
        setKeywordRules(updated);
        setHasChanges(true);
    };

    const deleteKeywordRule = (index: number) => {
        setKeywordRules(keywordRules.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-zinc-400">Loading retrieval settings...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Retrieval Settings</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Configure default retrieval provider and rules
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

            {/* Default Provider */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <h3 className="font-semibold text-zinc-100 mb-4">Default Retrieval Provider</h3>
                <p className="text-sm text-zinc-400 mb-4">
                    Select which provider to use by default for retrieval searches.
                </p>

                <div className="flex gap-3">
                    {(['auto', 'brave', 'tavily'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                setProvider(option);
                                setHasChanges(true);
                            }}
                            className={`
                                flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors capitalize
                                ${provider === option
                                    ? 'bg-teal-500/20 text-teal-400 border-2 border-teal-500/50'
                                    : 'bg-zinc-800 text-zinc-400 border-2 border-zinc-700 hover:border-zinc-600'
                                }
                            `}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Keyword Rules */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-zinc-100">Keyword Rules</h3>
                        <p className="text-sm text-zinc-400 mt-1">
                            Map keywords to specific providers for auto routing
                        </p>
                    </div>
                    <button
                        onClick={addKeywordRule}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Rule
                    </button>
                </div>

                {keywordRules.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                        No keyword rules defined. Click "Add Rule" to create one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {keywordRules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Keyword (e.g., 'news')"
                                    value={rule.keyword}
                                    onChange={(e) => updateKeywordRule(index, 'keyword', e.target.value)}
                                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500"
                                />
                                <span className="text-zinc-500">→</span>
                                <select
                                    value={rule.provider}
                                    onChange={(e) => updateKeywordRule(index, 'provider', e.target.value)}
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-teal-500"
                                >
                                    <option value="brave">Brave</option>
                                    <option value="tavily">Tavily</option>
                                </select>
                                <button
                                    onClick={() => deleteKeywordRule(index)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Advanced Settings */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <h3 className="font-semibold text-zinc-100 mb-4">Advanced Settings</h3>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Default Max Results
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={maxResults}
                            onChange={(e) => {
                                setMaxResults(parseInt(e.target.value));
                                setHasChanges(true);
                            }}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-teal-500"
                        />
                        <p className="text-xs text-zinc-500 mt-1">1-20 results</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Default Timeout (ms)
                        </label>
                        <input
                            type="number"
                            min="1000"
                            max="30000"
                            step="1000"
                            value={timeout}
                            onChange={(e) => {
                                setTimeout(parseInt(e.target.value));
                                setHasChanges(true);
                            }}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-teal-500"
                        />
                        <p className="text-xs text-zinc-500 mt-1">1000-30000 ms</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
