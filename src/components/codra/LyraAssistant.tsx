/**
 * LYRA ASSISTANT
 * Chat-based Prompt Architect component with quick actions and conversation history
 */

import { useState, FormEvent } from 'react';
import { Project } from '../../domain/types';
import { Button } from '../../new/components/Button';
import '../../styles/lyra-assistant.css';

// ============================================
// Types
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
}

interface LyraAssistantProps {
  currentPrompt?: string;
  project?: Project | null;
  onPromptRefined?: (refinedPrompt: string) => void;
}

type LyraStatus = 'online' | 'offline' | 'thinking';

// ============================================
// API Stubs (replace with actual API calls)
// ============================================

interface RefinePromptParams {
  currentPrompt: string;
  project?: Project | null;
  action: string;
}

interface ChatParams {
  message: string;
  currentPrompt?: string;
  project?: Project | null;
}

async function refinePromptViaLyra(params: RefinePromptParams): Promise<{ suggestion: string; refinedPrompt: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const suggestions: Record<string, string> = {
    'review': `I've reviewed your prompt. Consider adding more context about your target audience "${params.project?.audience || 'your users'}" to make it more coherent with your project brief.`,
    'improve-coherence': `To improve coherence, try connecting your prompt to these project goals: ${params.project?.goals?.slice(0, 2).join(', ') || 'clarity, engagement'}. This will ensure outputs align with your vision.`,
    'refine-model': `For ${params.project?.aiPreferences?.qualityPriority || 'optimal'} results, I'd recommend structuring your prompt with clear sections: Context → Task → Constraints → Expected Format.`
  };
  
  return {
    suggestion: suggestions[params.action] || 'Try being more specific about the desired outcome.',
    refinedPrompt: params.currentPrompt + ' [refined]'
  };
}

async function chatWithLyra(_params: ChatParams): Promise<{ message: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const responses = [
    "Good question! Based on your project brief, I'd suggest focusing on clarity and specificity.",
    "I can help with that. Let's break down your prompt into smaller, more focused sections.",
    "That's a great approach! Consider adding context about your brand voice to maintain consistency.",
    "To improve coherence, try referencing your target audience's needs directly in the prompt."
  ];
  
  return {
    message: responses[Math.floor(Math.random() * responses.length)]
  };
}

// ============================================
// Component
// ============================================

export function LyraAssistant({ currentPrompt, project, onPromptRefined }: LyraAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<LyraStatus>('online');

  const quickActions = [
    { label: '📝 Review this prompt', action: 'review', requiresPrompt: true },
    { label: '✨ Improve coherence', action: 'improve-coherence', requiresPrompt: true },
    { label: `⚡ Refine for ${project?.aiPreferences?.qualityPriority || 'best model'}`, action: 'refine-model', requiresPrompt: true }
  ];

  async function handleQuickAction(action: string) {
    if (!currentPrompt) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Please write a prompt first, then I can help refine it.',
        timestamp: Date.now()
      }]);
      return;
    }

    setIsLoading(true);
    setStatus('thinking');

    try {
      const response = await refinePromptViaLyra({
        currentPrompt,
        project,
        action
      });

      const newMessage: ChatMessage = {
        role: 'assistant',
        content: response.suggestion,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newMessage]);
      setStatus('online');

      if (response.refinedPrompt && onPromptRefined) {
        onPromptRefined(response.refinedPrompt);
      }
    } catch {
      setStatus('offline');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Try again?',
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStatus('thinking');

    try {
      const response = await chatWithLyra({
        message: inputValue,
        currentPrompt,
        project
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now()
      }]);

      setStatus('online');
    } catch {
      setStatus('offline');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="lyra-assistant">
      <div className="lyra-header">
        <h3>LYRA ASSISTANT</h3>
        <div className={`status-indicator ${status}`}>
          <span className="dot"></span>
          <span className="label">
            {status === 'online' ? 'ONLINE' : status === 'thinking' ? 'THINKING' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <p className="lyra-intro">
        I can help you refine your prompts to ensure coherence with your brief.
      </p>

      {/* Quick Actions */}
      <div className="quick-actions">
        <label>Quick Actions:</label>
        {quickActions.map(action => (
          <Button
            key={action.action}
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction(action.action)}
            disabled={isLoading || (action.requiresPrompt && !currentPrompt)}
            title={!currentPrompt && action.requiresPrompt ? 'Write a prompt first' : ''}
            className="justify-start font-normal"
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Chat History */}
      {messages.length > 0 && (
        <div className="chat-history">
          <label>Recent conversation:</label>
          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                <strong>{msg.role === 'user' ? 'You' : 'Lyra'}:</strong>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="lyra-input-form">
        <label>Ask Lyra:</label>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="How can I make this more coherent?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            variant="primary"
            size="sm"
            title="Send message"
          >
            {isLoading ? '...' : '⏎'}
          </Button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <span className="spinner"></span>
          <p>Lyra is refining your prompt...</p>
        </div>
      )}
    </div>
  );
}
