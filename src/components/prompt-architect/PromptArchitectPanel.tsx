/**
 * PROMPT ARCHITECT - Main Panel Component
 * src/components/prompt-architect/PromptArchitectPanel.tsx
 * 
 * Dockable, movable, resizable panel for prompt generation
 */

import React, { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { usePromptArchitectStore } from '../../lib/prompt-architect';
import { usePromptArchitectDock, getResizeEdges, RESIZE_CURSORS } from '../../hooks/usePromptArchitectDock';
import { PromptArchitectHeader } from './PromptArchitectHeader';
import { IntentInput } from './IntentInput';
import { ClarificationPanel } from './ClarificationPanel';
import { PromptOutput } from './PromptOutput';
import { PromptArchitectFooter } from './PromptArchitectFooter';
import { cn } from '../../lib/utils';

// ============================================================
// Component
// ============================================================

export const PromptArchitectPanel: React.FC = () => {
    const isVisible = usePromptArchitectStore(state => state.isVisible);
    const panelConfig = usePromptArchitectStore(state => state.panelConfig);
    const updatePanelConfig = usePromptArchitectStore(state => state.updatePanelConfig);
    const hide = usePromptArchitectStore(state => state.hide);
    const generatedPrompt = usePromptArchitectStore(state => state.generatedPrompt);

    // Docking hook
    const {
        isDragging,
        isResizing,
        panelStyle,
        startDrag,
        startResize,
        toggleFloating,
    } = usePromptArchitectDock(panelConfig, updatePanelConfig);

    const isFloating = panelConfig.state === 'floating';
    const isDocked = panelConfig.state === 'docked';

    // Get applicable resize edges
    const resizeEdges = getResizeEdges(panelConfig.state, panelConfig.dockPosition);

    // Handlers
    const handleClose = useCallback(() => {
        hide();
    }, [hide]);

    const handleSave = useCallback(() => {
        if (generatedPrompt) {
            // TODO: Implement save to prompt library
            console.log('Saving prompt:', generatedPrompt);
        }
    }, [generatedPrompt]);

    const handleRun = useCallback(() => {
        if (generatedPrompt) {
            // TODO: Implement run with selected model
            console.log('Running prompt:', generatedPrompt);
        }
    }, [generatedPrompt]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop for floating mode */}
                    {isFloating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-[79] bg-black/20"
                            onClick={handleClose}
                        />
                    )}

                    {/* Panel */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            x: isDocked && panelConfig.dockPosition === 'right' ? 50 :
                                isDocked && panelConfig.dockPosition === 'left' ? -50 : 0,
                            y: isDocked && panelConfig.dockPosition === 'bottom' ? 50 :
                                isFloating ? -10 : 0,
                            scale: isFloating ? 0.98 : 1,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            x: isDocked && panelConfig.dockPosition === 'right' ? 50 :
                                isDocked && panelConfig.dockPosition === 'left' ? -50 : 0,
                            y: isDocked && panelConfig.dockPosition === 'bottom' ? 50 :
                                isFloating ? 10 : 0,
                            scale: isFloating ? 0.98 : 1,
                        }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        style={panelStyle}
                        className={cn(
                            'flex flex-col',
                            'bg-glass backdrop-blur-xl',
                            'border border-glass-edge',
                            isFloating && 'rounded-xl shadow-cosmic',
                            isDocked && panelConfig.dockPosition === 'left' && 'border-l-0 rounded-r-lg',
                            isDocked && panelConfig.dockPosition === 'right' && 'border-r-0 rounded-l-lg',
                            isDocked && panelConfig.dockPosition === 'bottom' && 'border-b-0 rounded-t-lg',
                            (isDragging || isResizing) && 'select-none',
                            'overflow-hidden'
                        )}
                    >
                        {/* Drag Handle (floating mode only) */}
                        {isFloating && (
                            <div
                                onMouseDown={startDrag}
                                onTouchStart={startDrag}
                                className="absolute top-0 left-0 right-0 h-10 cursor-move z-10"
                            />
                        )}

                        {/* Resize Handles */}
                        {resizeEdges.map(edge => (
                            <ResizeHandle
                                key={edge}
                                edge={edge}
                                onMouseDown={(e) => startResize(e, edge)}
                                onTouchStart={(e) => startResize(e, edge)}
                            />
                        ))}

                        {/* Header */}
                        <PromptArchitectHeader
                            onClose={handleClose}
                            onToggleFloat={toggleFloating}
                            onSave={handleSave}
                            onRun={handleRun}
                            isFloating={isFloating}
                        />

                        {/* Body */}
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                            {/* Intent Input */}
                            <IntentInput />

                            {/* Clarification Panel (conditional) */}
                            <ClarificationPanel />

                            {/* Prompt Output */}
                            <PromptOutput />
                        </div>

                        {/* Footer */}
                        <PromptArchitectFooter />

                        {/* Dock Position Indicator (when docked) */}
                        {isDocked && (
                            <DockIndicator position={panelConfig.dockPosition} />
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ============================================================
// Resize Handle
// ============================================================

interface ResizeHandleProps {
    edge: string;
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ edge, onMouseDown, onTouchStart }) => {
    const cursor = RESIZE_CURSORS[edge as keyof typeof RESIZE_CURSORS];

    // Position classes based on edge
    const positionClasses: Record<string, string> = {
        left: 'absolute left-0 top-0 bottom-0 w-1 hover:bg-energy-teal/20',
        right: 'absolute right-0 top-0 bottom-0 w-1 hover:bg-energy-teal/20',
        top: 'absolute top-0 left-0 right-0 h-1 hover:bg-energy-teal/20',
        bottom: 'absolute bottom-0 left-0 right-0 h-1 hover:bg-energy-teal/20',
        'top-left': 'absolute top-0 left-0 w-3 h-3',
        'top-right': 'absolute top-0 right-0 w-3 h-3',
        'bottom-left': 'absolute bottom-0 left-0 w-3 h-3',
        'bottom-right': 'absolute bottom-0 right-0 w-3 h-3',
    };

    return (
        <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={cn(
                'z-20 transition-colors',
                positionClasses[edge]
            )}
            style={{ cursor }}
        />
    );
};

// ============================================================
// Dock Indicator
// ============================================================

interface DockIndicatorProps {
    position: 'left' | 'right' | 'bottom';
}

const DockIndicator: React.FC<DockIndicatorProps> = ({ position }) => {
    const positionClasses: Record<string, string> = {
        left: 'absolute right-0 top-1/2 -translate-y-1/2 -mr-2',
        right: 'absolute left-0 top-1/2 -translate-y-1/2 -ml-2',
        bottom: 'absolute top-0 left-1/2 -translate-x-1/2 -mt-2',
    };

    return (
        <div className={cn('pointer-events-none opacity-30', positionClasses[position])}>
            <GripVertical className="w-4 h-4 text-stardust-dim rotate-90" />
        </div>
    );
};

export default PromptArchitectPanel;
