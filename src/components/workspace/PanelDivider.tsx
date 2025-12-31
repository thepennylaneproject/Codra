/**
 * PANEL DIVIDER
 * Vertical drag handle for resizing workspace panels
 * Supports drag to resize and double-click to collapse/expand
 */

import React from 'react';

interface PanelDividerProps {
  side: 'left' | 'right';
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  isDragging?: boolean;
}

export const PanelDivider: React.FC<PanelDividerProps> = ({
  side,
  onMouseDown,
  onDoubleClick,
  isDragging = false,
}) => {
  return (
    <div
      className="relative flex items-center justify-center cursor-col-resize group"
      style={{ width: '4px', flexShrink: 0 }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${side} dock`}
    >
      {/* Hit target (invisible) */}
      <div className="absolute inset-y-0 -inset-x-1" />
      
      {/* Visual indicator */}
      <div
        className="absolute inset-y-0 transition-colors"
        style={{
          width: '1px',
          backgroundColor: isDragging
            ? 'var(--shell-resize-handle-active)'
            : 'var(--shell-border)',
        }}
      />

      {/* Hover/active state overlay */}
      <div
        className="absolute inset-0 transition-opacity opacity-0 group-hover:opacity-100"
        style={{
          backgroundColor: isDragging
            ? 'var(--shell-resize-handle-active)'
            : 'var(--shell-resize-handle-hover)',
          opacity: isDragging ? 1 : undefined,
        }}
      />
    </div>
  );
};
