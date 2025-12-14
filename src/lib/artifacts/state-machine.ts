/**
 * ARTIFACT STATE MACHINE
 * Manages valid status transitions for artifacts
 * 
 * States:
 * - draft: Initial creation, not yet reviewed
 * - under_review: User is examining the output
 * - needs_revision: User gave feedback, awaiting regeneration
 * - approved: User accepted this version
 * - archived: No longer active, preserved for history
 */

import type { ArtifactStatus } from '../../types/architect';

export type StatusTransition = {
    from: ArtifactStatus;
    to: ArtifactStatus;
    action: string;
    requiresFeedback?: boolean;
};

export const VALID_TRANSITIONS: StatusTransition[] = [
    // From draft
    { from: 'draft', to: 'under_review', action: 'review' },
    { from: 'draft', to: 'archived', action: 'discard' },

    // From under_review
    { from: 'under_review', to: 'needs_revision', action: 'request_revision', requiresFeedback: true },
    { from: 'under_review', to: 'approved', action: 'approve' },
    { from: 'under_review', to: 'archived', action: 'discard' },

    // From needs_revision
    { from: 'needs_revision', to: 'under_review', action: 'regenerate' },
    { from: 'needs_revision', to: 'archived', action: 'discard' },

    // From approved
    { from: 'approved', to: 'needs_revision', action: 'reopen', requiresFeedback: true },
    { from: 'approved', to: 'archived', action: 'archive' },

    // From archived (limited)
    { from: 'archived', to: 'under_review', action: 'restore' },
];

export function canTransition(from: ArtifactStatus, to: ArtifactStatus): boolean {
    return VALID_TRANSITIONS.some(t => t.from === from && t.to === to);
}

export function getValidTransitions(from: ArtifactStatus): StatusTransition[] {
    return VALID_TRANSITIONS.filter(t => t.from === from);
}

export function getTransitionAction(from: ArtifactStatus, to: ArtifactStatus): string | null {
    const transition = VALID_TRANSITIONS.find(t => t.from === from && t.to === to);
    return transition?.action || null;
}

export function requiresFeedback(from: ArtifactStatus, to: ArtifactStatus): boolean {
    const transition = VALID_TRANSITIONS.find(t => t.from === from && t.to === to);
    return transition?.requiresFeedback || false;
}

/**
 * Status metadata for UI display
 */
export const STATUS_META: Record<ArtifactStatus, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    description: string;
}> = {
    draft: {
        label: 'Draft',
        color: 'text-text-muted',
        bgColor: 'bg-background-subtle',
        borderColor: 'border-border-subtle',
        icon: '📝',
        description: 'Initial generation, not yet reviewed',
    },
    under_review: {
        label: 'Under Review',
        color: 'text-brand-teal',
        bgColor: 'bg-brand-teal/10',
        borderColor: 'border-brand-teal/30',
        icon: '👀',
        description: 'Ready for your review',
    },
    needs_revision: {
        label: 'Needs Revision',
        color: 'text-brand-gold',
        bgColor: 'bg-brand-gold/10',
        borderColor: 'border-brand-gold/30',
        icon: '🔄',
        description: 'Feedback submitted, awaiting regeneration',
    },
    approved: {
        label: 'Approved',
        color: 'text-state-success',
        bgColor: 'bg-state-success/10',
        borderColor: 'border-state-success/30',
        icon: '✓',
        description: 'Accepted and ready to use',
    },
    archived: {
        label: 'Archived',
        color: 'text-text-soft',
        bgColor: 'bg-background-subtle',
        borderColor: 'border-border-subtle',
        icon: '📦',
        description: 'No longer active, preserved for history',
    },
};
