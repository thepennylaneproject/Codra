/**
 * CODRA CUSTOM ICONS
 * "Guardians x Apple" Aesthetic System
 * 
 * - Geometric base, playful curves
 * - 1.5px stroke weight (Apple restraint)
 * - Rounded caps/joins (No sharp aggression)
 * - Musical/Rhythmic feel
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
  weight?: number;
  interactive?: boolean;
}

/**
 * CODRA ICON WRAPPER
 * Enforces sizing, stroke weight, and interaction states
 */
export const CodraIcon: React.FC<IconProps & { children: React.ReactNode; viewBox?: string }> = ({
  size = 20,
  weight = 1.5,
  color = 'currentColor',
  className,
  children,
  viewBox = "0 0 24 24",
  interactive = false
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "transition-all duration-200 ease-out",
        interactive && "hover:stroke-text-primary hover:drop-shadow-[0_0_8px_rgba(78,128,141,0.5)]",
        className
      )}
    >
      {children}
    </svg>
  );
};

// ========================================
// CORE NAVIGATION ICONS
// ========================================

export const DashboardIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <rect x="3" y="3" width="7" height="9" rx="2" />
    <rect x="14" y="3" width="7" height="5" rx="2" />
    <rect x="14" y="12" width="7" height="9" rx="2" />
    <rect x="3" y="16" width="7" height="5" rx="2" />
  </CodraIcon>
);

export const ProjectIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </CodraIcon>
);

export const PromptIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </CodraIcon>
);

// ========================================
// WORKFLOW ICONS
// ========================================

export const TriggerIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8l6 4-6 4V8z" />
  </CodraIcon>
);

export const TransformIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
  </CodraIcon>
);

export const OutputIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </CodraIcon>
);

export const BranchIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M6 3v12" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </CodraIcon>
);

export const LoopIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M12 21a9 9 0 1 0-9-9c0 1.48.35 2.88.95 4.13" />
    <path d="M7.6 15.6L3 12" />
  </CodraIcon>
);

// ========================================
// ACTION ICONS
// ========================================

export const ExecuteIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </CodraIcon>
);

export const SettingsIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </CodraIcon>
);

export const MenuIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </CodraIcon>
);

export const CloseIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </CodraIcon>
);

// ========================================
// SPECIALTY ICONS (Guardians Flavor)
// ========================================

export const ArchitectIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M2 12h20" />
    <path d="M2 12l5 5" />
    <path d="M22 12l-5 5" />
    <path d="M12 2v20" />
    <rect x="7" y="7" width="10" height="10" rx="3" />
  </CodraIcon>
);

export const ForgeIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.7 1.7 1.8 2.8 2.9 2.8z" />
  </CodraIcon>
);

export const ModelIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M5 5l2.7 2.7" />
    <path d="M5 19l2.7-2.7" />
    <path d="M19 5l-2.7 2.7" />
    <path d="M19 19l-2.7-2.7" />
    <circle cx="5" cy="5" r="1.5" />
    <circle cx="19" cy="5" r="1.5" />
    <circle cx="5" cy="19" r="1.5" />
    <circle cx="19" cy="19" r="1.5" />
  </CodraIcon>
);

// Re-exports/Aliases
export const EditIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </CodraIcon>
);

export const DeleteIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </CodraIcon>
);

export const SearchIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
  </CodraIcon>
);

export const SaveIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </CodraIcon>
);

export const PlusIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </CodraIcon>
);

export const BackIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M15 18l-6-6 6-6" />
  </CodraIcon>
);

export const ForwardIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M9 18l6-6-6-6" />
  </CodraIcon>
);

export const WarningIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </CodraIcon>
);

export const ErrorIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </CodraIcon>
);

export const SuccessIcon = (props: IconProps) => (
  <CodraIcon {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </CodraIcon>
);

export const LoadingIcon = (props: IconProps) => (
  <CodraIcon {...props} className={cn("animate-spin", props.className)}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </CodraIcon>
);

// Fallback for missing icons in this refactor
export const CodeNodeIcon = (props: IconProps) => <CodraIcon {...props}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></CodraIcon>;
export const ImageNodeIcon = (props: IconProps) => <CodraIcon {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></CodraIcon>;
export const AITextNodeIcon = (props: IconProps) => <CodraIcon {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></CodraIcon>;
export const MergeIcon = (props: IconProps) => <CodraIcon {...props}><path d="M6 3v6a6 6 0 0 0 6 6h0a6 6 0 0 1 6 6v3" /></CodraIcon>;
export const PauseIcon = (props: IconProps) => <CodraIcon {...props}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></CodraIcon>;
export const StopIcon = (props: IconProps) => <CodraIcon {...props}><rect x="4" y="4" width="16" height="16" rx="2" /></CodraIcon>;
export const DuplicateIcon = (props: IconProps) => <CodraIcon {...props}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></CodraIcon>;
export const ShareIcon = (props: IconProps) => <CodraIcon {...props}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></CodraIcon>;
export const ExportIcon = (props: IconProps) => <CodraIcon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></CodraIcon>;
export const QueuedIcon = (props: IconProps) => <CodraIcon {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></CodraIcon>;
export const VariableIcon = (props: IconProps) => <CodraIcon {...props}><path d="M4 20h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /><path d="M12 13v-1" /><path d="M12 18v-2" /><path d="M12 8V6" /></CodraIcon>;
export const CostIcon = (props: IconProps) => <CodraIcon {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></CodraIcon>;
export const PinIcon = (props: IconProps) => <CodraIcon {...props}><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></CodraIcon>;
export const UnpinIcon = (props: IconProps) => <CodraIcon {...props}><line x1="2" y1="2" x2="22" y2="22" /><line x1="12" y1="17" x2="12" y2="22" /><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1" /></CodraIcon>;
