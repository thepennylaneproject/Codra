/**
 * CONTEXT MANAGER
 * src/lib/memory/context-manager.ts
 * 
 * Persistent context management to solve "context amnesia" pain point.
 * Tracks conversation history, compresses context when window fills,
 * and preserves critical instructions that should never be evicted.
 */

export type ContextPriority = 'critical' | 'high' | 'normal' | 'low';

export interface ContextEntry {
    id: string;
    key: string;
    value: string;
    priority: ContextPriority;
    createdAt: string;
    accessCount: number;
    lastAccessed: string;
    compressed?: boolean;
}

export interface ContextSummary {
    id: string;
    originalEntryIds: string[];
    summary: string;
    createdAt: string;
}

export interface ContextManagerState {
    entries: ContextEntry[];
    summaries: ContextSummary[];
    maxTokens: number;
    currentTokenEstimate: number;
}

// Priority weights for context eviction
const PRIORITY_WEIGHTS: Record<ContextPriority, number> = {
    critical: Infinity, // Never evict
    high: 100,
    normal: 50,
    low: 10,
};

// Rough token estimation (4 chars ≈ 1 token)
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

/**
 * Context Manager - Manages persistent memory across sessions
 */
export class ContextManager {
    private state: ContextManagerState;
    private storageKey: string;

    constructor(projectId: string, maxTokens: number = 8000) {
        this.storageKey = `codra:context:${projectId}`;
        this.state = this.loadState() || {
            entries: [],
            summaries: [],
            maxTokens,
            currentTokenEstimate: 0,
        };
    }

    /**
     * Add context with priority level
     */
    addContext(key: string, value: string, priority: ContextPriority = 'normal'): string {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const entry: ContextEntry = {
            id,
            key,
            value,
            priority,
            createdAt: now,
            accessCount: 0,
            lastAccessed: now,
        };

        this.state.entries.push(entry);
        this.state.currentTokenEstimate += estimateTokens(value);
        
        // Check if we need to compress
        if (this.state.currentTokenEstimate > this.state.maxTokens * 0.8) {
            this.evictLowPriorityEntries();
        }

        this.saveState();
        return id;
    }

    /**
     * Add critical instruction (never evicted)
     */
    addCriticalInstruction(key: string, instruction: string): string {
        return this.addContext(key, instruction, 'critical');
    }

    /**
     * Get all active context formatted for prompts
     */
    getActiveContext(): string {
        const sections: string[] = [];

        // Critical instructions first
        const critical = this.state.entries.filter(e => e.priority === 'critical');
        if (critical.length > 0) {
            sections.push('## Critical Instructions (Always Apply)');
            critical.forEach(e => {
                sections.push(`### ${e.key}\n${e.value}`);
                this.touchEntry(e.id);
            });
        }

        // Summaries of compressed context
        if (this.state.summaries.length > 0) {
            sections.push('\n## Session Context (Summarized)');
            this.state.summaries.forEach(s => {
                sections.push(s.summary);
            });
        }

        // High priority entries
        const high = this.state.entries.filter(e => e.priority === 'high' && !e.compressed);
        if (high.length > 0) {
            sections.push('\n## Key Context');
            high.forEach(e => {
                sections.push(`### ${e.key}\n${e.value}`);
                this.touchEntry(e.id);
            });
        }

        // Normal priority (recent only)
        const normal = this.state.entries
            .filter(e => e.priority === 'normal' && !e.compressed)
            .slice(-10); // Keep last 10 normal entries
        if (normal.length > 0) {
            sections.push('\n## Recent Context');
            normal.forEach(e => {
                sections.push(`- **${e.key}:** ${e.value}`);
                this.touchEntry(e.id);
            });
        }

        return sections.join('\n');
    }

    /**
     * Get critical instructions only
     */
    getCriticalInstructions(): ContextEntry[] {
        return this.state.entries.filter(e => e.priority === 'critical');
    }

    /**
     * Update an existing context entry
     */
    updateContext(id: string, value: string): boolean {
        const entry = this.state.entries.find(e => e.id === id);
        if (!entry) return false;

        const oldTokens = estimateTokens(entry.value);
        const newTokens = estimateTokens(value);
        
        entry.value = value;
        entry.lastAccessed = new Date().toISOString();
        entry.accessCount++;
        
        this.state.currentTokenEstimate += (newTokens - oldTokens);
        this.saveState();
        return true;
    }

    /**
     * Remove a context entry
     */
    removeContext(id: string): boolean {
        const index = this.state.entries.findIndex(e => e.id === id);
        if (index === -1) return false;

        const entry = this.state.entries[index];
        this.state.currentTokenEstimate -= estimateTokens(entry.value);
        this.state.entries.splice(index, 1);
        this.saveState();
        return true;
    }

    /**
     * Get context usage stats
     */
    getUsageStats(): { current: number; max: number; percentage: number } {
        return {
            current: this.state.currentTokenEstimate,
            max: this.state.maxTokens,
            percentage: Math.round((this.state.currentTokenEstimate / this.state.maxTokens) * 100),
        };
    }

    /**
     * Get usage level for UI indicator
     */
    getUsageLevel(): 'low' | 'medium' | 'high' | 'critical' {
        const { percentage } = this.getUsageStats();
        if (percentage < 50) return 'low';
        if (percentage < 75) return 'medium';
        if (percentage < 90) return 'high';
        return 'critical';
    }

    /**
     * Mark entry as accessed (updates LRU tracking)
     */
    private touchEntry(id: string): void {
        const entry = this.state.entries.find(e => e.id === id);
        if (entry) {
            entry.lastAccessed = new Date().toISOString();
            entry.accessCount++;
        }
    }

    /**
     * Evict low-priority entries when context is full
     */
    private evictLowPriorityEntries(): void {
        // Sort by eviction score (lower = more likely to evict)
        const evictableEntries = this.state.entries
            .filter(e => e.priority !== 'critical')
            .map(e => ({
                entry: e,
                score: this.calculateEvictionScore(e),
            }))
            .sort((a, b) => a.score - b.score);

        // Evict until we're under 70%
        const targetTokens = this.state.maxTokens * 0.7;
        
        for (const { entry } of evictableEntries) {
            if (this.state.currentTokenEstimate <= targetTokens) break;
            
            entry.compressed = true;
            this.state.currentTokenEstimate -= estimateTokens(entry.value);
        }

        this.saveState();
    }

    /**
     * Calculate eviction score (higher = keep longer)
     */
    private calculateEvictionScore(entry: ContextEntry): number {
        const priorityWeight = PRIORITY_WEIGHTS[entry.priority];
        const recencyWeight = this.getRecencyWeight(entry.lastAccessed);
        const accessWeight = Math.log(entry.accessCount + 1);
        
        return priorityWeight * recencyWeight * accessWeight;
    }

    /**
     * Get recency weight (1.0 for recent, decays over time)
     */
    private getRecencyWeight(lastAccessed: string): number {
        const now = Date.now();
        const accessed = new Date(lastAccessed).getTime();
        const hoursSince = (now - accessed) / (1000 * 60 * 60);
        
        // Decay to 0.1 over 24 hours
        return Math.max(0.1, 1 - (hoursSince / 24) * 0.9);
    }

    /**
     * Load state from localStorage
     */
    private loadState(): ContextManagerState | null {
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
            console.error('Failed to save context state:', e);
        }
    }

    /**
     * Clear all context (for project reset)
     */
    clear(): void {
        this.state = {
            entries: [],
            summaries: [],
            maxTokens: this.state.maxTokens,
            currentTokenEstimate: 0,
        };
        this.saveState();
    }
}

/**
 * Hook for using context manager in React components
 */
export function createContextManager(projectId: string): ContextManager {
    return new ContextManager(projectId);
}
