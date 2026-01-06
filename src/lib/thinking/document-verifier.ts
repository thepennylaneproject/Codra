/**
 * Document Verifier
 *
 * You verify, not judge.
 * Check the document against constraints and assumptions.
 *
 * This is Phase 7: Verification Without Drama.
 * When something is wrong, Codra does not panic or highlight.
 * It simply notes the conflict.
 */

import type {
  PlacedDocument,
  VerificationResult,
  VerificationStatus,
  VerificationCheck,
  Conflict,
  ConflictType,
  ConflictSeverity,
  ThoughtFragment,
  ShadowProject,
  Proposal,
} from './types';

// ============================================================================
// VERIFICATION CONTEXT
// ============================================================================

export interface VerificationContext {
  constraints: string[];
  assumptions: string[];
  coreBeliefs: string[];
  anxieties: string[];
  antiPatterns: string[];
  relatedDocuments: PlacedDocument[];
}

// ============================================================================
// VERIFIER PROMPT
// ============================================================================

const VERIFIER_SYSTEM_PROMPT = `You verify, not judge.

TASK:
Check the document against constraints and assumptions.

OUTPUT:
VerificationResult object.`;

function buildVerifierUserPrompt(
  document: PlacedDocument,
  context: VerificationContext
): string {
  return `INPUT:
Document:
- Title: ${document.title}
- Content: ${document.content.slice(0, 1000)}${document.content.length > 1000 ? '...' : ''}

Constraints:
${context.constraints.map((c) => `- ${c}`).join('\n') || '(none)'}

Assumptions:
${context.assumptions.map((a) => `- ${a}`).join('\n') || '(none)'}

Core Beliefs:
${context.coreBeliefs.map((b) => `- ${b}`).join('\n') || '(none)'}

Anti-patterns to avoid:
${context.antiPatterns.map((a) => `- ${a}`).join('\n') || '(none)'}

OUTPUT:
Return verification result as JSON with:
- status: "verified" | "attention" | "conflict"
- checks: array of { name, passed, details }
- conflicts: array of { type, description, severity }
- notes: array of strings`;
}

// ============================================================================
// AI DOCUMENT VERIFIER
// ============================================================================

export interface DocumentVerifierProvider {
  verify(document: PlacedDocument, context: VerificationContext): Promise<VerificationResult>;
}

/**
 * Create an AI-powered document verifier.
 */
export function createAIDocumentVerifier(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): DocumentVerifierProvider {
  return {
    async verify(
      document: PlacedDocument,
      context: VerificationContext
    ): Promise<VerificationResult> {
      const userPrompt = buildVerifierUserPrompt(document, context);

      try {
        const response = await complete(VERIFIER_SYSTEM_PROMPT, userPrompt);
        return parseVerificationResponse(response, document.id);
      } catch (error) {
        console.warn('AI document verification failed:', error);
        return verifyDocumentLocally(document, context);
      }
    },
  };
}

/**
 * Parse verification response.
 */
function parseVerificationResponse(
  response: string,
  documentId: string
): VerificationResult {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return createDefaultResult(documentId);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    const status = validateStatus(parsed.status);
    const checks = parseChecks(parsed.checks);
    const conflicts = parseConflicts(parsed.conflicts);
    const notes = Array.isArray(parsed.notes) ? parsed.notes.map(String) : [];

    return {
      documentId,
      status,
      checks,
      conflicts,
      notes,
      verifiedAt: new Date(),
    };
  } catch {
    return createDefaultResult(documentId);
  }
}

function validateStatus(status: unknown): VerificationStatus {
  if (status === 'verified' || status === 'attention' || status === 'conflict' || status === 'pending' || status === 'stale') {
    return status;
  }
  return 'pending';
}

function parseChecks(checks: unknown): VerificationCheck[] {
  if (!Array.isArray(checks)) return [];

  return checks
    .filter((c) => c && typeof c === 'object' && typeof c.name === 'string')
    .map((c) => ({
      id: crypto.randomUUID(),
      name: String(c.name),
      passed: c.passed === true,
      details: typeof c.details === 'string' ? c.details : null,
      checkedAt: new Date(),
    }));
}

function parseConflicts(conflicts: unknown): Conflict[] {
  if (!Array.isArray(conflicts)) return [];

  return conflicts
    .filter((c) => c && typeof c === 'object' && typeof c.description === 'string')
    .map((c) => ({
      id: crypto.randomUUID(),
      type: validateConflictType(c.type),
      description: String(c.description),
      relatedDocuments: Array.isArray(c.relatedDocuments) ? c.relatedDocuments : [],
      relatedFragments: Array.isArray(c.relatedFragments) ? c.relatedFragments : [],
      severity: validateSeverity(c.severity),
      resolvedAt: null,
      resolution: null,
    }));
}

function validateConflictType(type: unknown): ConflictType {
  if (type === 'contradiction' || type === 'assumption-violated' || type === 'constraint-failed') {
    return type;
  }
  return 'contradiction';
}

function validateSeverity(severity: unknown): ConflictSeverity {
  if (severity === 'note' || severity === 'review' || severity === 'blocking') {
    return severity;
  }
  return 'review';
}

function createDefaultResult(documentId: string): VerificationResult {
  return {
    documentId,
    status: 'pending',
    checks: [],
    conflicts: [],
    notes: ['Verification could not be completed'],
    verifiedAt: new Date(),
  };
}

// ============================================================================
// LOCAL DOCUMENT VERIFIER (Fallback)
// ============================================================================

/**
 * Local document verification when AI is unavailable.
 */
export function verifyDocumentLocally(
  document: PlacedDocument,
  context: VerificationContext
): VerificationResult {
  const checks: VerificationCheck[] = [];
  const conflicts: Conflict[] = [];
  const notes: string[] = [];

  const contentLower = document.content.toLowerCase();

  // Check against constraints
  for (const constraint of context.constraints) {
    const check = checkConstraint(document, constraint);
    checks.push(check);

    if (!check.passed) {
      conflicts.push({
        id: crypto.randomUUID(),
        type: 'constraint-failed',
        description: `Constraint violated: "${constraint}"`,
        relatedDocuments: [],
        relatedFragments: [],
        severity: 'review',
        resolvedAt: null,
        resolution: null,
      });
    }
  }

  // Check against anti-patterns
  for (const antiPattern of context.antiPatterns) {
    const check = checkAntiPattern(document, antiPattern);
    checks.push(check);

    if (!check.passed) {
      conflicts.push({
        id: crypto.randomUUID(),
        type: 'contradiction',
        description: `Contains avoided pattern: "${antiPattern}"`,
        relatedDocuments: [],
        relatedFragments: [],
        severity: 'review',
        resolvedAt: null,
        resolution: null,
      });
    }
  }

  // Check against core beliefs (should align)
  for (const belief of context.coreBeliefs) {
    const check = checkBeliefAlignment(document, belief);
    checks.push(check);

    if (!check.passed) {
      notes.push(`May not align with core belief: "${belief}"`);
    }
  }

  // Check for anxiety triggers
  for (const anxiety of context.anxieties) {
    const check = checkAnxietyTrigger(document, anxiety);
    if (!check.passed) {
      notes.push(`May trigger stated concern: "${anxiety}"`);
    }
  }

  // Determine overall status
  const status = determineStatus(checks, conflicts);

  return {
    documentId: document.id,
    status,
    checks,
    conflicts,
    notes,
    verifiedAt: new Date(),
  };
}

/**
 * Check if document violates a constraint.
 */
function checkConstraint(document: PlacedDocument, constraint: string): VerificationCheck {
  const contentLower = document.content.toLowerCase();
  const constraintLower = constraint.toLowerCase();

  // Extract key terms from constraint
  const constraintTerms = extractKeyTerms(constraintLower);

  // Check for negation patterns in constraint
  const isNegativeConstraint = /\b(no|not|don't|won't|avoid|never)\b/.test(constraintLower);

  let passed = true;
  let details: string | null = null;

  if (isNegativeConstraint) {
    // For negative constraints, check if forbidden terms appear
    for (const term of constraintTerms) {
      if (term.length > 3 && contentLower.includes(term)) {
        passed = false;
        details = `Contains "${term}" which constraint forbids`;
        break;
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    name: `Constraint: ${truncate(constraint, 40)}`,
    passed,
    details,
    checkedAt: new Date(),
  };
}

/**
 * Check if document contains an anti-pattern.
 */
function checkAntiPattern(document: PlacedDocument, antiPattern: string): VerificationCheck {
  const contentLower = document.content.toLowerCase();
  const patternLower = antiPattern.toLowerCase();

  const patternTerms = extractKeyTerms(patternLower);

  let matchCount = 0;
  for (const term of patternTerms) {
    if (term.length > 3 && contentLower.includes(term)) {
      matchCount++;
    }
  }

  // Fail if multiple terms match (suggests the pattern is present)
  const passed = matchCount < 2;

  return {
    id: crypto.randomUUID(),
    name: `Avoid: ${truncate(antiPattern, 40)}`,
    passed,
    details: passed ? null : `Contains elements of avoided pattern`,
    checkedAt: new Date(),
  };
}

/**
 * Check if document aligns with a core belief.
 */
function checkBeliefAlignment(document: PlacedDocument, belief: string): VerificationCheck {
  const contentLower = document.content.toLowerCase();
  const beliefLower = belief.toLowerCase();

  const beliefTerms = extractKeyTerms(beliefLower);

  // For beliefs, we check for presence (alignment)
  let matchCount = 0;
  for (const term of beliefTerms) {
    if (term.length > 3 && contentLower.includes(term)) {
      matchCount++;
    }
  }

  // Pass if at least some belief terms are present
  const passed = matchCount > 0 || beliefTerms.length === 0;

  return {
    id: crypto.randomUUID(),
    name: `Aligns with: ${truncate(belief, 40)}`,
    passed,
    details: passed ? null : 'May not reflect this belief',
    checkedAt: new Date(),
  };
}

/**
 * Check if document might trigger a stated anxiety.
 */
function checkAnxietyTrigger(document: PlacedDocument, anxiety: string): VerificationCheck {
  const contentLower = document.content.toLowerCase();
  const anxietyLower = anxiety.toLowerCase();

  // Extract what they're anxious about
  const anxietyTerms = extractKeyTerms(anxietyLower);

  let triggered = false;
  for (const term of anxietyTerms) {
    if (term.length > 3 && contentLower.includes(term)) {
      triggered = true;
      break;
    }
  }

  return {
    id: crypto.randomUUID(),
    name: `Concern: ${truncate(anxiety, 40)}`,
    passed: !triggered,
    details: triggered ? 'May relate to stated concern' : null,
    checkedAt: new Date(),
  };
}

/**
 * Determine verification status from checks and conflicts.
 */
function determineStatus(
  checks: VerificationCheck[],
  conflicts: Conflict[]
): VerificationStatus {
  // Any blocking conflict = conflict status
  if (conflicts.some((c) => c.severity === 'blocking')) {
    return 'conflict';
  }

  // Any review-level conflict = attention status
  if (conflicts.some((c) => c.severity === 'review')) {
    return 'attention';
  }

  // Any failed checks = attention
  if (checks.some((c) => !c.passed)) {
    return 'attention';
  }

  // All good
  return 'verified';
}

/**
 * Extract key terms from a string (remove stopwords).
 */
function extractKeyTerms(text: string): string[] {
  const stopwords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
    'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'don', 'now', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'it', 'its', 'this', 'that', 'these', 'those', 'and', 'but', 'or',
    'as', 'if', 'any', 'want', 'like', 'hate', 'avoid', 'never', 'always',
  ]);

  return text
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}

// ============================================================================
// BUILD VERIFICATION CONTEXT
// ============================================================================

/**
 * Build verification context from project state.
 */
export function buildVerificationContext(
  shadow: ShadowProject,
  proposal: Proposal | null,
  documents: PlacedDocument[]
): VerificationContext {
  return {
    constraints: shadow.constraints,
    assumptions: proposal?.assumptions.map((a) => a.statement) ?? [],
    coreBeliefs: shadow.coreBeliefs,
    anxieties: shadow.anxieties,
    antiPatterns: shadow.antiPatterns,
    relatedDocuments: documents,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { VERIFIER_SYSTEM_PROMPT, buildVerifierUserPrompt };
