import React from 'react';

interface GlassPanelProps {
  variant?: 'dark' | 'light';
  className?: string;
  children: React.ReactNode;
}

export function GlassPanel({ variant = 'dark', className = '', children }: GlassPanelProps) {
  const variantClass = variant === 'light' ? 'glass-panel-light' : 'glass-panel';
  return (
    <div className={`${variantClass} ${className}`}>
      {children}
    </div>
  );
}
