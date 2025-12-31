/**
 * WRITE CANVAS
 * Consolidates Writing + Marketing desks
 * Rich text editor with AI commands for copy, content, and marketing materials
 */

import React, { useEffect, useRef } from 'react';
import { Type, AlignLeft, Bold, Italic, Hash, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ModelSelector } from '../ModelSelector';
import { useDeskState } from './hooks/useDeskState';

interface WriteCanvasProps {
  projectId: string;
  selectedModelId?: string;
  onSelectModel?: (modelId: string, providerId: string) => void;
}

export const WriteCanvas: React.FC<WriteCanvasProps> = ({ 
  projectId,
  selectedModelId = 'claude-3-5-sonnet-20241022', 
  onSelectModel 
}) => {
  const { getDeskState, updateDeskState } = useDeskState();
  const state = getDeskState(projectId, 'write');
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  // Parse initial content - real implementation would be more robust
  const initialContent = state.inputContent ? JSON.parse(state.inputContent) : { 
    title: 'The Strangler Fig: A Migration Strategy',
    body: 'In the layered world of software architecture, the strangler fig offers a slow, poetic takeover. It is not a violent replacement, but a gradual embrace.'
  };

  const handleUpdate = () => {
    const content = {
      title: titleRef.current?.innerText || '',
      body: bodyRef.current?.innerText || ''
    };
    updateDeskState(projectId, 'write', {
      inputContent: JSON.stringify(content)
    });
  };

  return (
    <div className="w-full h-full flex gap-12 pt-20">
      {/* Source Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 flex flex-col gap-8 shrink-0"
      >
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] text-[var(--desk-text-muted)] font-bold uppercase tracking-widest">Source Material</h3>
            <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider">Sanity</span>
          </div>
          <div className="space-y-3">
            {['Project Brief v2', 'Editorial Style Guide', 'Interview Transcripts'].map(doc => (
              <div key={doc} className="p-3 rounded-xl bg-[var(--desk-surface)] border border-[var(--desk-border)] hover:border-text-rose-500/50 transition-all cursor-pointer group text-left shadow-sm">
                <p className="text-[10px] text-[var(--desk-text-muted)] group-hover:text-[var(--desk-text-primary)] transition-colors uppercase font-bold tracking-tight">{doc}</p>
                <div className="mt-2 h-1 w-8 bg-[var(--desk-bg)] rounded-full group-hover:bg-rose-500 transition-all" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="p-4 rounded-xl border border-[var(--desk-border)] bg-[var(--desk-bg)]/10 border-dashed">
            <p className="text-[10px] font-mono text-[var(--desk-text-muted)] uppercase tracking-widest text-center">Syncing with CMS...</p>
          </div>
        </section>
      </motion.aside>

      {/* Writing Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 max-w-2xl mx-auto flex flex-col gap-12"
      >
        {/* Editorial Toolbar */}
        <div className="flex items-center justify-center gap-6 p-2 bg-[var(--desk-surface)]/80 backdrop-blur-xl border border-[var(--desk-border)] rounded-2xl w-fit mx-auto shadow-2xl">
          <div className="flex gap-1">
            <button className="p-2 hover:bg-[var(--desk-bg)] rounded-lg text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)] transition-all">
              <Bold size={16} />
            </button>
            <button className="p-2 hover:bg-[var(--desk-bg)] rounded-lg text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)] transition-all">
              <Italic size={16} />
            </button>
          </div>
          <div className="w-px h-6 bg-[var(--desk-border)]" />
          <div className="flex gap-1">
            <button className="p-2 hover:bg-[var(--desk-bg)] rounded-lg text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)] transition-all">
              <Type size={16} />
            </button>
            <button className="p-2 hover:bg-[var(--desk-bg)] rounded-lg text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)] transition-all">
              <AlignLeft size={16} />
            </button>
          </div>
          <div className="w-px h-6 bg-[var(--desk-border)]" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[var(--desk-text-muted)] uppercase tracking-widest ml-2">Voice</span>
            <ModelSelector
              selectedModelId={selectedModelId}
              onSelectModel={onSelectModel || (() => { })}
              filterTag="reasoning"
              variant="minimal"
              className="w-auto"
            />
          </div>
          <div className="w-px h-6 bg-[var(--desk-border)]" />
          <button className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 text-xs font-bold transition-all border border-rose-500/20">
            <Sparkles size={14} />
            Refine Voice
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-40 scrollbar-hide">
          <header className="mb-12 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--desk-text-muted)] uppercase tracking-[0.3em]">
              <Hash size={10} />
              Content Generation
            </div>
            <h1
              ref={titleRef}
              contentEditable
              onBlur={handleUpdate}
              suppressContentEditableWarning
              className="text-5xl font-black tracking-tight outline-none focus:text-[var(--desk-text-primary)] transition-colors text-[var(--desk-text-primary)]"
            >
              {initialContent.title}
            </h1>
          </header>

          <section className="space-y-8">
            <p
              ref={bodyRef}
              contentEditable
              onBlur={handleUpdate}
              suppressContentEditableWarning
              className="text-xl text-[var(--desk-text-muted)] leading-relaxed font-serif outline-none focus:text-[var(--desk-text-primary)] transition-colors text-left"
            >
              {initialContent.body}
            </p>

            <div className="p-6 rounded-2xl bg-[var(--desk-bg)]/10 border-2 border-dashed border-[var(--desk-border)] flex flex-col items-center justify-center gap-4 text-center">
              <Sparkles className="text-[var(--desk-border)]" size={24} />
              <p className="text-xs text-[var(--desk-text-muted)] font-mono uppercase tracking-widest">Type '/' to summon Lyra Editorial</p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
};
