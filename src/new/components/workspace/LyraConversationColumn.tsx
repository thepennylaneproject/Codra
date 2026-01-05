/**
 * LYRA CONVERSATION COLUMN
 * src/new/components/workspace/LyraConversationColumn.tsx
 *
 * The left column for conversational planning with Lyra.
 *
 * Purpose:
 * - Reasoning, negotiation, clarification
 * - Persistent conversational thread
 * - Visually subdued - Lyra is a collaborator at your side, not the stage
 *
 * This is where:
 * - Scope is discussed
 * - Changes are negotiated
 * - Confirmations happen
 *
 * Visual rules:
 * - Narrow column
 * - Smaller typography than outputs
 * - No cards, no "chat bubbles"
 */

import React, { useState, useCallback, FormEvent, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { useLyraOptional } from '../../../lib/lyra';
import { LyraAvatar } from '../LyraAvatar';
import { Button } from '@/components/ui/Button';

interface ConversationMessage {
  id: string;
  role: 'user' | 'lyra';
  content: string;
  timestamp: Date;
  type?: 'clarification' | 'confirmation' | 'suggestion' | 'response';
}

interface LyraConversationColumnProps {
  spreadId?: string;
  deskId?: string;
  onSendMessage?: (message: string) => void;
  contextSummary?: string;
  onEditContext?: () => void;
}

export function LyraConversationColumn({
  spreadId,
  deskId,
  onSendMessage,
  contextSummary,
  onEditContext,
}: LyraConversationColumnProps) {
  const lyra = useLyraOptional();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Notify parent
    onSendMessage?.(input.trim());

    // Simulate Lyra response (in real implementation, this would come from the backend)
    setTimeout(() => {
      const lyraResponse: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'lyra',
        content: 'Understood. I\'ll prepare the execution plan.',
        timestamp: new Date(),
        type: 'confirmation',
      };
      setMessages(prev => [...prev, lyraResponse]);
      setIsThinking(false);
    }, 800);
  }, [input, onSendMessage]);

  // If Lyra context isn't available, show minimal state
  if (!lyra) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="space-y-3">
            <Sparkles size={24} className="mx-auto text-zinc-300" />
            <p className="text-xs text-text-soft">
              Lyra available after project setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { state } = lyra;

  return (
    <div className="h-full flex flex-col">
      {/* Header - Minimal */}
      <div className="px-4 py-3 border-b border-[var(--ui-border)]/40">
        <div className="flex items-center gap-2">
          <LyraAvatar appearance={state.appearance} size={20} showGlow={false} />
          <span className="text-[10px] font-semibold text-text-soft uppercase tracking-wider">
            Lyra
          </span>
        </div>
      </div>

      {/* Conversation Thread - No bubbles, clean lines */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-text-soft/60 italic">
              Discuss scope, negotiate changes, confirm direction.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-text-primary'
                    : 'text-text-soft'
                }`}
              >
                {/* Role indicator - subtle */}
                <span className="block text-[9px] uppercase tracking-wider text-text-soft/50 mb-1">
                  {msg.role === 'user' ? 'You' : 'Lyra'}
                </span>
                {/* Message content - no bubble wrapper */}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Thinking indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-text-soft/60"
          >
            <div className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse" />
            <span className="text-[11px]">Thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context Summary - Grounding info */}
      {contextSummary && (
        <div className="px-4 py-3 border-t border-[var(--ui-border)]/40 bg-[var(--color-ivory)]/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-wider text-text-soft/50">
              Context
            </span>
            {onEditContext && (
              <button
                onClick={onEditContext}
                className="text-[10px] text-text-soft hover:text-text-primary transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          <p className="text-[12px] text-text-soft leading-relaxed line-clamp-2">
            {contextSummary}
          </p>
        </div>
      )}

      {/* Input - Clean, minimal */}
      <div className="px-4 py-3 border-t border-[var(--ui-border)]/40">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Lyra..."
            className="w-full px-3 py-2 pr-10 bg-transparent border border-[var(--ui-border)]/60 rounded-lg text-[13px] text-text-primary placeholder:text-text-soft/40 focus:outline-none focus:border-zinc-400 transition-colors"
          />
          <Button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-soft hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </Button>
        </form>
      </div>
    </div>
  );
}
