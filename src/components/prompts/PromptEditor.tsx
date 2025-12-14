import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Save, ArrowLeft, Play, Settings, History as HistoryIcon, BarChart2 } from 'lucide-react';
import { usePromptStore } from '../../lib/store/promptStore';
import { VersionHistory } from './VersionHistory';
import { PromptAnalytics } from './PromptAnalytics';
import { PromptVariable } from '../../types/prompt';

export const PromptEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getPrompt, getVersions, updatePrompt, createVersion, addPrompt } = usePromptStore();

    const isNewPrompt = id === 'new';
    const prompt = isNewPrompt ? null : getPrompt(id || '');
    const versions = isNewPrompt ? [] : getVersions(id || '');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [content, setContent] = useState('');
    const [variables, setVariables] = useState<PromptVariable[]>([]);

    // UI state
    const [showHistory, setShowHistory] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [changeNote, setChangeNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const initialStateRef = useRef<string>('');

    // Load existing prompt data
    useEffect(() => {
        if (prompt) {
            setName(prompt.name);
            setDescription(prompt.description);
            setCategory(prompt.category);
            setTags(prompt.tags);
            setContent(prompt.content);
            setVariables(prompt.variables);

            // Store initial state for dirty checking
            initialStateRef.current = JSON.stringify({
                name: prompt.name,
                description: prompt.description,
                category: prompt.category,
                tags: prompt.tags,
                content: prompt.content,
                variables: prompt.variables
            });
        } else if (isNewPrompt) {
            // Initialize empty state for new prompts
            initialStateRef.current = JSON.stringify({
                name: '',
                description: '',
                category: 'General',
                tags: [],
                content: '',
                variables: []
            });
        }
    }, [prompt, isNewPrompt]);

    // Track dirty state
    useEffect(() => {
        const currentState = JSON.stringify({
            name,
            description,
            category,
            tags,
            content,
            variables
        });
        setIsDirty(currentState !== initialStateRef.current);
    }, [name, description, category, tags, content, variables]);

    // Block navigation if there are unsaved changes
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Basic variable extraction regex
    const extractVariables = useCallback((text: string) => {
        const regex = /\{\{([^}]+)\}\}/g;
        const matches = Array.from(text.matchAll(regex)).map(m => m[1].trim());
        return [...new Set(matches)];
    }, []);

    const handleContentChange = (value: string | undefined) => {
        if (value === undefined) return;
        setContent(value);

        // Auto-detect variables
        const detectedVars = extractVariables(value);
        const newVariables: PromptVariable[] = detectedVars.map(name => {
            const existing = variables.find(v => v.name === name);
            return existing || {
                name,
                type: 'text',
                label: name.charAt(0).toUpperCase() + name.slice(1),
                required: true
            };
        });
        setVariables(newVariables);
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSave = () => {
        setIsSaving(true);

        if (isNewPrompt) {
            // Create new prompt
            const newPromptData = {
                name: name || 'Untitled Prompt',
                description: description || '',
                content,
                variables,
                tags,
                category,
                isPublic: false,
                isFavorite: false
            };
            const newPrompt = addPrompt(newPromptData);

            // Update initial state and navigate to the new prompt
            initialStateRef.current = JSON.stringify({
                name: newPromptData.name,
                description: newPromptData.description,
                category: newPromptData.category,
                tags: newPromptData.tags,
                content,
                variables
            });
            setIsDirty(false);

            setTimeout(() => {
                setIsSaving(false);
                navigate(`/prompts/${newPrompt.id}`, { replace: true });
            }, 500);
        } else {
            // Update existing prompt
            if (!id) return;

            updatePrompt(id, {
                name,
                description,
                category,
                tags,
                content,
                variables
            });

            // Create version if note provided
            if (changeNote.trim()) {
                createVersion(id, content, changeNote);
                setChangeNote('');
            }

            // Update initial state
            initialStateRef.current = JSON.stringify({
                name,
                description,
                category,
                tags,
                content,
                variables
            });
            setIsDirty(false);

            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const handleBack = () => {
        if (isDirty) {
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                navigate('/prompts');
            }
        } else {
            navigate('/prompts');
        }
    };

    if (!isNewPrompt && !prompt) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-text-muted">Prompt not found</p>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-background-base">
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 border-b border-border-subtle flex items-center justify-between px-6 bg-surface-card">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                            title="Back to Library"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                {isNewPrompt ? 'New Prompt' : name}
                                {!isNewPrompt && prompt && (
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-normal">v{prompt.currentVersion}</span>
                                )}
                                {isDirty && <span className="text-amber-400 text-xs">• Unsaved</span>}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Change note (optional)"
                            value={changeNote}
                            onChange={(e) => setChangeNote(e.target.value)}
                            className="bg-background-input border border-border-input rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-indigo-500/50"
                        />

                        <button
                            onClick={handleSave}
                            disabled={isSaving || (!isDirty && !isNewPrompt)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${isSaving
                                ? 'bg-emerald-600 text-white'
                                : (!isDirty && !isNewPrompt)
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-brand-magenta hover:bg-brand-magenta/80 text-white shadow-lg shadow-brand-magenta/20'
                                }`}
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saved!' : isNewPrompt ? 'Create Prompt' : 'Save Changes'}
                        </button>
                        {!isNewPrompt && (
                            <>
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-text-muted hover:text-text-primary'
                                        }`}
                                >
                                    <HistoryIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowAnalytics(true)}
                                    className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                                    title="View Analytics"
                                >
                                    <BarChart2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </header>

                {/* Prompt Metadata Form */}
                <div className="border-b border-border-subtle bg-surface-card/50 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Prompt Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Code Refactor Expert"
                                className="w-full bg-background-input border border-border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-magenta/50 focus:ring-1 focus:ring-brand-magenta/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Development"
                                className="w-full bg-background-input border border-border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-magenta/50 focus:ring-1 focus:ring-brand-magenta/20"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this prompt does"
                            className="w-full bg-background-input border border-border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-magenta/50 focus:ring-1 focus:ring-brand-magenta/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-full bg-brand-magenta/10 border border-brand-magenta/20 text-brand-magenta text-xs flex items-center gap-1.5">
                                    #{tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                placeholder="Add tag and press Enter"
                                className="flex-1 bg-background-input border border-border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-magenta/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 border-r border-border-subtle relative">
                        <Editor
                            height="100%"
                            defaultLanguage="markdown"
                            theme="vs-dark"
                            value={content}
                            onChange={handleContentChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on'
                            }}
                        />
                    </div>

                    {/* Configuration Panel */}
                    <div className="w-80 bg-surface-sidebar p-4 overflow-y-auto">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Variables ({variables.length})
                        </h3>

                        <div className="space-y-4">
                            {variables.map((variable, idx) => (
                                <div key={idx} className="p-3 bg-surface-card rounded-lg border border-border-subtle">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                            {variable.name}
                                        </span>
                                        <span className="text-xs text-text-muted capitalize">{variable.type}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-xs text-text-muted block mb-1">Label</label>
                                            <input
                                                type="text"
                                                value={variable.label}
                                                onChange={(e) => {
                                                    const newVars = [...variables];
                                                    newVars[idx].label = e.target.value;
                                                    setVariables(newVars);
                                                }}
                                                className="w-full bg-background-input border border-border-input rounded px-2 py-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {variables.length === 0 && (
                                <div className="text-center py-8 text-text-muted opacity-60">
                                    <p className="text-sm">No variables detected.</p>
                                    <p className="text-xs mt-1">Use <code>{`{{variable}}`}</code> syntax.</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/20 rounded-lg transition-colors text-sm font-medium">
                            <Play className="w-4 h-4" />
                            Test Run Prompt
                        </button>
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Modal */}
            {blocker.state === 'blocked' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface-card border border-border-subtle rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Unsaved Changes</h3>
                        <p className="text-text-muted mb-6">You have unsaved changes. Are you sure you want to leave?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => blocker.reset()}
                                className="px-4 py-2 rounded-lg border border-border-subtle hover:bg-white/5 text-text-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => blocker.proceed()}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                            >
                                Leave Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHistory && prompt && (
                <VersionHistory
                    versions={versions}
                    currentVersion={prompt.currentVersion}
                    onRestore={(v) => {
                        setContent(v.content);
                        setVariables(v.variables);
                        setChangeNote(`Restored from v${v.version}`);
                    }}
                />
            )}

            {showAnalytics && prompt && (
                <PromptAnalytics
                    prompt={prompt}
                    onClose={() => setShowAnalytics(false)}
                />
            )}
        </div>
    );
};
