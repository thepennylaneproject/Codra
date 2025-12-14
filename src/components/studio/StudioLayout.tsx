/**
 * STUDIO LAYOUT
 * Three-panel layout: Architect (left) | Flow Canvas (center) | Forge (right)
 * The core of the Codra creative automation experience
 */

import React, { useState, useCallback } from 'react';
import { PromptArchitectPanel } from './PromptArchitectPanel';
import { ForgePanel } from './ForgePanel';
import { FlowEditor } from '../flow/FlowEditor';
import { usePromptStore } from '../../lib/store/promptStore';
import { CreatePromptInput } from '../../types/prompt';

interface StudioLayoutProps {
  projectName?: string;
  onProjectChange?: (projectId: string) => void;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  projectName = 'Untitled Project'
  // onProjectChange is available for future use
}) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const { getPrompt, addPrompt } = usePromptStore();

  const selectedPrompt = selectedPromptId ? getPrompt(selectedPromptId) : null;

  const handlePromptSelect = useCallback((promptId: string) => {
    setSelectedPromptId(promptId);
  }, []);

  const handlePromptCreate = useCallback((prompt: CreatePromptInput) => {
    addPrompt(prompt);
  }, [addPrompt]);

  const handleExecutePrompt = async (input: string, model: string) => {
    // This will be connected to AILMAPI in Phase 3
    console.log('Executing prompt:', {
      promptId: selectedPromptId,
      model,
      input,
      promptContent: selectedPrompt?.content
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background-default overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border-subtle bg-background-elevated backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-heading-md text-cream font-bold">Codra Studio</h1>
            <p className="text-label-sm text-text-muted">{projectName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/studio/code"
            className="text-label-sm text-text-muted hover:text-brand-magenta transition-colors"
          >
            Code Editor
          </a>
          {selectedPrompt && (
            <div className="flex items-center gap-2">
              <span className="text-label-sm text-text-muted">ACTIVE:</span>
              <span className="text-body-md text-brand-magenta font-semibold">{selectedPrompt.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Left Panel: Prompt Architect */}
        <div className="w-64 flex-shrink-0 overflow-hidden border-r border-border-subtle">
          <PromptArchitectPanel
            onPromptSelect={handlePromptSelect}
            onPromptCreate={handlePromptCreate}
          />
        </div>

        {/* Center Panel: Flow Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-hidden bg-background-default">
            <FlowEditor />
          </div>
        </div>

        {/* Right Panel: Forge */}
        <div className="w-80 flex-shrink-0 overflow-hidden border-l border-border-subtle">
          <ForgePanel
            promptId={selectedPromptId || undefined}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onExecute={handleExecutePrompt}
          />
        </div>
      </div>
    </div>
  );
};

export default StudioLayout;
