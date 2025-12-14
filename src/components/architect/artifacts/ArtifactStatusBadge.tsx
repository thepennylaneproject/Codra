/**
 * ARTIFACT STATUS BADGE
 * Displays the current lifecycle state of an artifact
 */

import React from 'react';
import { STATUS_META } from '../../../lib/artifacts/state-machine';
import type { ArtifactStatus } from '../../../types/architect';

interface ArtifactStatusBadgeProps {
    status: ArtifactStatus;
    size?: 'sm' | 'md';
    showIcon?: boolean;
}

export const ArtifactStatusBadge: React.FC<ArtifactStatusBadgeProps> = ({
    status,
    size = 'md',
    showIcon = true,
}) => {
    const meta = STATUS_META[status];

    // Fallback for unknown status
    if (!meta) return null;

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors
        ${meta.color} ${meta.bgColor} ${meta.borderColor}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
      `}
            title={meta.description}
        >
            {showIcon && <span className="text-[1.1em]">{meta.icon}</span>}
            {meta.label}
        </span>
    );
};
