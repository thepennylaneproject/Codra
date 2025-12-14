/**
 * PROMPT ARCHITECT - Docking Hook
 * src/hooks/usePromptArchitectDock.ts
 * 
 * Hook for managing panel docking, floating, and resize behavior
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { PanelConfig, DockPosition, PanelState } from '../lib/prompt-architect/types';

// ============================================================
// Types
// ============================================================

interface DockConstraints {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
}

interface UseDockResult {
    // State
    isDragging: boolean;
    isResizing: boolean;

    // Computed styles
    panelStyle: React.CSSProperties;

    // Handlers
    startDrag: (e: React.MouseEvent | React.TouchEvent) => void;
    startResize: (e: React.MouseEvent | React.TouchEvent, edge: ResizeEdge) => void;

    // Actions
    dock: (position: DockPosition) => void;
    undock: () => void;
    toggleFloating: () => void;
}

type ResizeEdge = 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// ============================================================
// Constants
// ============================================================

const DEFAULT_CONSTRAINTS: DockConstraints = {
    minWidth: 320,
    maxWidth: 600,
    minHeight: 300,
    maxHeight: 800,
};

const DOCK_MARGIN = 72; // Account for IconRail width

// ============================================================
// Hook Implementation
// ============================================================

export function usePromptArchitectDock(
    config: PanelConfig,
    onConfigChange: (config: Partial<PanelConfig>) => void,
    constraints: DockConstraints = DEFAULT_CONSTRAINTS
): UseDockResult {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStartPos = useRef({ x: 0, y: 0 });
    const resizeEdge = useRef<ResizeEdge | null>(null);
    const initialSize = useRef({ width: 0, height: 0 });
    const initialPos = useRef({ x: 0, y: 0 });

    // ========================
    // Computed Panel Style
    // ========================

    const panelStyle: React.CSSProperties = (() => {
        if (config.state === 'hidden') {
            return { display: 'none' };
        }

        if (config.state === 'floating') {
            return {
                position: 'fixed',
                top: config.floatingPosition.y,
                left: config.floatingPosition.x,
                width: config.floatingSize.width,
                height: config.floatingSize.height,
                zIndex: 90,
            };
        }

        // Docked state
        const dockStyles: Record<DockPosition, React.CSSProperties> = {
            right: {
                position: 'fixed',
                top: 0,
                right: 0,
                width: config.width,
                height: '100vh',
                zIndex: 80,
            },
            left: {
                position: 'fixed',
                top: 0,
                left: DOCK_MARGIN, // Account for IconRail
                width: config.width,
                height: '100vh',
                zIndex: 80,
            },
            bottom: {
                position: 'fixed',
                bottom: 0,
                left: DOCK_MARGIN,
                right: 0,
                height: config.height,
                zIndex: 80,
            },
        };

        return dockStyles[config.dockPosition];
    })();

    // ========================
    // Drag Handlers (Floating Mode)
    // ========================

    const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (config.state !== 'floating') return;

        e.preventDefault();
        setIsDragging(true);

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        dragStartPos.current = {
            x: clientX - config.floatingPosition.x,
            y: clientY - config.floatingPosition.y,
        };
    }, [config.state, config.floatingPosition]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            const newX = Math.max(0, Math.min(window.innerWidth - 100, clientX - dragStartPos.current.x));
            const newY = Math.max(0, Math.min(window.innerHeight - 50, clientY - dragStartPos.current.y));

            onConfigChange({
                floatingPosition: { x: newX, y: newY },
            });
        };

        const handleUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, onConfigChange]);

    // ========================
    // Resize Handlers
    // ========================

    const startResize = useCallback((e: React.MouseEvent | React.TouchEvent, edge: ResizeEdge) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        resizeStartPos.current = { x: clientX, y: clientY };
        resizeEdge.current = edge;

        if (config.state === 'floating') {
            initialSize.current = { ...config.floatingSize };
            initialPos.current = { ...config.floatingPosition };
        } else {
            initialSize.current = { width: config.width, height: config.height };
        }
    }, [config]);

    useEffect(() => {
        if (!isResizing || !resizeEdge.current) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - resizeStartPos.current.x;
            const deltaY = clientY - resizeStartPos.current.y;

            const edge = resizeEdge.current!;

            if (config.state === 'floating') {
                let newWidth = initialSize.current.width;
                let newHeight = initialSize.current.height;
                let newX = initialPos.current.x;
                let newY = initialPos.current.y;

                if (edge.includes('right')) newWidth += deltaX;
                if (edge.includes('left')) { newWidth -= deltaX; newX += deltaX; }
                if (edge.includes('bottom')) newHeight += deltaY;
                if (edge.includes('top')) { newHeight -= deltaY; newY += deltaY; }

                newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, newWidth));
                newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, newHeight));

                onConfigChange({
                    floatingSize: { width: newWidth, height: newHeight },
                    floatingPosition: { x: Math.max(0, newX), y: Math.max(0, newY) },
                });
            } else if (config.state === 'docked') {
                if (config.dockPosition === 'right') {
                    const newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, initialSize.current.width - deltaX));
                    onConfigChange({ width: newWidth });
                } else if (config.dockPosition === 'left') {
                    const newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, initialSize.current.width + deltaX));
                    onConfigChange({ width: newWidth });
                } else if (config.dockPosition === 'bottom') {
                    const newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, initialSize.current.height - deltaY));
                    onConfigChange({ height: newHeight });
                }
            }
        };

        const handleUp = () => {
            setIsResizing(false);
            resizeEdge.current = null;
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isResizing, config, constraints, onConfigChange]);

    // ========================
    // Actions
    // ========================

    const dock = useCallback((position: DockPosition) => {
        onConfigChange({
            state: 'docked',
            dockPosition: position,
        });
    }, [onConfigChange]);

    const undock = useCallback(() => {
        onConfigChange({
            state: 'floating',
        });
    }, [onConfigChange]);

    const toggleFloating = useCallback(() => {
        onConfigChange({
            state: config.state === 'floating' ? 'docked' : 'floating',
        });
    }, [config.state, onConfigChange]);

    return {
        isDragging,
        isResizing,
        panelStyle,
        startDrag,
        startResize,
        dock,
        undock,
        toggleFloating,
    };
}

// ============================================================
// Resize Handle Component Helpers
// ============================================================

/** CSS cursors for resize edges */
export const RESIZE_CURSORS: Record<ResizeEdge, string> = {
    left: 'ew-resize',
    right: 'ew-resize',
    top: 'ns-resize',
    bottom: 'ns-resize',
    'top-left': 'nwse-resize',
    'top-right': 'nesw-resize',
    'bottom-left': 'nesw-resize',
    'bottom-right': 'nwse-resize',
};

/** Get applicable resize edges for current dock position */
export function getResizeEdges(state: PanelState, dockPosition: DockPosition): ResizeEdge[] {
    if (state === 'hidden') return [];

    if (state === 'floating') {
        return ['left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    }

    // Docked - only edge away from dock
    switch (dockPosition) {
        case 'right': return ['left'];
        case 'left': return ['right'];
        case 'bottom': return ['top'];
        default: return [];
    }
}
