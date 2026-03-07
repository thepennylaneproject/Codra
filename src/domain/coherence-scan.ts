/**
 * COHERENCE SCAN DOMAIN TYPES
 * 
 * Codra Coherence Scan™ - Proprietary pre-deployment audit system.
 * Surfaces blind spots, prioritizes fixes, converts findings to task queue.
 */

import type { TaskPriority } from './task-queue';
import type { ProjectToolId } from './types';

// ============================================
// Audit Types
// ============================================

export type AuditType =
    | 'ship-ready'
    | 'blind-spot'
    | 'kill-list'
    | 'investor-diligence'
    | 'unclaimed-value'
    | 'coherence-loop';

export const AUDIT_METADATA: Record<AuditType, {
    id: AuditType;
    name: string;
    description: string;
    icon: string;
    estimatedCost: number; // USD
    model: 'claude-sonnet' | 'gpt-4o-mini';
    quickCheckEligible: boolean;
}> = {
    'ship-ready': {
        id: 'ship-ready',
        name: 'Deployment Readiness Audit',
        description: 'Comprehensive pre-launch review of workflows, UX, polish, and trust signals.',
        icon: 'Rocket',
        estimatedCost: 0.40,
        model: 'claude-sonnet',
        quickCheckEligible: true,
    },
    'blind-spot': {
        id: 'blind-spot',
        name: 'Coverage Gap Audit',
        description: 'Surfaces hidden assumptions, builder biases, and perspective gaps.',
        icon: 'Eye',
        estimatedCost: 0.40,
        model: 'claude-sonnet',
        quickCheckEligible: false,
    },
    'kill-list': {
        id: 'kill-list',
        name: 'Decommissioning Audit',
        description: 'Identifies features to remove, merge, defer, or simplify.',
        icon: 'Scissors',
        estimatedCost: 0.08,
        model: 'gpt-4o-mini',
        quickCheckEligible: false,
    },
    'investor-diligence': {
        id: 'investor-diligence',
        name: 'View Source Intelligence Audit',
        description: 'Source-backed codebase intelligence extraction for investor-grade project profiling.',
        icon: 'TrendingUp',
        estimatedCost: 0.50,
        model: 'claude-sonnet',
        quickCheckEligible: false,
    },
    'unclaimed-value': {
        id: 'unclaimed-value',
        name: 'Value Opportunity Audit',
        description: 'Surfaces missed opportunities, underutilized features, and hidden wins.',
        icon: 'Gem',
        estimatedCost: 0.40,
        model: 'claude-sonnet',
        quickCheckEligible: false,
    },
    'coherence-loop': {
        id: 'coherence-loop',
        name: 'Coherence Loop',
        description: 'Post-fix verification comparing before and after findings.',
        icon: 'RefreshCw',
        estimatedCost: 0.08,
        model: 'gpt-4o-mini',
        quickCheckEligible: false,
    },
};

// ============================================
// Scan Types
// ============================================

export type ScanType = 'quick-check' | 'full-scan' | 'deep-scan';

export const SCAN_TYPES: Record<ScanType, {
    name: string;
    description: string;
    auditsIncluded: AuditType[] | 'all';
    multiModel: boolean;
}> = {
    'quick-check': {
        name: 'Quick Check',
        description: 'Fast, focused ship-readiness check.',
        auditsIncluded: ['ship-ready'],
        multiModel: false,
    },
    'full-scan': {
        name: 'Full Scan',
        description: 'Comprehensive audit across all dimensions.',
        auditsIncluded: 'all',
        multiModel: false,
    },
    'deep-scan': {
        name: 'Deep Scan',
        description: 'Multi-model ensemble for maximum insight.',
        auditsIncluded: 'all',
        multiModel: true,
    },
};

// ============================================
// Scan Status
// ============================================

export type ScanStatus =
    | 'pending'     // Created, awaiting context
    | 'gathering'   // Clarifying questions in progress
    | 'queued'      // Ready to execute
    | 'scanning'    // Audits running
    | 'complete'    // Report ready
    | 'failed';     // Error occurred

export type AuditStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface AuditProgress {
    auditType: AuditType;
    status: AuditStatus;
    startedAt?: string;
    completedAt?: string;
}

// ============================================
// Finding Types
// ============================================

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingCategory =
    // Ship Ready categories
    | 'workflow-completeness'
    | 'feature-visibility'
    | 'cognitive-load'
    | 'visual-consistency'
    | 'copy-voice'
    | 'information-architecture'
    | 'state-feedback-trust'
    | 'onboarding'
    | 'launch-polish'
    // Blind Spot categories
    | 'user-assumption'
    | 'builder-bias'
    | 'success-definition'
    | 'risk-avoidance'
    | 'narrative-blindspot'
    // Kill List categories
    | 'feature-value-cost'
    | 'redundancy'
    | 'ux-drag'
    | 'timing'
    | 'conceptual-integrity'
    // Unclaimed Value categories
    | 'missed-opportunity'
    | 'underutilized-feature'
    | 'hidden-win';

export type FindingEffort = 'trivial' | 'small' | 'medium' | 'large';

export interface ScanFinding {
    /** Unique identifier */
    id: string;

    /** Which audit surfaced this */
    auditType: AuditType;

    /** Category within the audit */
    category: FindingCategory;

    /** Severity level */
    severity: FindingSeverity;

    /** Short descriptive title */
    title: string;

    /** What was observed */
    observation: string;

    /** Why this matters */
    whyItMatters: string;

    /** Impact on users */
    userImpact: string;

    /** Actionable recommendation */
    recommendation: string;

    /** Effort estimate */
    estimatedEffort: FindingEffort;

    /** User has selected this for action */
    selected: boolean;

    /** Converted to task ID (if moved to queue) */
    taskId?: string;
}

// ============================================
// Scan Context (from clarifying questions)
// ============================================

export interface ScanContext {
    /** What the project is and does */
    projectDescription: string;

    /** Who this is for */
    targetAudience: string;

    /** When it needs to ship */
    launchTimeline: 'asap' | 'days' | 'weeks' | 'months' | 'exploring';

    /** Known constraints or limitations */
    knownConstraints: string[];

    /** Specific areas of concern */
    focusAreas?: string[];

    /** Additional context */
    additionalNotes?: string;
}

// ============================================
// Scan Summary
// ============================================

export interface ScanSummary {
    /** Counts by severity */
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;

    /** Overall health score (0-100) */
    healthScore: number;

    /** Most dangerous blind spot identified */
    topBlindSpot?: string;

    /** Biggest underutilized strength */
    topStrength?: string;

    /** Strategic question to consider */
    strategicQuestion?: string;

    /** Estimated total fix effort */
    totalEffort: {
        trivial: number;
        small: number;
        medium: number;
        large: number;
    };
}

// ============================================
// Coherence Scan
// ============================================

export interface CoherenceScan {
    /** Unique identifier */
    id: string;

    /** Associated project */
    projectId: string;

    /** User who initiated */
    userId: string;

    /** Type of scan */
    scanType: ScanType;

    /** Current status */
    status: ScanStatus;

    /** Which audits to run / ran */
    auditTypes: AuditType[];

    /** Project context from clarifying questions */
    context?: ScanContext;

    /** Audit progress list */
    auditProgress?: AuditProgress[];

    /** All findings from scan */
    findings: ScanFinding[];

    /** Summary statistics */
    summary?: ScanSummary;

    /** Estimated cost before running */
    estimatedCost: number;

    /** Actual cost incurred */
    actualCost?: number;

    /** Error message if failed */
    error?: string;

    /** Timestamps */
    createdAt: string;
    startedAt?: string;
    completedAt?: string;

    /** Scan progress tracking */
    progress?: {
        phase: 'queued' | 'running' | 'finalizing' | 'complete' | 'failed';
        percent: number;
        completedAudits: number;
        totalAudits: number;
        currentAudit?: AuditType;
    };

    /** If this is a coherence loop, reference to original scan */
    originalScanId?: string;
}

// ============================================
// Usage Tracking
// ============================================

export interface ScanUsage {
    userId: string;
    tier: 'free' | 'pro' | 'team';
    periodStart: string;
    periodEnd: string;
    scansUsed: number;
    scansAllowed: number;
    additionalScansPurchased: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Estimate scan cost based on audit types
 */
export function estimateScanCost(auditTypes: AuditType[]): number {
    return auditTypes.reduce((total, type) => {
        return total + (AUDIT_METADATA[type]?.estimatedCost ?? 0);
    }, 0);
}

/**
 * Get the optimal model for an audit type
 */
export function getAuditModel(auditType: AuditType): 'claude-sonnet' | 'gpt-4o-mini' {
    return AUDIT_METADATA[auditType]?.model ?? 'gpt-4o-mini';
}

/**
 * Map finding severity to task priority
 */
export function severityToPriority(severity: FindingSeverity): TaskPriority {
    switch (severity) {
        case 'critical': return 'critical';
        case 'high': return 'high';
        case 'medium': return 'normal';
        case 'low': return 'low';
        case 'info': return 'low';
    }
}

/**
 * Map finding category to production desk
 */
export function categoryToDesk(category: FindingCategory): ProjectToolId {
    const mapping: Record<FindingCategory, ProjectToolId> = {
        // UX/UI issues → Art & Design
        'workflow-completeness': 'code',
        'feature-visibility': 'design',
        'cognitive-load': 'design',
        'visual-consistency': 'design',
        'copy-voice': 'copy',
        'information-architecture': 'code',
        'state-feedback-trust': 'code',
        'onboarding': 'design',
        'launch-polish': 'design',
        // Strategic issues → Workflow
        'user-assumption': 'code',
        'builder-bias': 'code',
        'success-definition': 'code',
        'risk-avoidance': 'code',
        'narrative-blindspot': 'copy',
        // Technical/Feature issues
        'feature-value-cost': 'code',
        'redundancy': 'code',
        'ux-drag': 'design',
        'timing': 'code',
        'conceptual-integrity': 'code',
        // Opportunity issues
        'missed-opportunity': 'copy',
        'underutilized-feature': 'copy',
        'hidden-win': 'copy',
    };
    return mapping[category] ?? 'code';
}

/**
 * Get audits for scan type
 */
export function getAuditsForScanType(scanType: ScanType): AuditType[] {
    const config = SCAN_TYPES[scanType];
    if (config.auditsIncluded === 'all') {
        return Object.keys(AUDIT_METADATA).filter(
            k => k !== 'coherence-loop'
        ) as AuditType[];
    }
    return config.auditsIncluded;
}

/**
 * Calculate health score from findings
 */
export function calculateHealthScore(findings: ScanFinding[]): number {
    if (findings.length === 0) return 100;

    const weights: Record<FindingSeverity, number> = {
        critical: 25,
        high: 15,
        medium: 8,
        low: 3,
        info: 0,
    };

    const totalDeductions = findings.reduce((sum, f) => sum + weights[f.severity], 0);
    return Math.max(0, Math.min(100, 100 - totalDeductions));
}
