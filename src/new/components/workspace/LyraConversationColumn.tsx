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

import { useState, useCallback, FormEvent, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLyraOptional } from '../../../lib/lyra';

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
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[11px] text-text-soft/40">
            Unavailable
          </p>
        </div>
      </div>
    );
  }

  // Lyra context is available

  return (
    <div className="h-full flex flex-col">
      {/* Header - silent divider only */}
      <div className="h-px bg-[var(--ui-border)]/15" />

      {/* Conversation Thread - margin notes feel */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.length === 0 ? (
          <div className="py-12" />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className={`text-[12px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-text-primary/80'
                    : 'text-text-soft/70'
                }`}
              >
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
            transition={{ duration: 0.1 }}
            className="text-text-soft/40"
          >
            <span className="text-[11px]">...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context Summary - quiet */}
      {contextSummary && (
        <div className="px-4 py-3 border-t border-[var(--ui-border)]/15">
          <p className="text-[11px] text-text-soft/50 leading-relaxed line-clamp-2">
            {contextSummary}
          </p>
          {onEditContext && (
            <button
              onClick={onEditContext}
              className="text-[10px] text-text-soft/30 hover:text-text-soft mt-1 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      )}

      {/* Input - borderless, no button */}
      <div className="px-4 py-3 border-t border-[var(--ui-border)]/15">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="..."
            className="w-full px-0 py-1 bg-transparent border-0 text-[12px] text-text-primary placeholder:text-text-soft/30 focus:outline-none"
          />
        </form>
      </div>
    </div>
  );
}
