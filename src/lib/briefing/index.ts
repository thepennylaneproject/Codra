/**
 * Briefing module index
 * Re-exports all briefing related utilities
 */

export { briefingStore, type BriefingState, type UserSignals, type ProjectPhase, type ProjectStats, type ChangeReport } from './briefing-store';
export { useBriefingState } from './useBriefingState';
export {
    deriveProjectPhase,
    getPhaseLabel,
    getPhaseEmoji,
    getProjectStats,
    formatStatsLine,
    adaptLanguage,
    isNonTechnicalUser,
    computeProjectStateHash,
    detectSignificantChanges,
    getNextActions,
    formatRelativeTime,
    type NextAction,
} from './briefing-utils';
