/**
 * COHERENCE SCAN SERVICE
 * 
 * Main orchestrator for running scans, managing state, and converting findings to tasks.
 */

import { v4 as uuid } from 'uuid';
import type {
    AuditType,
    AuditProgress,
    CoherenceScan,
    ScanContext,
    ScanFinding,
    ScanSummary,
    ScanType,
} from '../../domain/coherence-scan';
import {
    getAuditsForScanType,
    estimateScanCost,
    calculateHealthScore,
    severityToPriority,
    categoryToDesk,
} from '../../domain/coherence-scan';
import {
    parseAuditResponse,
    CLARIFYING_QUESTIONS,
    type AuditOutputSchema,
} from '../../domain/audit-templates';
import { createRoutingPlan, type RoutingDecision } from './scan-model-router';
import { canRunScan, recordScanUsage } from './scan-usage-tracker';
import type { SpecificationTask } from '../../domain/task-queue';

// ============================================
// Scan State Management
// ============================================

const SCAN_STORAGE_KEY = 'codra:coherence-scans';

function loadPersistedScans(): Map<string, CoherenceScan> {
    if (typeof window === 'undefined') return new Map();

    try {
        const raw = localStorage.getItem(SCAN_STORAGE_KEY);
        if (!raw) return new Map();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Map();
        return new Map(parsed.map((scan: CoherenceScan) => [scan.id, scan]));
    } catch {
        return new Map();
    }
}

function persistScans(scans: Map<string, CoherenceScan>) {
    if (typeof window === 'undefined') return;
    try {
        const payload = Array.from(scans.values());
        localStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Ignore persistence failures
    }
}

function saveScan(scan: CoherenceScan) {
    scansInProgress.set(scan.id, scan);
    persistScans(scansInProgress);
}

// In-memory scan storage (hydrated from localStorage)
const scansInProgress = loadPersistedScans();

// ============================================
// Service Functions
// ============================================

/**
 * Initiate a new scan
 */
export async function initiateScan(
    userId: string,
    projectId: string,
    scanType: ScanType,
    userTier: 'free' | 'pro' | 'team'
): Promise<{ scan: CoherenceScan; allowed: boolean; error?: string }> {
    // Check if user can run this scan
    const canRun = await canRunScan(userId, scanType, userTier);
    
    if (!canRun.allowed) {
        return {
            scan: null as unknown as CoherenceScan,
            allowed: false,
            error: canRun.reason,
        };
    }
    
    // Determine which audits to run
    const auditTypes = getAuditsForScanType(scanType);
    const estimatedCost = estimateScanCost(auditTypes);
    const auditProgress: AuditProgress[] = auditTypes.map((auditType) => ({
        auditType,
        status: 'pending',
    }));
    
    const scan: CoherenceScan = {
        id: uuid(),
        projectId,
        userId,
        scanType,
        status: 'pending',
        auditTypes,
        auditProgress,
        progress: {
            phase: 'queued',
            percent: 0,
            completedAudits: 0,
            totalAudits: auditTypes.length,
        },
        findings: [],
        estimatedCost,
        createdAt: new Date().toISOString(),
    };
    
    saveScan(scan);
    
    return { scan, allowed: true };
}

/**
 * Get clarifying questions for a scan
 */
export function getClarifyingQuestions() {
    return CLARIFYING_QUESTIONS;
}

/**
 * Submit context and start the scan
 */
export async function submitContextAndStartScan(
    scanId: string,
    context: ScanContext
): Promise<CoherenceScan> {
    const scan = scansInProgress.get(scanId);
    if (!scan) {
        throw new Error(`Scan ${scanId} not found`);
    }
    
    scan.context = context;
    scan.status = 'queued';
    scan.progress = {
        phase: 'queued',
        percent: 0,
        completedAudits: 0,
        totalAudits: scan.auditTypes.length,
    };
    saveScan(scan);
    
    // Start scan execution (in real implementation, this would be async/queued)
    executeScan(scanId).catch(console.error);
    
    return scan;
}

/**
 * Execute the scan
 */
export async function executeScan(scanId: string): Promise<void> {
    const scan = scansInProgress.get(scanId);
    if (!scan) {
        throw new Error(`Scan ${scanId} not found`);
    }
    
    scan.status = 'scanning';
    scan.startedAt = new Date().toISOString();
    scan.progress = {
        phase: 'running',
        percent: 0,
        completedAudits: 0,
        totalAudits: scan.auditTypes.length,
    };
    saveScan(scan);
    
    const routingPlan = createRoutingPlan(scan.auditTypes, scan.scanType);
    const allFindings: ScanFinding[] = [];
    let actualCost = 0;
    
    try {
        // Run each audit
        for (const decision of routingPlan.decisions) {
            if (scan.auditProgress) {
                scan.auditProgress = scan.auditProgress.map((audit) => (
                    audit.auditType === decision.auditType
                        ? { ...audit, status: 'running', startedAt: new Date().toISOString() }
                        : audit
                ));
            }
            scan.progress = {
                phase: 'running',
                percent: scan.progress?.percent ?? 0,
                completedAudits: scan.progress?.completedAudits ?? 0,
                totalAudits: scan.auditTypes.length,
                currentAudit: decision.auditType,
            };
            saveScan(scan);

            const auditFindings = await runAudit(
                decision,
                scan.context!
            );
            allFindings.push(...auditFindings.findings);
            actualCost += decision.estimatedCost;

            const completedAudits: number = (scan.progress?.completedAudits ?? 0) + 1;
            const percent = Math.round((completedAudits / scan.auditTypes.length) * 100);

            if (scan.auditProgress) {
                scan.auditProgress = scan.auditProgress.map((audit) => (
                    audit.auditType === decision.auditType
                        ? { ...audit, status: 'complete', completedAt: new Date().toISOString() }
                        : audit
                ));
            }
            scan.progress = {
                phase: 'running',
                percent,
                completedAudits,
                totalAudits: scan.auditTypes.length,
                currentAudit: decision.auditType,
            };
            saveScan(scan);
        }
        
        // Calculate summary
        const summary = calculateSummary(allFindings);
        
        scan.findings = allFindings;
        scan.summary = summary;
        scan.actualCost = actualCost;
        scan.status = 'complete';
        scan.completedAt = new Date().toISOString();
        scan.progress = {
            phase: 'complete',
            percent: 100,
            completedAudits: scan.auditTypes.length,
            totalAudits: scan.auditTypes.length,
        };
        
        // Record usage
        await recordScanUsage(scan.userId, scan.scanType, actualCost);
        
    } catch (error) {
        scan.status = 'failed';
        scan.error = error instanceof Error ? error.message : 'Unknown error';
        scan.progress = {
            phase: 'failed',
            percent: scan.progress?.percent ?? 0,
            completedAudits: scan.progress?.completedAudits ?? 0,
            totalAudits: scan.auditTypes.length,
            currentAudit: scan.progress?.currentAudit,
        };
    }
    
    saveScan(scan);
}

export async function resumeScan(scanId: string): Promise<void> {
    const scan = scansInProgress.get(scanId);
    if (!scan) return;
    if (scan.status === 'complete' || scan.status === 'failed') return;
    if (!scan.context) return;
    await executeScan(scanId);
}

/**
 * Run a single audit
 */
async function runAudit(
    decision: RoutingDecision,
    context: ScanContext
): Promise<{ findings: ScanFinding[] }> {
    // NOTE: In production, we would use buildAuditPrompt() here to call the AI
    // For now, we return mock findings for development purposes
    void context;
    
    // TODO: Integrate with actual AI provider
    // For now, return mock findings
    const mockResponse = generateMockFindings(decision.auditType);
    const parsed = parseAuditResponse(JSON.stringify(mockResponse));
    
    if (!parsed) {
        return { findings: [] };
    }
    
    // Convert to ScanFinding with IDs
    const findings: ScanFinding[] = parsed.findings.map(parsedFinding => ({
        id: uuid(),
        auditType: decision.auditType,
        category: parsedFinding.category,
        severity: parsedFinding.severity,
        title: parsedFinding.title,
        observation: parsedFinding.observation,
        whyItMatters: parsedFinding.whyItMatters,
        userImpact: parsedFinding.userImpact,
        recommendation: parsedFinding.recommendation,
        estimatedEffort: parsedFinding.estimatedEffort,
        selected: false,
    }));
    
    return { findings };
}

/**
 * Calculate scan summary from findings
 */
function calculateSummary(findings: ScanFinding[]): ScanSummary {
    const severityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
    };
    
    const effortCounts = {
        trivial: 0,
        small: 0,
        medium: 0,
        large: 0,
    };
    
    for (const finding of findings) {
        severityCounts[finding.severity]++;
        effortCounts[finding.estimatedEffort]++;
    }
    
    return {
        criticalCount: severityCounts.critical,
        highCount: severityCounts.high,
        mediumCount: severityCounts.medium,
        lowCount: severityCounts.low,
        infoCount: severityCounts.info,
        healthScore: calculateHealthScore(findings),
        totalEffort: effortCounts,
    };
}

/**
 * Get a scan by ID
 */
export function getScan(scanId: string): CoherenceScan | undefined {
    return scansInProgress.get(scanId);
}

export function listScans(): CoherenceScan[] {
    return Array.from(scansInProgress.values()).sort((a, b) => (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
}

export function registerScan(scan: CoherenceScan): void {
    saveScan(scan);
}

export function getLatestScanForProject(projectId: string): CoherenceScan | undefined {
    return listScans().find((scan) => scan.projectId === projectId);
}

/**
 * Toggle finding selection
 */
export function toggleFindingSelection(scanId: string, findingId: string): void {
    const scan = scansInProgress.get(scanId);
    if (!scan) return;
    
    const finding = scan.findings.find(scanFinding => scanFinding.id === findingId);
    if (finding) {
        finding.selected = !finding.selected;
    }
    saveScan(scan);
}

/**
 * Convert selected findings to tasks
 */
export function convertFindingsToTasks(
    scan: CoherenceScan,
    projectContext: { projectId: string; title: string }
): SpecificationTask[] {
    void projectContext;
    const selectedFindings = scan.findings.filter((selectedFinding) => selectedFinding.selected);

    return selectedFindings.map((finding, index) => {
        const deskId = categoryToDesk(finding.category);
        return {
            id: uuid(),
            title: `Fix: ${finding.title}`,
            description: `${finding.observation}\n\nRecommendation: ${finding.recommendation}`,
            deskId,
            toolId: deskId,
            status: 'pending' as const,
            order: index + 1,
            priority: severityToPriority(finding.severity),
            dependencies: [],
            estimatedCost: 0.1,
            contextAnchor: `coherence-scan:${scan.id}:${finding.id}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });
}

// ============================================
// Mock Data (for development)
// ============================================

function generateMockFindings(auditType: AuditType): AuditOutputSchema {
    const mockFindings: Record<AuditType, AuditOutputSchema> = {
        'ship-ready': {
            findings: [
                {
                    category: 'onboarding',
                    severity: 'high',
                    title: 'Cold start provides no guidance',
                    observation: 'New users land on an empty dashboard with no clear next step.',
                    whyItMatters: 'Users who don\'t understand how to start will leave immediately.',
                    userImpact: 'High bounce rate, low activation.',
                    recommendation: 'Add a first-run wizard or checklist that guides users to their first success.',
                    estimatedEffort: 'medium',
                },
                {
                    category: 'state-feedback-trust',
                    severity: 'medium',
                    title: 'Save actions lack confirmation',
                    observation: 'When users save settings, there\'s no visual feedback confirming the action.',
                    whyItMatters: 'Users may click save multiple times or not trust that it worked.',
                    userImpact: 'Anxiety, repeated actions, potential data issues.',
                    recommendation: 'Add toast notifications or inline success messages for all save actions.',
                    estimatedEffort: 'small',
                },
            ],
            summary: {
                topBlindSpot: 'Onboarding assumes users know what the product does.',
                topStrength: 'Core functionality is well-implemented.',
                strategicQuestion: 'What does "success" look like in the first 5 minutes?',
            },
        },
        'blind-spot': {
            findings: [
                {
                    category: 'builder-bias',
                    severity: 'high',
                    title: 'Expert terminology leaking into UI',
                    observation: 'Labels like "Spread" and "Production Desk" assume domain knowledge.',
                    whyItMatters: 'New users won\'t understand what these mean.',
                    userImpact: 'Confusion, feature underutilization.',
                    recommendation: 'Add tooltips or use more intuitive language.',
                    estimatedEffort: 'small',
                },
            ],
            summary: {
                topBlindSpot: 'You assume users understand industry terms.',
                topStrength: 'Deep domain expertise is visible in the feature depth.',
                strategicQuestion: 'Would a complete beginner understand what problem you solve?',
            },
        },
        'kill-list': {
            findings: [
                {
                    category: 'timing',
                    severity: 'medium',
                    title: 'Settings page has premature options',
                    observation: 'Advanced AI configuration visible to users who haven\'t used basic features yet.',
                    whyItMatters: 'Overwhelming options reduce perceived simplicity.',
                    userImpact: 'Cognitive overload, decision paralysis.',
                    recommendation: 'Hide advanced settings behind progressive disclosure.',
                    estimatedEffort: 'small',
                },
            ],
        },
        'investor-diligence': {
            findings: [
                {
                    category: 'feature-visibility',
                    severity: 'medium',
                    title: 'Project metadata is not fully surfaced',
                    observation: 'The repository exposes implementation details, but higher-level project identity and deployment evidence are not consistently summarized in one place.',
                    whyItMatters: 'Codebase diligence is slower when core facts must be inferred from scattered files.',
                    userImpact: 'Stakeholders spend more time validating what the product is and how mature it is.',
                    recommendation: 'Generate a structured source-backed audit covering identity, architecture, features, operations, and maturity signals.',
                    estimatedEffort: 'medium',
                },
            ],
        },
        'unclaimed-value': {
            findings: [
                {
                    category: 'underutilized-feature',
                    severity: 'low',
                    title: 'Export functionality is buried',
                    observation: 'Users can export work but the feature is hidden in a submenu.',
                    whyItMatters: 'This could be a key differentiator.',
                    userImpact: 'Users may not realize they can share/export their work.',
                    recommendation: 'Surface export options more prominently after task completion.',
                    estimatedEffort: 'trivial',
                },
            ],
        },
        'coherence-loop': {
            findings: [],
        },
    };
    
    return mockFindings[auditType] ?? { findings: [] };
}
