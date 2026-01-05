/**
 * DESK SWITCHER
 * Horizontal tab bar for switching between production desks
 */

import React from 'react';
import { PenLine, Palette, Code2, BarChart3, LucideIcon } from 'lucide-react';
import { ProductionDeskId } from '../../../domain/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/Button';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeskConfig {
  id: ProductionDeskId;
  label: string;
  icon: LucideIcon;
}

const DESK_CONFIG: DeskConfig[] = [
  { id: 'write', label: 'Write', icon: PenLine },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'analyze', label: 'Analyze', icon: BarChart3 },
];

interface DeskSwitcherProps {
  activeDesk: ProductionDeskId;
  onSwitch: (deskId: ProductionDeskId) => void;
}

export const DeskSwitcher: React.FC<DeskSwitcherProps> = ({ activeDesk, onSwitch }) => {
  return (
    <nav className="flex items-center gap-1 px-6 py-0 border-b border-[var(--desk-border)] bg-[var(--desk-bg)]">
      {DESK_CONFIG.map((desk) => {
        const Icon = desk.icon;
        const isActive = activeDesk === desk.id;
        
        return (
          <Button
            key={desk.id}
            onClick={() => onSwitch(desk.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
              "hover:text-desk-text-primary",
              isActive
                ? "text-zinc-500"
                : "text-desk-text-muted"
            )}
          >
            <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
            <span>{desk.label}</span>
            
            {/* Coral underline for active tab */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-600" />
            )}
          </Button>
        );
      })}
    </nav>
  );
};
