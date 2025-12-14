import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Code, Loader2 } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface CodeChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (message: string) => Promise<string>;
    contextFiles?: string[];
}

export const CodeChatPanel: React.FC<CodeChatPanelProps> = ({ isOpen, onClose, onSendMessage, contextFiles = [] }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await onSendMessage(userMsg.content);
            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "I encountered an error processing your request." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`fixed top-0 right-0 h-full w-96 bg-zinc-900 border-l border-zinc-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-100">
                        <Code className="w-5 h-5 text-indigo-500" />
                        <span className="font-semibold">Codra Assistant</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Context Indicator */}
                {contextFiles.length > 0 && (
                    <div className="px-4 py-2 bg-zinc-800/50 text-xs text-zinc-400 border-b border-zinc-800 flex flex-wrap gap-2">
                        <span>Context:</span>
                        {contextFiles.map((file, i) => (
                            <span key={i} className="bg-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 border border-zinc-700">
                                {file.split('/').pop()}
                            </span>
                        ))}
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-zinc-500 mt-10">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Ask me anything about your code.</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
                                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 bg-zinc-900">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className="w-full bg-zinc-800 text-zinc-100 rounded-md py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-zinc-700"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-indigo-400 disabled:opacity-50 disabled:hover:text-zinc-400 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-2 text-[10px] text-center text-zinc-600">
                        AI can make mistakes. Review generated code.
                    </div>
                </form>
            </div>
        </div>
    );
};
