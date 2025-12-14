/**
 * React Component: AI Completion Panel
 * Demonstrates using the AI adapters with a production-ready UI
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAICompletion } from '../../hooks/useAICompletion';
import { useAIStream } from '../../hooks/useAIStream';
import type { AIMessage } from '../../lib/ai/types';

interface AICompletionPanelProps {
    initialPrompt?: string;
    onComplete?: (content: string) => void;
}

export const AICompletionPanel: React.FC<AICompletionPanelProps> = ({
    initialPrompt = '',
    onComplete,
}) => {
    const [messages, setMessages] = useState<AIMessage[]>([
        {
            role: 'system' as const,
            content: 'You are a helpful coding assistant.',
        },
    ]);
    const [input, setInput] = useState(initialPrompt);
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [useStream, setUseStream] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const aiCompletion = useAICompletion();
    const aiStream = useAIStream();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: AIMessage = {
            role: 'user',
            content: input,
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');

        if (useStream) {
            await aiStream.stream(newMessages, {
                model: selectedModel,
                onChunk: (chunk) => {
                    // Update the last message with accumulated content
                    setMessages((prev) => [
                        ...prev.slice(0, -1),
                        {
                            role: 'assistant',
                            content: (prev[prev.length - 1]?.content || '') + chunk,
                        },
                    ]);
                },
            });
        } else {
            const result = await aiCompletion.complete(newMessages, {
                model: selectedModel,
            });

            if (result) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: result.content,
                    },
                ]);
                onComplete?.(result.content);
            }
        }
    };

    const isLoading = aiCompletion.loading || aiStream.loading;
    const hasError = aiCompletion.error || aiStream.error;
    const currentCost = aiCompletion.result?.cost || aiStream.cost;

    return (
        <div className="flex flex-col h-full bg-zinc-950 rounded-lg border border-indigo-900/20">
            {/* Header */}
            <div className="p-4 border-b border-indigo-900/20">
                <h2 className="text-lg font-semibold text-white mb-4">AI Assistant</h2>

                {/* Controls */}
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-zinc-400 mb-1 block">Model</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-3 py-2 bg-zinc-900 border border-indigo-900/30 rounded text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                        >
                            <option value="gpt-4o">GPT-4o</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                            <option value="deepseek-chat">DeepSeek Chat</option>
                            <option value="gemini-pro">Gemini Pro</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-zinc-400">
                            <input
                                type="checkbox"
                                checked={useStream}
                                onChange={(e) => setUseStream(e.target.checked)}
                                disabled={isLoading}
                                className="w-4 h-4"
                            />
                            Stream
                        </label>

                        {currentCost !== null && (
                            <div className="text-xs text-amber-400">
                                Cost: ${currentCost.toFixed(4)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                    : 'bg-zinc-900 text-zinc-200 border border-indigo-900/20'
                                }`}
                        >
                            {msg.role === 'system' ? (
                                <p className="text-xs text-zinc-500 italic">{msg.content}</p>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-900 border border-indigo-900/20 px-4 py-2 rounded-lg">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}

                {hasError && (
                    <div className="bg-red-900/20 border border-red-900/50 px-4 py-2 rounded text-red-300 text-sm">
                        {aiCompletion.error || aiStream.error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-indigo-900/20">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-zinc-900 border border-indigo-900/30 rounded text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                    >
                        {isLoading ? 'Loading...' : 'Send'}
                    </button>

                    {isLoading && useStream && (
                        <button
                            onClick={() => aiStream.cancel()}
                            className="px-3 py-2 bg-zinc-900 border border-red-900/30 text-red-400 rounded text-sm hover:bg-red-900/10 transition-all"
                        >
                            Stop
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};