/**
 * PROMPT ARCHITECT PANEL
 * Left sidebar for designing, creating, and managing prompts
 * Part of the three-panel Codra studio layout
 */

import React, { useState } from 'react';
import { usePromptStore } from '../../lib/store/promptStore';
import { ArchitectIcon, SaveIcon, PlusIcon, SearchIcon } from '../icons';
import { CreatePromptInput } from '../../types/prompt';
import { cn } from '../../lib/utils';

interface PromptArchitectPanelProps {
  onPromptSelect?: (promptId: string) => void;
  onPromptCreate?: (prompt: CreatePromptInput) => void;
}

export const PromptArchitectPanel: React.FC<PromptArchitectPanelProps> = ({
  onPromptSelect,
  onPromptCreate
}) => {
  const {
    prompts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    addPrompt
  } = usePromptStore();

  const [showNewPromptForm, setShowNewPromptForm] = useState(false);
  const [formData, setFormData] = useState<CreatePromptInput>({
    name: '',
    description: '',
    content: '',
    tags: [],
    category: 'Development',
    variables: [],
    isPublic: false,
    isFavorite: false,
    userId: 'current-user' // Will be replaced with actual user ID from auth
  });

  // Filter prompts based on search
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Name and content are required');
      return;
    }

    // Add to store
    addPrompt(formData);

    // Callback
    if (onPromptCreate) {
      onPromptCreate(formData);
    }

    // Reset form
    setFormData({
      name: '',
      description: '',
      content: '',
      tags: [],
      category: 'Development',
      variables: [],
      userId: 'current-user',
      isPublic: false,
      isFavorite: false
    });
    setShowNewPromptForm(false);
  };

  const categories = Array.from(new Set(prompts.map(p => p.category)));

  return (
    <div className="h-full flex flex-col bg-background-elevated border-r border-border-subtle">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-4">
          <ArchitectIcon size={20} color="#F4D03F" />
          <h2 className="text-label-md text-cream font-semibold">PROMPT ARCHITECT</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon
            size={16}
            color="#A8B0BB"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background-default border border-border-subtle rounded-full text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20 transition-all"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="text-label-sm text-text-muted mb-2">CATEGORY</div>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-body-md transition-all',
              !selectedCategory
                ? 'bg-brand-magenta/20 text-brand-magenta border border-brand-magenta/50'
                : 'text-text-primary hover:bg-background-default'
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-body-md transition-all',
                selectedCategory === cat
                  ? 'bg-brand-magenta/20 text-brand-magenta border border-brand-magenta/50'
                  : 'text-text-primary hover:bg-background-default'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-body-sm">
            No prompts found. Create one to get started!
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {filteredPrompts.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => onPromptSelect?.(prompt.id)}
                className="w-full text-left px-3 py-3 rounded-lg bg-background-default border border-border-subtle hover:border-brand-gold hover:bg-background-subtle transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body-md font-semibold text-text-primary truncate group-hover:text-brand-gold">
                      {prompt.name}
                    </h3>
                    <p className="text-body-sm text-text-muted truncate mt-1">
                      {prompt.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {prompt.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="inline-block text-xs px-2 py-1 rounded-full bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/30"
                        >
                          {tag}
                        </span>
                      ))}
                      {prompt.tags.length > 2 && (
                        <span className="text-xs text-text-muted">+{prompt.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Create New Prompt */}
      <div className="border-t border-border-subtle p-3">
        {showNewPromptForm ? (
          <form onSubmit={handleCreatePrompt} className="space-y-3">
            <input
              type="text"
              placeholder="Prompt name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20"
            />

            <textarea
              placeholder="Prompt content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20 resize-none h-24"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-magenta text-background-default rounded-full text-label-sm font-semibold hover:bg-brand-magenta hover:brightness-110 transition-all"
              >
                <SaveIcon size={16} />
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowNewPromptForm(false)}
                className="flex-1 px-3 py-2 bg-background-default border border-border-strong text-text-primary rounded-full text-label-sm font-semibold hover:bg-background-subtle transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewPromptForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-magenta/20 border border-brand-magenta/50 text-brand-magenta rounded-full text-label-md font-semibold hover:bg-brand-magenta/30 hover:border-brand-magenta transition-all"
          >
            <PlusIcon size={18} color="#D81159" />
            New Prompt
          </button>
        )}
      </div>
    </div>
  );
};

export default PromptArchitectPanel;
