/**
 * PANEL DOCK
 * Resizable dock wrapper for workspace panels
 * Supports both left and right positioning with smooth transitions
 */

import React from 'react';
import { usePanelResize } from '../../hooks/usePanelResize';
import { PanelDivider } from './PanelDivider';

interface PanelDockProps {
  side: 'left' | 'right';
  isVisible: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggle: () => void;
  children: React.ReactNode;
}

export const PanelDock: React.FC<PanelDockProps> = ({
  side,
  isVisible,
  width,
  onWidthChange,
  onToggle,
  children,
}) => {
  const { isDragging, currentWidth, handleMouseDown } = usePanelResize({
    initialWidth: width,
    side,
    onWidthChange,
  });

  const displayWidth = isVisible ? currentWidth : 0;

  return (
    <>
      {/* Left dock: divider on right side */}
      {side === 'left' && isVisible && (
        <div
          className="flex shrink-0 transition-all duration-300 ease-out"
          style={{ width: `${displayWidth}px` }}
        >
          <div
            className="flex-1 overflow-hidden"
            style={{
              backgroundColor: 'var(--shell-surface-1)',
              borderRight: '1px solid var(--shell-border)',
            }}
          >
            {children}
          </div>
          <PanelDivider
            side={side}
            onMouseDown={handleMouseDown}
            onDoubleClick={onToggle}
            isDragging={isDragging}
          />
        </div>
      )}

      {/* Right dock: divider on left side */}
      {side === 'right' && isVisible && (
        <div
          className="flex shrink-0 transition-all duration-300 ease-out"
          style={{ width: `${displayWidth}px` }}
        >
          <PanelDivider
            side={side}
            onMouseDown={handleMouseDown}
            onDoubleClick={onToggle}
            isDragging={isDragging}
          />
          <div
            className="flex-1 overflow-hidden"
            style={{
              backgroundColor: 'var(--shell-surface-1)',
              borderLeft: '1px solid var(--shell-border)',
            }}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
};
