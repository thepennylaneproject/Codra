/**
 * STORAGE KEY ADAPTER
 * src/lib/storage/StorageKeyAdapter.ts
 *
 * Handles migration from legacy localStorage keys to canonical keys.
 *
 * POLICY:
 * - Read from BOTH legacy and canonical keys (canonical takes precedence)
 * - Write ONLY to canonical keys (never write legacy keys)
 * - Enables non-breaking gradual migration
 *
 * USAGE:
 *
 *   // Get context revisions (checks both legacy and canonical)
 *   const revisions = adapter.getContextRevisions(projectId);
 *
 *   // Save context revisions (writes to canonical only)
 *   adapter.saveContextRevisions(projectId, revisions);
 *
 *   // Check if project has legacy keys that need migration
 *   const hasLegacy = adapter.hasLegacyKeys(projectId);
 *
 *   // Get migration status for a project
 *   const status = adapter.getMigrationStatus(projectId);
 */

/**
 * Legacy key format (before canonical)
 */
const LEGACY_KEYS = {
    contextRevisions: (projectId: string) => `codra:tearSheet:${projectId}`,
    onboardingProfile: (projectId: string) => `codra:onboardingProfile:${projectId}`,
    smartDefaults: (projectId: string) => `codra:smartDefaults:${projectId}`,
    taskQueue: (projectId: string) => `codra:taskQueue:${projectId}`,
    specification: (projectId: string) => `codra:spread:${projectId}`,
} as const;

/**
 * Canonical key format (canonical standard)
 */
const CANONICAL_KEYS = {
    contextRevisions: (projectId: string) => `codra:context:revisions:${projectId}`,
    context: (projectId: string) => `codra:context:${projectId}`,
    specification: (projectId: string) => `codra:specification:${projectId}`,
    specificationLayout: (projectId: string) => `codra:specification:${projectId}:layout`,
    taskQueue: (projectId: string) => `codra:task-queue:${projectId}`,
    smartDefaults: (projectId: string) => `codra:smart-defaults:${projectId}`,
    onboardingProfile: (projectId: string) => `codra:onboarding-profile:${projectId}`,
    extendedOnboardingProfile: (projectId: string) => `codra:extended-onboarding-profile:${projectId}`,
    projects: () => `codra:projects`,
} as const;

/**
 * Type-safe storage adapter
 */
export class StorageKeyAdapter {
    /**
     * Get context revisions from localStorage.
     * Checks canonical first, falls back to legacy.
     *
     * @param projectId - Project identifier
     * @returns Array of context revisions, or empty array if not found
     */
    getContextRevisions(projectId: string): any[] {
        if (typeof window === 'undefined') return [];

        // Try canonical first
        const canonicalKey = CANONICAL_KEYS.contextRevisions(projectId);
        const canonical = localStorage.getItem(canonicalKey);
        if (canonical) {
            try {
                return JSON.parse(canonical);
            } catch {
                return [];
            }
        }

        // Fall back to legacy
        const legacyKey = LEGACY_KEYS.contextRevisions(projectId);
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
            try {
                return JSON.parse(legacy);
            } catch {
                return [];
            }
        }

        return [];
    }

    /**
     * Save context revisions to localStorage (canonical key only).
     *
     * @param projectId - Project identifier
     * @param revisions - Array of context revisions to save
     */
    saveContextRevisions(projectId: string, revisions: any[]): void {
        if (typeof window === 'undefined') return;

        const key = CANONICAL_KEYS.contextRevisions(projectId);
        localStorage.setItem(key, JSON.stringify(revisions));
    }

    /**
     * Get onboarding profile from localStorage.
     * Checks canonical first (snake_case), falls back to legacy (camelCase).
     *
     * @param projectId - Project identifier
     * @returns Onboarding profile or null if not found
     */
    getOnboardingProfile(projectId: string): any | null {
        if (typeof window === 'undefined') return null;

        // Try canonical first
        const canonicalKey = CANONICAL_KEYS.onboardingProfile(projectId);
        const canonical = localStorage.getItem(canonicalKey);
        if (canonical) {
            try {
                return JSON.parse(canonical);
            } catch {
                return null;
            }
        }

        // Fall back to legacy
        const legacyKey = LEGACY_KEYS.onboardingProfile(projectId);
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
            try {
                return JSON.parse(legacy);
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Save onboarding profile to localStorage (canonical key only).
     *
     * @param projectId - Project identifier
     * @param profile - Onboarding profile to save
     */
    saveOnboardingProfile(projectId: string, profile: any): void {
        if (typeof window === 'undefined') return;

        const key = CANONICAL_KEYS.onboardingProfile(projectId);
        localStorage.setItem(key, JSON.stringify(profile));
    }

    /**
     * Get extended onboarding profile from localStorage.
     *
     * @param projectId - Project identifier
     * @returns Extended onboarding profile or null
     */
    getExtendedOnboardingProfile(projectId: string): any | null {
        if (typeof window === 'undefined') return null;

        const key = CANONICAL_KEYS.extendedOnboardingProfile(projectId);
        const data = localStorage.getItem(key);
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Save extended onboarding profile to localStorage (canonical key only).
     *
     * @param projectId - Project identifier
     * @param profile - Extended onboarding profile to save
     */
    saveExtendedOnboardingProfile(projectId: string, profile: any): void {
        if (typeof window === 'undefined') return;

        const key = CANONICAL_KEYS.extendedOnboardingProfile(projectId);
        localStorage.setItem(key, JSON.stringify(profile));
    }

    /**
     * Get Specification from localStorage.
     * Checks canonical first, falls back to legacy.
     *
     * @param projectId - Project identifier
     * @returns ProjectSpecification or null
     */
    getSpecification(projectId: string): any | null {
        if (typeof window === 'undefined') return null;

        // Try canonical
        const canonicalKey = CANONICAL_KEYS.specification(projectId);
        const data = localStorage.getItem(canonicalKey);
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }

        // Fallback to legacy
        const legacyKey = LEGACY_KEYS.specification(projectId);
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
            try {
                return JSON.parse(legacy);
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Save Specification to localStorage (canonical key only).
     *
     * @param projectId - Project identifier
     * @param specification - ProjectSpecification to save
     */
    saveSpecification(projectId: string, specification: any): void {
        if (typeof window === 'undefined') return;

        const key = CANONICAL_KEYS.specification(projectId);
        localStorage.setItem(key, JSON.stringify(specification));
    }

    /**
     * Get task queue from localStorage.
     *
     * @param projectId - Project identifier
     * @returns TaskQueue or null
     */
    getTaskQueue(projectId: string): any | null {
        if (typeof window === 'undefined') return null;

        const key = CANONICAL_KEYS.taskQueue(projectId);
        const data = localStorage.getItem(key);
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }

        const legacyKey = LEGACY_KEYS.taskQueue(projectId);
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
            try {
                return JSON.parse(legacy);
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Save task queue to localStorage (canonical key only).
     *
     * @param projectId - Project identifier
     * @param queue - TaskQueue to save
     */
    saveTaskQueue(projectId: string, queue: any): void {
        if (typeof window === 'undefined') return;

        const key = CANONICAL_KEYS.taskQueue(projectId);
        localStorage.setItem(key, JSON.stringify(queue));
    }

    /**
     * Get smart defaults from localStorage.
     * Checks canonical first, falls back to legacy.
     */
    getSmartDefaults(projectId: string): any | null {
        if (typeof window === 'undefined') return null;

        const canonicalKey = CANONICAL_KEYS.smartDefaults(projectId);
        const canonical = localStorage.getItem(canonicalKey);
        if (canonical) {
            try {
                return JSON.parse(canonical);
            } catch {
                return null;
            }
        }

        const legacyKey = LEGACY_KEYS.smartDefaults(projectId);
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
            try {
                return JSON.parse(legacy);
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Save smart defaults to localStorage (canonical key only).
     */
    saveSmartDefaults(projectId: string, defaults: any): void {
        if (typeof window === 'undefined') return;

        const key = CANONICAL_KEYS.smartDefaults(projectId);
        localStorage.setItem(key, JSON.stringify(defaults));
    }

    /**
     * Check if a project has legacy keys that haven't been migrated.
     *
     * @param projectId - Project identifier
     * @returns true if any legacy keys exist for this project
     */
    hasLegacyKeys(projectId: string): boolean {
        if (typeof window === 'undefined') return false;

        return (
            localStorage.getItem(LEGACY_KEYS.contextRevisions(projectId)) !== null ||
            localStorage.getItem(LEGACY_KEYS.onboardingProfile(projectId)) !== null ||
            localStorage.getItem(LEGACY_KEYS.smartDefaults(projectId)) !== null ||
            localStorage.getItem(LEGACY_KEYS.taskQueue(projectId)) !== null
        );
    }

    /**
     * Get migration status for a project.
     *
     * @param projectId - Project identifier
     * @returns Object with migration status details
     */
    getMigrationStatus(projectId: string): {
        hasLegacyKeys: boolean;
        hasCanonicalKeys: boolean;
        legacyKeys: string[];
        missingMigrations: string[];
    } {
        if (typeof window === 'undefined') {
            return {
                hasLegacyKeys: false,
                hasCanonicalKeys: false,
                legacyKeys: [],
                missingMigrations: [],
            };
        }

        const legacyKeys: string[] = [];
        const missingMigrations: string[] = [];

        // Check each legacy key
        const legacyContextRevisions = LEGACY_KEYS.contextRevisions(projectId);
        if (localStorage.getItem(legacyContextRevisions)) {
            legacyKeys.push(legacyContextRevisions);
            // Check if canonical exists
            if (!localStorage.getItem(CANONICAL_KEYS.contextRevisions(projectId))) {
                missingMigrations.push('contextRevisions');
            }
        }

        const legacyOnboarding = LEGACY_KEYS.onboardingProfile(projectId);
        if (localStorage.getItem(legacyOnboarding)) {
            legacyKeys.push(legacyOnboarding);
            // Check if canonical exists
            if (!localStorage.getItem(CANONICAL_KEYS.onboardingProfile(projectId))) {
                missingMigrations.push('onboardingProfile');
            }
        }

        const legacySmartDefaults = LEGACY_KEYS.smartDefaults(projectId);
        if (localStorage.getItem(legacySmartDefaults)) {
            legacyKeys.push(legacySmartDefaults);
            if (!localStorage.getItem(CANONICAL_KEYS.smartDefaults(projectId))) {
                missingMigrations.push('smartDefaults');
            }
        }

        const legacyTaskQueue = LEGACY_KEYS.taskQueue(projectId);
        if (localStorage.getItem(legacyTaskQueue)) {
            legacyKeys.push(legacyTaskQueue);
            if (!localStorage.getItem(CANONICAL_KEYS.taskQueue(projectId))) {
                missingMigrations.push('taskQueue');
            }
        }

        return {
            hasLegacyKeys: legacyKeys.length > 0,
            hasCanonicalKeys: Object.values(CANONICAL_KEYS).some((keyFn) => {
                if (typeof keyFn === 'function' && keyFn.length > 0) {
                    return localStorage.getItem(keyFn(projectId)) !== null;
                }
                return false;
            }),
            legacyKeys,
            missingMigrations,
        };
    }

    /**
     * Migrate a project from legacy keys to canonical keys.
     * Reads legacy, writes canonical, but does NOT delete legacy (safe migration).
     *
     * @param projectId - Project identifier
     * @returns Object with migration results
     */
    migrateProject(projectId: string): {
        success: boolean;
        migratedKeys: string[];
        errors: string[];
    } {
        if (typeof window === 'undefined') {
            return { success: false, migratedKeys: [], errors: ['Not in browser environment'] };
        }

        const migratedKeys: string[] = [];
        const errors: string[] = [];

        // Migrate context revisions
        try {
            const contextRevisions = this.getContextRevisions(projectId);
            if (contextRevisions.length > 0) {
                this.saveContextRevisions(projectId, contextRevisions);
                migratedKeys.push(CANONICAL_KEYS.contextRevisions(projectId));
            }
        } catch (error) {
            errors.push(`Failed to migrate contextRevisions: ${error}`);
        }

        // Migrate onboarding profile
        try {
            const profile = this.getOnboardingProfile(projectId);
            if (profile) {
                this.saveOnboardingProfile(projectId, profile);
                migratedKeys.push(CANONICAL_KEYS.onboardingProfile(projectId));
            }
        } catch (error) {
            errors.push(`Failed to migrate onboardingProfile: ${error}`);
        }

        // Migrate smart defaults
        try {
            const defaults = this.getSmartDefaults(projectId);
            if (defaults) {
                this.saveSmartDefaults(projectId, defaults);
                migratedKeys.push(CANONICAL_KEYS.smartDefaults(projectId));
            }
        } catch (error) {
            errors.push(`Failed to migrate smartDefaults: ${error}`);
        }

        // Migrate task queue
        try {
            const queue = this.getTaskQueue(projectId);
            if (queue) {
                this.saveTaskQueue(projectId, queue);
                migratedKeys.push(CANONICAL_KEYS.taskQueue(projectId));
            }
        } catch (error) {
            errors.push(`Failed to migrate taskQueue: ${error}`);
        }

        return {
            success: errors.length === 0,
            migratedKeys,
            errors,
        };
    }

    /**
     * Migrate all projects with legacy keys.
     * Scans localStorage for legacy keys and migrates each project.
     *
     * @returns Object with overall migration results
     */
    migrateAll(): {
        success: boolean;
        projectsMigrated: number;
        totalErrors: number;
    } {
        if (typeof window === 'undefined') {
            return { success: false, projectsMigrated: 0, totalErrors: 0 };
        }

        const legacyKeyPattern = /^codra:(tearSheet|onboardingProfile|smartDefaults|taskQueue|spread):(.+)$/;
        let projectsMigrated = 0;
        let totalErrors = 0;

        // Scan all localStorage keys
        const keysToProcess = new Set<string>();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && legacyKeyPattern.test(key)) {
                const match = key.match(legacyKeyPattern);
                if (match) {
                    keysToProcess.add(match[2]); // Extract projectId
                }
            }
        }

        // Migrate each project
        for (const projectId of keysToProcess) {
            const result = this.migrateProject(projectId);
            if (result.success) {
                projectsMigrated++;
            }
            totalErrors += result.errors.length;
        }

        return {
            success: totalErrors === 0,
            projectsMigrated,
            totalErrors,
        };
    }

    /**
     * Get canonical key for a given entity type and project.
     * Useful for direct key operations.
     *
     * @param entity - Entity type ('contextRevisions', 'onboardingProfile', 'spread', 'taskQueue')
     * @param projectId - Project identifier
     * @returns Canonical storage key
     */
    getCanonicalKey(
        entity: keyof typeof CANONICAL_KEYS,
        projectId?: string
    ): string {
        if (entity === 'projects') {
            return CANONICAL_KEYS.projects();
        }

        if (!projectId) {
            throw new Error(`Project ID is required for entity: ${entity}`);
        }

        return CANONICAL_KEYS[entity](projectId);
    }

    /**
     * Get legacy key for a given entity type and project.
     * Useful for direct legacy key operations.
     *
     * @param entity - Entity type ('contextRevisions', 'onboardingProfile', 'smartDefaults')
     * @param projectId - Project identifier
     * @returns Legacy storage key
     */
    getLegacyKey(
        entity: keyof typeof LEGACY_KEYS,
        projectId: string
    ): string {
        const keyFn = LEGACY_KEYS[entity];
        if (typeof keyFn === 'function') {
            return keyFn(projectId);
        }
        throw new Error(`Cannot get legacy key for entity: ${entity}`);
    }
}

/**
 * Global singleton instance
 */
export const storageAdapter = new StorageKeyAdapter();

export default storageAdapter;
