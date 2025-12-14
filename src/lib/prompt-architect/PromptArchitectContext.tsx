/**
 * PROMPT ARCHITECT - React Context Provider
 * src/lib/prompt-architect/PromptArchitectContext.tsx
 * 
 * Provides easy access to Prompt Architect from anywhere in the app
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { usePromptArchitectStore } from './prompt-architect-store';
import { ArchitectContext, ArchitectMode } from './types';

// ============================================================
// Context Types
// ============================================================

interface PromptArchitectContextValue {
    /** Open Prompt Architect panel */
    open: (context?: ArchitectContext) => void;

    /** Close Prompt Architect panel */
    close: () => void;

    /** Toggle panel visibility */
    toggle: () => void;

    /** Check if panel is visible */
    isVisible: boolean;

    /** Open with specific mode */
    openWithMode: (mode: ArchitectMode, context?: ArchitectContext) => void;

    /** Open for specific output type */
    openForOutput: (outputType: ArchitectContext['outputType'], context?: ArchitectContext) => void;
}

// ============================================================
// Context Creation
// ============================================================

const PromptArchitectContext = createContext<PromptArchitectContextValue | null>(null);

// ============================================================
// Provider Component
// ============================================================

interface PromptArchitectProviderProps {
    children: React.ReactNode;
}

export const PromptArchitectProvider: React.FC<PromptArchitectProviderProps> = ({ children }) => {
    const store = usePromptArchitectStore();

    // ========================
    // Actions
    // ========================

    const open = useCallback((context?: ArchitectContext) => {
        store.show(context);
    }, [store]);

    const close = useCallback(() => {
        store.hide();
    }, [store]);

    const toggle = useCallback(() => {
        store.toggle();
    }, [store]);

    const openWithMode = useCallback((mode: ArchitectMode, context?: ArchitectContext) => {
        store.setMode(mode);
        store.show(context);
    }, [store]);

    const openForOutput = useCallback((
        outputType: ArchitectContext['outputType'],
        context?: ArchitectContext
    ) => {
        store.show({
            ...context,
            outputType,
        });
    }, [store]);

    // ========================
    // Global Keyboard Shortcut
    // ========================

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + Shift + P to toggle Prompt Architect
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
                e.preventDefault();
                toggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggle]);

    // ========================
    // Context Value
    // ========================

    const value: PromptArchitectContextValue = {
        open,
        close,
        toggle,
        isVisible: store.isVisible,
        openWithMode,
        openForOutput,
    };

    return (
        <PromptArchitectContext.Provider value={value}>
            {children}
        </PromptArchitectContext.Provider>
    );
};

// ============================================================
// Hook
// ============================================================

/**
 * Hook to access Prompt Architect controls
 * Use this to open/close the panel from any component
 */
export const usePromptArchitect = (): PromptArchitectContextValue => {
    const context = useContext(PromptArchitectContext);

    if (!context) {
        throw new Error('usePromptArchitect must be used within PromptArchitectProvider');
    }

    return context;
};

// ============================================================
// Standalone Hook (without context)
// ============================================================

/**
 * Direct hook to Prompt Architect store
 * Use when PromptArchitectProvider is not available
 */
export const usePromptArchitectDirect = () => {
    const store = usePromptArchitectStore();

    return {
        open: store.show,
        close: store.hide,
        toggle: store.toggle,
        isVisible: store.isVisible,
        setMode: store.setMode,
        setContext: store.setContext,
    };
};
