/**
 * SESSION MEMORY
 * src/lib/memory/session-memory.ts
 * 
 * Per-project session memory that tracks:
 * - Decisions made during session
 * - What AI has already generated
 * - Prevents circular regeneration
 */

export interface SessionDecision {
    id: string;
    type: 'approved' | 'rejected' | 'modified';
    category: 'content' | 'design' | 'code' | 'strategy';
    description: string;
    originalValue?: string;
    newValue?: string;
    timestamp: string;
}

export interface GenerationRecord {
    id: string;
    taskId: string;
    taskTitle: string;
    outputSummary: string;
    timestamp: string;
    wasSuccessful: boolean;
    tokensUsed?: number;
}

export interface SessionMemoryState {
    sessionId: string;
    projectId: string;
    startedAt: string;
    lastActiveAt: string;
    decisions: SessionDecision[];
    generations: GenerationRecord[];
    userPreferences: Record<string, string>;
}

/**
 * Session Memory - Tracks decisions and generations within a session
 */
export class SessionMemory {
    private state: SessionMemoryState;
    private storageKey: string;

    constructor(projectId: string) {
        this.storageKey = `codra:session:${projectId}`;
        const existing = this.loadState();
        
        // Check if existing session is still "fresh" (within 4 hours)
        const isFresh = existing && this.isSessionFresh(existing.lastActiveAt);
        
        this.state = isFresh ? existing! : {
            sessionId: crypto.randomUUID(),
            projectId,
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            decisions: [],
            generations: [],
            userPreferences: {},
        };

        this.touch();
    }

    /**
     * Record a user decision
     */
    recordDecision(
        type: SessionDecision['type'],
        category: SessionDecision['category'],
        description: string,
        originalValue?: string,
        newValue?: string
    ): string {
        const id = crypto.randomUUID();
        
        this.state.decisions.push({
            id,
            type,
            category,
            description,
            originalValue,
            newValue,
            timestamp: new Date().toISOString(),
        });

        this.touch();
        return id;
    }

    /**
     * Record a generation (to prevent circular regeneration)
     */
    recordGeneration(
        taskId: string,
        taskTitle: string,
        outputSummary: string,
        wasSuccessful: boolean,
        tokensUsed?: number
    ): string {
        const id = crypto.randomUUID();

        this.state.generations.push({
            id,
            taskId,
            taskTitle,
            outputSummary,
            timestamp: new Date().toISOString(),
            wasSuccessful,
            tokensUsed,
        });

        this.touch();
        return id;
    }

    /**
     * Check if we've already generated something similar
     */
    hasGeneratedSimilar(taskTitle: string): GenerationRecord | null {
        // Simple title matching - could be enhanced with semantic similarity
        const normalizedTitle = taskTitle.toLowerCase().trim();
        
        return this.state.generations.find(g => 
            g.taskTitle.toLowerCase().trim() === normalizedTitle && g.wasSuccessful
        ) || null;
    }

    /**
     * Get recent decisions for context injection
     */
    getRecentDecisions(limit: number = 10): SessionDecision[] {
        return this.state.decisions.slice(-limit);
    }

    /**
     * Get session summary for AI context
     */
    getSessionSummary(): string {
        const sections: string[] = [];

        // Approved decisions
        const approved = this.state.decisions.filter(d => d.type === 'approved');
        if (approved.length > 0) {
            sections.push('## User-Approved Decisions This Session');
            approved.slice(-5).forEach(d => {
                sections.push(`- ${d.description}`);
            });
        }

        // Rejections (important to remember what NOT to do)
        const rejected = this.state.decisions.filter(d => d.type === 'rejected');
        if (rejected.length > 0) {
            sections.push('\n## User Rejections (Avoid These)');
            rejected.slice(-5).forEach(d => {
                sections.push(`- ❌ ${d.description}`);
            });
        }

        // Recent successful generations
        const successful = this.state.generations.filter(g => g.wasSuccessful);
        if (successful.length > 0) {
            sections.push('\n## Already Generated This Session');
            successful.slice(-5).forEach(g => {
                sections.push(`- ✓ ${g.taskTitle}: ${g.outputSummary}`);
            });
        }

        return sections.join('\n');
    }

    /**
     * Set a user preference
     */
    setPreference(key: string, value: string): void {
        this.state.userPreferences[key] = value;
        this.touch();
    }

    /**
     * Get a user preference
     */
    getPreference(key: string): string | null {
        return this.state.userPreferences[key] || null;
    }

    /**
     * Get all preferences
     */
    getAllPreferences(): Record<string, string> {
        return { ...this.state.userPreferences };
    }

    /**
     * Get session stats
     */
    getStats(): {
        decisionsCount: number;
        generationsCount: number;
        successRate: number;
        sessionDurationMinutes: number;
    } {
        const successful = this.state.generations.filter(g => g.wasSuccessful).length;
        const total = this.state.generations.length;
        const startTime = new Date(this.state.startedAt).getTime();
        const duration = (Date.now() - startTime) / (1000 * 60);

        return {
            decisionsCount: this.state.decisions.length,
            generationsCount: total,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 100,
            sessionDurationMinutes: Math.round(duration),
        };
    }

    /**
     * Update last active timestamp
     */
    private touch(): void {
        this.state.lastActiveAt = new Date().toISOString();
        this.saveState();
    }

    /**
     * Check if session is still fresh (within 4 hours)
     */
    private isSessionFresh(lastActiveAt: string): boolean {
        const fourHours = 4 * 60 * 60 * 1000;
        const lastActive = new Date(lastActiveAt).getTime();
        return (Date.now() - lastActive) < fourHours;
    }

    /**
     * Load state from localStorage
     */
    private loadState(): SessionMemoryState | null {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Save state to localStorage
     */
    private saveState(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save session memory:', e);
        }
    }

    /**
     * Clear session (start fresh)
     */
    clear(): void {
        localStorage.removeItem(this.storageKey);
        this.state = {
            sessionId: crypto.randomUUID(),
            projectId: this.state.projectId,
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            decisions: [],
            generations: [],
            userPreferences: {},
        };
    }
}

/**
 * Create a session memory instance
 */
export function createSessionMemory(projectId: string): SessionMemory {
    return new SessionMemory(projectId);
}
