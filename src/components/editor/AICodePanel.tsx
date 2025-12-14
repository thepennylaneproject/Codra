/**
 * AI Code Panel
 * Sidebar panel for AI-powered coding assistance in the editor
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAICompletion } from '../../hooks/useAICompletion';
import { Bot, Send, X, Loader2, Copy, Check } from 'lucide-react';
import type { AIMessage } from '../../lib/ai/types';
import { EditorModelSelector } from './EditorModelSelector';

export type AIAction = 'explain' | 'refactor' | 'review' | 'tests' | 'chat';

interface AICodePanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentFile?: {
        name: string;
        path: string;
        language: string;
        content: string;
    };
    selectedText?: string;
    initialAction?: AIAction;
    onActionComplete?: () => void;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const AICodePanel: React.FC<AICodePanelProps> = ({
    isOpen,
    onClose,
    currentFile,
    selectedText,
    initialAction,
    onActionComplete,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { loading, complete } = useAICompletion();

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // Auto-execute initial action when provided
    useEffect(() => {
        if (isOpen && initialAction && initialAction !== 'chat' && (selectedText || currentFile)) {
            executeAction(initialAction);
        }
    }, [isOpen, initialAction]);

    const buildContext = (): string => {
        let context = '';
        if (currentFile) {
            context += `Current file: ${currentFile.name} (${currentFile.language})\n`;
            context += `\`\`\`${currentFile.language}\n${currentFile.content}\n\`\`\`\n\n`;
        }
        if (selectedText) {
            context += `Selected code:\n\`\`\`\n${selectedText}\n\`\`\`\n\n`;
        }
        return context;
    };

    const getActionPrompt = (action: AIAction): string => {
        const code = selectedText || currentFile?.content || '';
        switch (action) {
            case 'explain':
                return `Explain this code in detail. What does it do, how does it work, and what are the key concepts?\n\n${code}`;
            case 'refactor':
                return `Refactor this code to improve readability, performance, and maintainability. Explain what changes you made and why.\n\n${code}`;
            case 'review':
                return `Review this code for bugs, security issues, performance problems, and style improvements. Provide a severity rating for each issue found.\n\n${code}`;
            case 'tests':
                return `Generate comprehensive unit tests for this code. Include edge cases and error scenarios.\n\n${code}`;
            default:
                return code;
        }
    };

    const executeAction = async (action: AIAction) => {
        const prompt = getActionPrompt(action);
        const userMessage: ChatMessage = {
            role: 'user',
            content: prompt,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        const context = buildContext();
        const systemPrompt = `You are an expert AI coding assistant. Be concise and helpful.
${context ? `Context:\n${context}` : ''}`;

        const apiMessages: AIMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ];

        const result = await complete(apiMessages, {
            model: selectedModelId,
            temperature: 0.3,
            maxTokens: 2048,
        });

        if (result) {
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: result.content,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            onActionComplete?.();
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Build messages for API
        const context = buildContext();
        const systemPrompt = `You are an expert AI coding assistant. Be concise and helpful.
${context ? `Context:\n${context}` : ''}`;

        const apiMessages: AIMessage[] = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user', content: input },
        ];

        const result = await complete(apiMessages, {
            model: selectedModelId,
            temperature: 0.3,
            maxTokens: 2048,
        });

        if (result) {
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: result.content,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
    };

    const handleCopy = async (content: string, index: number) => {
        await navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 h-full flex flex-col bg-[#0a0c0f] border-l border-[rgba(243,244,230,0.09)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(243,244,230,0.09)]">
                <div className="flex items-center gap-2">
                    <Bot size={18} className="text-[#4e808d]" />
                    <span className="text-sm font-medium text-[#f3f4e6]">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="text-xs text-[#6b7280] hover:text-[#f3f4e6] transition-colors"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 text-[#6b7280] hover:text-[#f3f4e6] transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Model Selector */}
            <div className="px-3 py-2 border-b border-[rgba(243,244,230,0.09)]">
                <EditorModelSelector
                    selectedModelId={selectedModelId}
                    onModelChange={(modelId) => setSelectedModelId(modelId)}
                />
            </div>

            {/* Context Indicator */}
            {currentFile && (
                <div className="px-3 py-2 bg-[#0f1214] text-xs text-[#6b7280]">
                    <span className="text-[#4e808d]">Context:</span> {currentFile.name}
                    {selectedText && <span className="ml-2 text-[#c7a76a]">+ selection</span>}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-[#6b7280] text-sm py-6">
                        <Bot size={28} className="mx-auto mb-3 opacity-40" />
                        <p className="mb-4">What would you like to do?</p>
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2 px-2">
                            <button
                                onClick={() => executeAction('explain')}
                                disabled={!selectedText && !currentFile}
                                className="px-3 py-2 bg-[#1a1d21] border border-[rgba(243,244,230,0.09)] rounded-lg text-xs hover:bg-[rgba(243,244,230,0.05)] hover:text-[#f3f4e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                💡 Explain
                            </button>
                            <button
                                onClick={() => executeAction('refactor')}
                                disabled={!selectedText && !currentFile}
                                className="px-3 py-2 bg-[#1a1d21] border border-[rgba(243,244,230,0.09)] rounded-lg text-xs hover:bg-[rgba(243,244,230,0.05)] hover:text-[#f3f4e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                🔄 Refactor
                            </button>
                            <button
                                onClick={() => executeAction('review')}
                                disabled={!selectedText && !currentFile}
                                className="px-3 py-2 bg-[#1a1d21] border border-[rgba(243,244,230,0.09)] rounded-lg text-xs hover:bg-[rgba(243,244,230,0.05)] hover:text-[#f3f4e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                🔍 Review
                            </button>
                            <button
                                onClick={() => executeAction('tests')}
                                disabled={!selectedText && !currentFile}
                                className="px-3 py-2 bg-[#1a1d21] border border-[rgba(243,244,230,0.09)] rounded-lg text-xs hover:bg-[rgba(243,244,230,0.05)] hover:text-[#f3f4e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                🧪 Tests
                            </button>
                        </div>
                        <p className="mt-4 text-xs opacity-60">Or type a question below</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`${msg.role === 'user'
                                ? 'ml-8 bg-[#4e808d]/20 border-[#4e808d]/30'
                                : 'mr-4 bg-[#1a1d21] border-[rgba(243,244,230,0.09)]'
                                } rounded-lg p-3 border text-sm text-[#f3f4e6]`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 whitespace-pre-wrap break-words">
                                    {msg.content}
                                </div>
                                {msg.role === 'assistant' && (
                                    <button
                                        onClick={() => handleCopy(msg.content, i)}
                                        className="flex-shrink-0 p-1 text-[#6b7280] hover:text-[#f3f4e6] transition-colors"
                                    >
                                        {copiedIndex === i ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex items-center gap-2 text-[#6b7280] text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[rgba(243,244,230,0.09)]">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your code..."
                        className="flex-1 bg-[#1a1d21] border border-[rgba(243,244,230,0.09)] rounded-lg px-3 py-2 text-sm text-[#f3f4e6] placeholder-[#6b7280] resize-none focus:outline-none focus:border-[#4e808d] transition-colors"
                        rows={2}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="self-end p-2 bg-[#4e808d] text-white rounded-lg hover:bg-[#3d646e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
