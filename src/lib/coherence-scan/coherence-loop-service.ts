/**
 * COHERENCE LOOP SERVICE
 * 
 * Orchestrates the coherence loop - a post-task verification flow that
 * re-runs audits after findings have been addressed to measure improvement.
 */

import { v4 as uuid } from 'uuid';
import type {
    CoherenceScan,
    ScanFinding,
    ScanSummary,
} from '../../domain/coherence-scan';
import {
    calculateHealthScore,
    AUDIT_METADATA,
} from '../../domain/coherence-scan';
import { getScan } from './coherence-scan-service';

// ============================================
// Loop Types
// ============================================

export interface LoopComparison {
    /** The original scan */
    originalScan: CoherenceScan;
    
    /** The verification scan */
    verifyScan: CoherenceScan;
    
    /** Score improvement */
    scoreImprovement: number;
    
    /** Findings that were resolved */
    resolvedFindings: ScanFinding[];
    
    /** Findings that remain */
    remainingFindings: ScanFinding[];
    
    /** New findings discovered */
    newFindings: ScanFinding[];
    
    /** Whether coherence threshold is met */
    isCoherent: boolean;
}

export interface CoherenceThreshold {
    /** Minimum health score */
    minScore: number;
    
    /** Maximum critical issues allowed */
    maxCritical: number;
    
    /** Maximum high issues allowed */
    maxHigh: number;
}

export const DEFAULT_COHERENCE_THRESHOLD: CoherenceThreshold = {
    minScore: 90,
    maxCritical: 0,
    maxHigh: 3,
};

// ============================================
// Loop State Management
// ============================================

/** In-memory storage for loop history */
const loopHistory: Map<string, LoopComparison[]> = new Map();

// ============================================
// Coherence Loop Functions
// ============================================

/**
 * Check if a scan is eligible for coherence loop
 * (original scan must be complete with findings)
 */
export function isLoopEligible(scanId: string): boolean {
    const scan = getScan(scanId);
    if (!scan) return false;
    if (scan.status !== 'complete') return false;
    if (scan.findings.length === 0) return false;
    return true;
}

/**
 * Get the number of selected findings that have been converted to tasks
 */
export function getAddressedFindingsCount(scan: CoherenceScan): number {
    return scan.findings.filter(f => f.taskId !== undefined).length;
}

/**
 * Check if a coherence loop should be suggested
 * (when most selected findings have been addressed)
 */
export function shouldSuggestLoop(scanId: string): boolean {
    const scan = getScan(scanId);
    if (!scan || scan.status !== 'complete') return false;
    
    const selectedCount = scan.findings.filter(f => f.selected).length;
    const addressedCount = getAddressedFindingsCount(scan);
    
    // Suggest loop when at least 75% of selected findings have tasks
    return selectedCount > 0 && addressedCount / selectedCount >= 0.75;
}

/**
 * Initiate a coherence loop verification scan
 */
export async function initiateCoherenceLoop(
    originalScanId: string,
    userId: string
): Promise<CoherenceScan | null> {
    const originalScan = getScan(originalScanId);
    if (!originalScan || originalScan.status !== 'complete') {
        console.error('Cannot initiate loop: original scan not found or incomplete');
        return null;
    }
    
    // Create a new scan linked to the original
    const loopScan: CoherenceScan = {
        id: uuid(),
        projectId: originalScan.projectId,
        userId,
        scanType: 'quick-check', // Loops use lightweight verification
        status: 'pending',
        auditTypes: ['coherence-loop'],
        context: originalScan.context,
        findings: [],
        estimatedCost: AUDIT_METADATA['coherence-loop'].estimatedCost,
        createdAt: new Date().toISOString(),
        originalScanId, // Link to original
    };
    
    // In production, would save to Supabase and start execution
    // For now, simulate with mock findings
    return loopScan;
}

/**
 * Compare original scan findings with verification scan findings
 */
export function compareScans(
    originalScan: CoherenceScan,
    verifyScan: CoherenceScan
): LoopComparison {
    const originalIds = new Set(originalScan.findings.map(f => f.title.toLowerCase()));
    const verifyIds = new Set(verifyScan.findings.map(f => f.title.toLowerCase()));
    
    // Findings that were in original but not in verify = resolved
    const resolvedFindings = originalScan.findings.filter(
        f => !verifyIds.has(f.title.toLowerCase())
    );
    
    // Findings that are in both = remaining
    const remainingFindings = verifyScan.findings.filter(
        f => originalIds.has(f.title.toLowerCase())
    );
    
    // Findings that are in verify but not in original = new
    const newFindings = verifyScan.findings.filter(
        f => !originalIds.has(f.title.toLowerCase())
    );
    
    // Calculate score improvement
    const originalScore = originalScan.summary?.healthScore ?? calculateHealthScore(originalScan.findings);
    const verifyScore = verifyScan.summary?.healthScore ?? calculateHealthScore(verifyScan.findings);
    const scoreImprovement = verifyScore - originalScore;
    
    // Check if coherence threshold is met
    const verifySummary = verifyScan.summary ?? generateSummary(verifyScan.findings);
    const isCoherent = checkCoherence(verifySummary, DEFAULT_COHERENCE_THRESHOLD);
    
    return {
        originalScan,
        verifyScan,
        scoreImprovement,
        resolvedFindings,
        remainingFindings,
        newFindings,
        isCoherent,
    };
}

/**
 * Generate summary from findings
 */
function generateSummary(findings: ScanFinding[]): ScanSummary {
    const severityCounts = {
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        infoCount: 0,
    };
    
    const effortCounts = { trivial: 0, small: 0, medium: 0, large: 0 };
    
    for (const f of findings) {
        switch (f.severity) {
            case 'critical': severityCounts.criticalCount++; break;
            case 'high': severityCounts.highCount++; break;
            case 'medium': severityCounts.mediumCount++; break;
            case 'low': severityCounts.lowCount++; break;
            case 'info': severityCounts.infoCount++; break;
        }
        effortCounts[f.estimatedEffort]++;
    }
    
    return {
        ...severityCounts,
        healthScore: calculateHealthScore(findings),
        totalEffort: effortCounts,
    };
}

/**
 * Check if a scan meets the coherence threshold
 */
export function checkCoherence(
    summary: ScanSummary,
    threshold: CoherenceThreshold = DEFAULT_COHERENCE_THRESHOLD
): boolean {
    if (summary.healthScore < threshold.minScore) return false;
    if (summary.criticalCount > threshold.maxCritical) return false;
    if (summary.highCount > threshold.maxHigh) return false;
    return true;
}

/**
 * Get loop history for a project
 */
export function getLoopHistory(projectId: string): LoopComparison[] {
    return loopHistory.get(projectId) ?? [];
}

/**
 * Record a loop comparison to history
 */
export function recordLoop(projectId: string, comparison: LoopComparison): void {
    const history = loopHistory.get(projectId) ?? [];
    history.push(comparison);
    loopHistory.set(projectId, history);
}

/**
 * Get coherence progress over time
 */
export function getCoherenceProgress(projectId: string): Array<{
    date: string;
    score: number;
    criticalCount: number;
    highCount: number;
}> {
    const history = getLoopHistory(projectId);
    return history.map(loop => ({
        date: loop.verifyScan.completedAt ?? loop.verifyScan.createdAt,
        score: loop.verifyScan.summary?.healthScore ?? 0,
        criticalCount: loop.verifyScan.summary?.criticalCount ?? 0,
        highCount: loop.verifyScan.summary?.highCount ?? 0,
    }));
}
