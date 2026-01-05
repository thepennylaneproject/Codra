/**
 * LYRA ASSISTANT
 * Chat-based Prompt Architect component with quick actions and conversation history
 */

import { useState, FormEvent } from 'react';
import { Project } from '../../domain/types';
import { Button } from '@/components/ui/Button';
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
    'review': `Prompt review: add target-audience context (${params.project?.audience || 'audience'}) to align with the project brief.`,
    'improve-coherence': `Coherence update: link the prompt to project goals (${params.project?.goals?.slice(0, 2).join(', ') || 'clarity, engagement'}).`,
    'refine-model': `Prompt structure for ${params.project?.aiPreferences?.qualityPriority || 'standard'}: Context → Task → Constraints → Output format.`
  };
  
  return {
    suggestion: suggestions[params.action] || 'Specify the desired outcome and constraints.',
    refinedPrompt: params.currentPrompt + ' [refined]'
  };
}

async function chatWithLyra(_params: ChatParams): Promise<{ message: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const responses = [
    "Prompt guidance: prioritize clarity and specificity based on the project brief.",
    "Prompt decomposition: separate context, task, constraints, and output format.",
    "Consistency update: add brand voice context to preserve alignment.",
    "Coherence update: reference target-audience needs directly in the prompt."
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
    { label: 'Review prompt', action: 'review', requiresPrompt: true },
    { label: 'Improve coherence', action: 'improve-coherence', requiresPrompt: true },
    { label: `Refine for ${project?.aiPreferences?.qualityPriority || 'standard'}`, action: 'refine-model', requiresPrompt: true }
  ];

  async function handleQuickAction(action: string) {
    if (!currentPrompt) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Prompt required before refinement.',
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
        content: 'Error occurred. Retry.',
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
        content: 'Error occurred. Retry.',
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
        <h3>Lyra module</h3>
        <div className={`status-indicator ${status}`}>
          <span className="dot"></span>
          <span className="label">
            {status === 'online' ? 'Status: Available' : status === 'thinking' ? 'Status: Busy' : 'Status: Unavailable'}
          </span>
        </div>
      </div>

      <p className="lyra-intro">
        Refines prompts to align with the project brief.
      </p>

      {/* Quick Actions */}
      <div className="quick-actions">
        <label>Available operations:</label>
        {quickActions.map(action => (
          <Button
            key={action.action}
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction(action.action)}
            disabled={isLoading || (action.requiresPrompt && !currentPrompt)}
            title={!currentPrompt && action.requiresPrompt ? 'Prompt required' : ''}
            className="justify-start font-normal"
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Chat History */}
      {messages.length > 0 && (
        <div className="chat-history">
          <label>Recent messages:</label>
          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                <strong>{msg.role === 'user' ? 'User' : 'Lyra'}:</strong>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="lyra-input-form">
        <label>Prompt query</label>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Enter prompt query"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            variant="primary"
            size="sm"
            title="Send"
          >
            {isLoading ? '...' : '⏎'}
          </Button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <span className="spinner"></span>
          <p>Refinement in progress.</p>
        </div>
      )}
    </div>
  );
}
