import React, { useEffect, useRef, useState } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { EditorFile } from './types';
import { configureMonaco } from './monaco-config';
import designTokens from '../../lib/design-tokens';
import { FileTree } from './FileTree';
import { EditorTabs } from './EditorTabs';
import { AICodePanel, AIAction } from './AICodePanel';
import { Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { usePromptArchitect } from '../../lib/prompt-architect';
import { getInlineCompletionProvider, registerInlineCompletionProvider } from '../../lib/ai/inline-completion-provider';

interface CodeEditorProps {
    files: EditorFile[];
    activeFileId: string;
    fileSystemTree: any[]; // Using any temporarily or import FileSystemNode matching the FileTree expectation
    onFileChange: (fileId: string, content: string) => void;
    onFileSelect: (fileIdOrNode: any) => void;
    onFileSave: (fileId: string) => void;
    onFileClose: (fileId: string) => void;
    onToggleDirectory: (path: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    files,
    activeFileId,
    fileSystemTree,
    onFileChange,
    onFileSelect,
    onFileSave,
    onFileClose,
    onToggleDirectory,
}) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [selectedText, setSelectedText] = useState<string>('');
    const [aiAction, setAiAction] = useState<AIAction>('chat');
    const [inlineCompletionsEnabled, setInlineCompletionsEnabled] = useState(true);
    const inlineProviderRef = useRef<ReturnType<typeof getInlineCompletionProvider> | null>(null);
    const { session } = useAuth();
    const { open: openPromptArchitect } = usePromptArchitect();

    // Configure theme once
    useEffect(() => {
        configureMonaco();
    }, []);

    // Set up inline completion provider with auth token
    useEffect(() => {
        if (session?.access_token && monacoRef.current) {
            const provider = getInlineCompletionProvider();
            provider.setAccessToken(session.access_token);
            provider.setEnabled(inlineCompletionsEnabled);
            inlineProviderRef.current = provider;
        }
    }, [session?.access_token, inlineCompletionsEnabled]);

    // Toggle inline completions
    const toggleInlineCompletions = () => {
        const newValue = !inlineCompletionsEnabled;
        setInlineCompletionsEnabled(newValue);
        if (inlineProviderRef.current) {
            inlineProviderRef.current.setEnabled(newValue);
        }
    };

    const activeFile = files.find((f) => f.id === activeFileId);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Add keybinding for Save (Cmd+S)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (activeFileId) {
                onFileSave(activeFileId);
            }
        });

        // Add "Ask AI" action to context menu
        editor.addAction({
            id: 'ask-ai',
            label: '🤖 Ask AI',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA],
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1,
            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();
                if (selection && model) {
                    const text = model.getValueInRange(selection);
                    setSelectedText(text || '');
                }
                setAiAction('chat');
                setIsAIPanelOpen(true);
            }
        });

        // Add Explain Selection action
        editor.addAction({
            id: 'explain-selection',
            label: '💡 Explain Selection',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 2,
            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();
                if (selection && model) {
                    const text = model.getValueInRange(selection);
                    setSelectedText(text || '');
                }
                setAiAction('explain');
                setIsAIPanelOpen(true);
            }
        });

        // Add Refactor action
        editor.addAction({
            id: 'refactor-selection',
            label: '🔄 Refactor Code',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 3,
            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();
                if (selection && model) {
                    const text = model.getValueInRange(selection);
                    setSelectedText(text || '');
                }
                setAiAction('refactor');
                setIsAIPanelOpen(true);
            }
        });

        // Add Code Review action
        editor.addAction({
            id: 'review-code',
            label: '🔍 Review Code',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 4,
            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();
                if (selection && model) {
                    const text = model.getValueInRange(selection);
                    setSelectedText(text || '');
                }
                setAiAction('review');
                setIsAIPanelOpen(true);
            }
        });

        // Add Generate Tests action
        editor.addAction({
            id: 'generate-tests',
            label: '🧪 Generate Tests',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 5,
            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();
                if (selection && model) {
                    const text = model.getValueInRange(selection);
                    setSelectedText(text || '');
                }
                setAiAction('tests');
                setIsAIPanelOpen(true);
            }
        });

        // Add Prompt Architect action
        editor.addAction({
            id: 'open-prompt-architect',
            label: '✨ Generate with Prompt Architect',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 6,
            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();
                let context = '';
                if (selection && model) {
                    context = model.getValueInRange(selection) || '';
                }
                openPromptArchitect({
                    outputType: 'code',
                    taskDescription: context ? `Improve or extend this code:\n${context}` : activeFile?.name || 'Code generation',
                });
            }
        });

        // We can verify the theme is applied here
        monaco.editor.setTheme('codra-dark');

        // Register inline completion provider
        if (session?.access_token) {
            const provider = getInlineCompletionProvider();
            provider.setAccessToken(session.access_token);
            provider.setEnabled(inlineCompletionsEnabled);
            inlineProviderRef.current = provider;
            // Register for multiple languages
            registerInlineCompletionProvider(monaco, provider);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (activeFileId && value !== undefined) {
            onFileChange(activeFileId, value);
        }
    };

    return (
        <div className="flex h-full w-full bg-[#0f1214] text-[#f3f4e6] font-sans overflow-hidden border border-[rgba(243,244,230,0.09)] rounded-xl shadow-2xl">
            {/* Sidebar - File Tree */}
            {isSidebarOpen && (
                <div className="w-64 border-r border-[rgba(243,244,230,0.09)] flex flex-col bg-[#070a0e]">
                    <div className="p-3 text-xs font-bold text-[#6b7280] uppercase tracking-wider flex justify-between items-center">
                        <span>Explorer</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="hover:text-[#f3f4e6] transition-colors">
                            ←
                        </button>
                    </div>
                    <FileTree
                        nodes={fileSystemTree}
                        activeFileId={activeFileId}
                        onSelect={onFileSelect}
                        onToggle={onToggleDirectory}
                    />
                </div>
            )}

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Tabs */}
                <div className="flex items-center bg-[#070a0e] border-b border-[rgba(243,244,230,0.09)]">
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-[#6b7280] hover:text-[#f3f4e6] border-r border-[rgba(243,244,230,0.09)]"
                        >
                            →
                        </button>
                    )}
                    <EditorTabs
                        files={files}
                        activeFileId={activeFileId}
                        onSelect={onFileSelect}
                        onClose={onFileClose}
                    />
                    {/* AI Panel Toggle */}
                    <button
                        onClick={toggleInlineCompletions}
                        className={`p-2 transition-colors border-l border-[rgba(243,244,230,0.09)] ${inlineCompletionsEnabled
                            ? 'text-[#c7a76a] bg-[#c7a76a]/10'
                            : 'text-[#6b7280] hover:text-[#f3f4e6]'
                            }`}
                        title={`Inline AI Completions: ${inlineCompletionsEnabled ? 'ON' : 'OFF'}`}
                    >
                        <Sparkles size={18} />
                    </button>
                    <button
                        onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
                        className={`p-2 transition-colors border-l border-[rgba(243,244,230,0.09)] ${isAIPanelOpen
                            ? 'text-[#4e808d] bg-[#4e808d]/10'
                            : 'text-[#6b7280] hover:text-[#f3f4e6]'
                            }`}
                        title="Toggle AI Assistant (Cmd+Shift+A)"
                    >
                        <Bot size={18} />
                    </button>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 relative">
                    {activeFile ? (
                        <Editor
                            height="100%"
                            theme="codra-dark"
                            path={activeFile.path} // Important for model URI and intellisense isolation
                            defaultLanguage={activeFile.language}
                            language={activeFile.language}
                            defaultValue={activeFile.content}
                            value={activeFile.content}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            options={{
                                fontFamily: designTokens.FONT_FAMILY.mono.replace(/"/g, ''), // Strip quotes for Monaco config if needed, or pass string
                                fontSize: 14,
                                minimap: { enabled: true },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                lineNumbers: 'on',
                                glyphMargin: false, // Cleaner look
                                folding: true,
                                renderLineHighlight: 'all',
                                contextmenu: true,
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[#6b7280]">
                            <p>No file open</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Assistant Panel */}
            <AICodePanel
                isOpen={isAIPanelOpen}
                onClose={() => {
                    setIsAIPanelOpen(false);
                    setAiAction('chat');
                }}
                currentFile={activeFile ? {
                    name: activeFile.name,
                    path: activeFile.path,
                    language: activeFile.language,
                    content: activeFile.content,
                } : undefined}
                selectedText={selectedText}
                initialAction={aiAction}
                onActionComplete={() => setAiAction('chat')}
            />
        </div>
    );
};
