/**
 * DESK BRIDGE
 * Cross-desk event coordination and suggestion system
 * 
 * Enables Task Workspaces to notify each other of relevant events
 * and suggest cross-pollination opportunities.
 */

import { ProductionDeskId, PRODUCTION_DESKS } from '../../domain/types';

// ============================================
// Types
// ============================================

export type DeskEventType =
    | 'artifact_created'
    | 'artifact_approved'
    | 'task_completed'
    | 'copy_finalized'
    | 'image_generated'
    | 'code_committed';

export interface DeskEvent {
    id: string;
    type: DeskEventType;
    sourceDesk: ProductionDeskId;
    artifactId?: string;
    artifactName?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface CrossDeskSuggestion {
    id: string;
    sourceDesk: ProductionDeskId;
    targetDesk: ProductionDeskId;
    message: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    metadata?: Record<string, unknown>;
    createdAt: string;
}

// ============================================
// Cross-Desk Suggestion Rules
// ============================================

interface SuggestionRule {
    sourceEvent: DeskEventType;
    sourceDesk: ProductionDeskId;
    targetDesk: ProductionDeskId;
    message: (event: DeskEvent) => string;
    action: string;
    priority: 'low' | 'medium' | 'high';
}

const SUGGESTION_RULES: SuggestionRule[] = [
    // Art → Writing: Image generated, suggest caption/alt text
    {
        sourceEvent: 'image_generated',
        sourceDesk: 'art-design',
        targetDesk: 'writing',
        message: (e) => `New image "${e.artifactName || 'Untitled'}" generated. Add caption?`,
        action: 'Write caption',
        priority: 'medium',
    },

    // Art → Marketing: Image approved, suggest social post
    {
        sourceEvent: 'artifact_approved',
        sourceDesk: 'art-design',
        targetDesk: 'marketing',
        message: (e) => `"${e.artifactName || 'Image'}" approved. Create social post?`,
        action: 'Draft social copy',
        priority: 'low',
    },

    // Writing → Art: Copy finalized, suggest matching visual
    {
        sourceEvent: 'copy_finalized',
        sourceDesk: 'writing',
        targetDesk: 'art-design',
        message: (e) => `Copy "${e.artifactName || 'Untitled'}" finalized. Generate matching visual?`,
        action: 'Generate visual',
        priority: 'medium',
    },

    // Writing → Engineering: Copy approved, push to component
    {
        sourceEvent: 'artifact_approved',
        sourceDesk: 'writing',
        targetDesk: 'engineering',
        message: (e) => `"${e.artifactName || 'Copy'}" approved. Push to component?`,
        action: 'Update component',
        priority: 'high',
    },

    // Engineering → Art: Component spec ready, generate placeholders
    {
        sourceEvent: 'task_completed',
        sourceDesk: 'engineering',
        targetDesk: 'art-design',
        message: () => `Component spec ready. Generate placeholder images?`,
        action: 'Generate placeholders',
        priority: 'low',
    },

    // Engineering → Writing: Code committed, update docs
    {
        sourceEvent: 'code_committed',
        sourceDesk: 'engineering',
        targetDesk: 'writing',
        message: () => `New code committed. Update documentation?`,
        action: 'Update docs',
        priority: 'low',
    },
];

// ============================================
// Event Queue (In-Memory)
// ============================================

const EVENT_QUEUE: DeskEvent[] = [];
const SUGGESTION_QUEUE: CrossDeskSuggestion[] = [];
const MAX_QUEUE_SIZE = 50;

// Listeners for real-time updates
type SuggestionListener = (suggestion: CrossDeskSuggestion) => void;
const suggestionListeners: Set<SuggestionListener> = new Set();

// ============================================
// Bridge Functions
// ============================================

/**
 * Emit an event from a desk
 */
export function emitDeskEvent(event: Omit<DeskEvent, 'id' | 'createdAt'>): void {
    const fullEvent: DeskEvent = {
        ...event,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
    };

    // Add to queue
    EVENT_QUEUE.push(fullEvent);
    if (EVENT_QUEUE.length > MAX_QUEUE_SIZE) {
        EVENT_QUEUE.shift();
    }

    // Check for matching suggestion rules
    const suggestions = evaluateRules(fullEvent);
    suggestions.forEach(suggestion => {
        SUGGESTION_QUEUE.push(suggestion);
        if (SUGGESTION_QUEUE.length > MAX_QUEUE_SIZE) {
            SUGGESTION_QUEUE.shift();
        }

        // Notify listeners
        suggestionListeners.forEach(listener => listener(suggestion));
    });
}

/**
 * Evaluate suggestion rules against an event
 */
function evaluateRules(event: DeskEvent): CrossDeskSuggestion[] {
    return SUGGESTION_RULES
        .filter(rule =>
            rule.sourceEvent === event.type &&
            rule.sourceDesk === event.sourceDesk
        )
        .map(rule => ({
            id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceDesk: rule.sourceDesk,
            targetDesk: rule.targetDesk,
            message: rule.message(event),
            action: rule.action,
            priority: rule.priority,
            metadata: {
                sourceEventId: event.id,
                artifactId: event.artifactId,
            },
            createdAt: new Date().toISOString(),
        }));
}

/**
 * Get pending suggestions for a desk
 */
export function getSuggestionsForDesk(deskId: ProductionDeskId): CrossDeskSuggestion[] {
    return SUGGESTION_QUEUE.filter(s => s.targetDesk === deskId);
}

/**
 * Get all pending suggestions
 */
export function getAllSuggestions(): CrossDeskSuggestion[] {
    return [...SUGGESTION_QUEUE];
}

/**
 * Dismiss a suggestion
 */
export function dismissSuggestion(suggestionId: string): void {
    const index = SUGGESTION_QUEUE.findIndex(s => s.id === suggestionId);
    if (index !== -1) {
        SUGGESTION_QUEUE.splice(index, 1);
    }
}

/**
 * Subscribe to new suggestions
 */
export function onSuggestion(listener: SuggestionListener): () => void {
    suggestionListeners.add(listener);
    return () => suggestionListeners.delete(listener);
}

/**
 * Get recent events (for debugging/display)
 */
export function getRecentEvents(limit: number = 10): DeskEvent[] {
    return EVENT_QUEUE.slice(-limit);
}

/**
 * Get desk display name
 */
export function getDeskName(deskId: ProductionDeskId): string {
    return PRODUCTION_DESKS.find(d => d.id === deskId)?.label || deskId;
}

// ============================================
// Helper: Create common events
// ============================================

export const DeskEvents = {
    imageGenerated: (artifactId: string, artifactName: string) =>
        emitDeskEvent({
            type: 'image_generated',
            sourceDesk: 'art-design',
            artifactId,
            artifactName,
        }),

    copyFinalized: (artifactId: string, artifactName: string) =>
        emitDeskEvent({
            type: 'copy_finalized',
            sourceDesk: 'writing',
            artifactId,
            artifactName,
        }),

    codeCommitted: (metadata?: Record<string, unknown>) =>
        emitDeskEvent({
            type: 'code_committed',
            sourceDesk: 'engineering',
            metadata,
        }),

    artifactApproved: (deskId: ProductionDeskId, artifactId: string, artifactName: string) =>
        emitDeskEvent({
            type: 'artifact_approved',
            sourceDesk: deskId,
            artifactId,
            artifactName,
        }),

    taskCompleted: (deskId: ProductionDeskId, taskName: string) =>
        emitDeskEvent({
            type: 'task_completed',
            sourceDesk: deskId,
            artifactName: taskName,
        }),
};
