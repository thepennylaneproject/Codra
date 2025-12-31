/**
 * PANEL RESIZE HOOK
 * Custom hook for handling panel resize drag logic
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { MIN_DOCK_WIDTH, MAX_DOCK_WIDTH } from './useWorkspaceLayout';

interface UsePanelResizeOptions {
  initialWidth: number;
  side: 'left' | 'right';
  onWidthChange: (width: number) => void;
}

interface UsePanelResizeReturn {
  isDragging: boolean;
  currentWidth: number;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export function usePanelResize({
  initialWidth,
  side,
  onWidthChange,
}: UsePanelResizeOptions): UsePanelResizeReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(initialWidth);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Sync with external width changes (from store)
  useEffect(() => {
    setCurrentWidth(initialWidth);
  }, [initialWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  }, [currentWidth]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      requestAnimationFrame(() => {
        const deltaX = e.clientX - startXRef.current;
        // For right dock, dragging left increases width (negative delta)
        const actualDelta = side === 'right' ? -deltaX : deltaX;
        let newWidth = startWidthRef.current + actualDelta;

        // Clamp to min/max
        newWidth = Math.max(MIN_DOCK_WIDTH, Math.min(MAX_DOCK_WIDTH, newWidth));

        setCurrentWidth(newWidth);
      });
    },
    [isDragging, side]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Persist final width to store
      onWidthChange(currentWidth);
    }
  }, [isDragging, currentWidth, onWidthChange]);

  // Attach global mouse events during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    currentWidth,
    handleMouseDown,
  };
}
