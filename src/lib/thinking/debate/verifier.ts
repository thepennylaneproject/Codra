/**
 * Verifier Model
 *
 * You estimate cost conservatively.
 * Check coherence, feasibility, and provide cost breakdown.
 *
 * Rules:
 * - Always include uncertainty.
 * - Prefer overestimation.
 *
 * This is Model E in the multi-model debate.
 * It's the final check before a proposal is presented.
 */

import type { Proposal, ProposalModule, CostRange, CostDriver, ScopeReduction } from '../types';
import type { SynthesizerOutput, SynthesizedModule } from './synthesizer';

// ============================================================================
// VERIFIER SCHEMA
// ============================================================================

export interface CostBreakdown {
  reasoning: number;       // Multi-model debate cost
  generation: number;      // Content generation
  verification: number;    // Quality checks
  revisionBuffer: number;  // Expected revisions (40% default)
  uncertaintyBuffer: number; // Unknown unknowns (20% default)
  total: CostRange;
}

export interface ModuleVerification {
  moduleId: string;
  moduleName: string;
  isCoherent: boolean;
  isFeasible: boolean;
  coherenceIssues: string[];
  feasibilityIssues: string[];
  costBreakdown: CostBreakdown;
  costDrivers: CostDriver[];
  reductionOptions: ScopeReduction[];
}

export interface VerifierOutput {
  moduleVerifications: ModuleVerification[];
  overallCoherence: boolean;
  overallFeasibility: boolean;
  totalCost: CostRange;
  criticalIssues: string[];
  recommendations: string[];
}

// ============================================================================
// VERIFIER PROMPT
// ============================================================================

const VERIFIER_SYSTEM_PROMPT = `You estimate cost conservatively.

TASK:
Estimate cost with buffers and drivers.

RULES:
- Always include uncertainty.
- Prefer overestimation.`;

function buildVerifierUserPrompt(module: SynthesizedModule | ProposalModule): string {
  return `INPUT:
Proposal Module:
- Name: ${module.name}
- Objective: ${module.objective}
- Outcome: ${module.outcome}
- Risk Level: ${module.riskLevel}
- Verification Criteria: ${module.verificationCriteria.join('; ')}

OUTPUT:
Cost breakdown + reduction options.`;
}

// ============================================================================
// AI VERIFIER
// ============================================================================

export interface VerifierProvider {
  verify(synthesis: SynthesizerOutput): Promise<VerifierOutput>;
  verifyModule(module: SynthesizedModule | ProposalModule): Promise<ModuleVerification>;
}

/**
 * Create an AI-powered verifier.
 */
export function createAIVerifier(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): VerifierProvider {
  return {
    async verify(synthesis: SynthesizerOutput): Promise<VerifierOutput> {
      const moduleVerifications: ModuleVerification[] = [];

      // Verify each module
      for (const module of synthesis.modules) {
        const verification = await this.verifyModule(module);
        moduleVerifications.push(verification);
      }

      return aggregateVerifications(moduleVerifications, synthesis);
    },

    async verifyModule(module: SynthesizedModule | ProposalModule): Promise<ModuleVerification> {
      const userPrompt = buildVerifierUserPrompt(module);

      try {
        const response = await complete(VERIFIER_SYSTEM_PROMPT, userPrompt);
        return parseVerifierResponse(response, module);
      } catch (error) {
        console.warn('AI verification failed:', error);
        return verifyModuleLocally(module);
      }
    },
  };
}

/**
 * Parse verifier response for a single module.
 */
function parseVerifierResponse(
  response: string,
  module: SynthesizedModule | ProposalModule
): ModuleVerification {
  // Try to extract JSON
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        moduleId: 'id' in module ? module.id : crypto.randomUUID(),
        moduleName: module.name,
        isCoherent: parsed.isCoherent !== false,
        isFeasible: parsed.isFeasible !== false,
        coherenceIssues: Array.isArray(parsed.coherenceIssues)
          ? parsed.coherenceIssues.map(String)
          : [],
        feasibilityIssues: Array.isArray(parsed.feasibilityIssues)
          ? parsed.feasibilityIssues.map(String)
          : [],
        costBreakdown: parseCostBreakdown(parsed.costBreakdown, module),
        costDrivers: Array.isArray(parsed.costDrivers)
          ? parsed.costDrivers.map(parseCostDriver)
          : [],
        reductionOptions: Array.isArray(parsed.reductionOptions)
          ? parsed.reductionOptions.map(parseReductionOption)
          : [],
      };
    } catch {
      // Fall through to local
    }
  }

  return verifyModuleLocally(module);
}

function parseCostBreakdown(
  breakdown: any,
  module: SynthesizedModule | ProposalModule
): CostBreakdown {
  if (!breakdown || typeof breakdown !== 'object') {
    return estimateCostLocally(module);
  }

  const reasoning = typeof breakdown.reasoning === 'number' ? breakdown.reasoning : 0;
  const generation = typeof breakdown.generation === 'number' ? breakdown.generation : 0;
  const verification = typeof breakdown.verification === 'number' ? breakdown.verification : 0;
  const revisionBuffer = typeof breakdown.revisionBuffer === 'number' ? breakdown.revisionBuffer : 0;
  const uncertaintyBuffer = typeof breakdown.uncertaintyBuffer === 'number' ? breakdown.uncertaintyBuffer : 0;

  const base = reasoning + generation + verification;
  const expected = base + revisionBuffer + uncertaintyBuffer;

  return {
    reasoning,
    generation,
    verification,
    revisionBuffer,
    uncertaintyBuffer,
    total: {
      minimum: base * 0.8,
      expected,
      maximum: expected * 1.5,
      currency: 'USD',
      confidence: 0.6,
    },
  };
}

function parseCostDriver(driver: any): CostDriver {
  return {
    factor: String(driver.factor || driver.description || 'Unknown factor'),
    impact: driver.impact === 'low' || driver.impact === 'medium' || driver.impact === 'high'
      ? driver.impact
      : 'medium',
    estimatedCost: typeof driver.estimatedCost === 'number' ? driver.estimatedCost : 0,
    mitigation: String(driver.mitigation || ''),
  };
}

function parseReductionOption(option: any): ScopeReduction {
  return {
    id: crypto.randomUUID(),
    description: String(option.description || ''),
    savingsEstimate: typeof option.savingsEstimate === 'number' ? option.savingsEstimate : 0,
    tradeoff: String(option.tradeoff || ''),
    recommended: option.recommended === true,
  };
}

// ============================================================================
// LOCAL VERIFIER (Fallback)
// ============================================================================

/**
 * Local verification when AI is unavailable.
 */
export function verifyLocally(synthesis: SynthesizerOutput): VerifierOutput {
  const moduleVerifications = synthesis.modules.map(verifyModuleLocally);
  return aggregateVerifications(moduleVerifications, synthesis);
}

/**
 * Verify a single module locally.
 */
export function verifyModuleLocally(
  module: SynthesizedModule | ProposalModule
): ModuleVerification {
  const coherenceIssues: string[] = [];
  const feasibilityIssues: string[] = [];

  // Check coherence
  if (!module.objective || module.objective.length < 10) {
    coherenceIssues.push('Objective is too vague');
  }

  if (!module.outcome || module.outcome.length < 5) {
    coherenceIssues.push('Outcome is not clearly defined');
  }

  if (module.verificationCriteria.length === 0) {
    coherenceIssues.push('No verification criteria defined');
  }

  // Check feasibility based on risk level
  if (module.riskLevel === 'high') {
    feasibilityIssues.push('High risk level requires careful planning');
  }

  // Cost estimation
  const costBreakdown = estimateCostLocally(module);

  // Generate cost drivers
  const costDrivers = generateCostDrivers(module);

  // Generate reduction options
  const reductionOptions = generateReductionOptions(module);

  return {
    moduleId: 'id' in module ? module.id : crypto.randomUUID(),
    moduleName: module.name,
    isCoherent: coherenceIssues.length === 0,
    isFeasible: feasibilityIssues.length <= 1,
    coherenceIssues,
    feasibilityIssues,
    costBreakdown,
    costDrivers,
    reductionOptions,
  };
}

/**
 * Estimate cost conservatively.
 */
function estimateCostLocally(module: SynthesizedModule | ProposalModule): CostBreakdown {
  // Base costs by risk level
  const riskMultipliers: Record<string, number> = {
    low: 1.0,
    medium: 1.3,
    high: 1.8,
  };

  const multiplier = riskMultipliers[module.riskLevel] || 1.3;

  // Base estimates (conservative)
  const reasoning = 0.30 * multiplier;  // Multi-model debate
  const generation = 0.60 * multiplier; // Content generation
  const verification = 0.20 * multiplier; // Quality checks

  const base = reasoning + generation + verification;

  // Buffers (always include)
  const revisionBuffer = base * 0.4;     // 40% for revisions
  const uncertaintyBuffer = base * 0.2;  // 20% for unknowns

  const expected = base + revisionBuffer + uncertaintyBuffer;

  return {
    reasoning,
    generation,
    verification,
    revisionBuffer,
    uncertaintyBuffer,
    total: {
      minimum: base * 0.9,         // Best case (rare)
      expected,                     // Most likely
      maximum: expected * 1.6,      // Worst case (not uncommon)
      currency: 'USD',
      confidence: module.riskLevel === 'low' ? 0.7 : module.riskLevel === 'medium' ? 0.5 : 0.3,
    },
  };
}

/**
 * Generate cost drivers based on module characteristics.
 */
function generateCostDrivers(module: SynthesizedModule | ProposalModule): CostDriver[] {
  const drivers: CostDriver[] = [];

  // Risk level driver
  if (module.riskLevel === 'high') {
    drivers.push({
      factor: 'High risk level',
      impact: 'high',
      estimatedCost: 0.50,
      mitigation: 'Break into smaller, lower-risk modules',
    });
  }

  // Verification criteria count
  if (module.verificationCriteria.length > 3) {
    drivers.push({
      factor: 'Multiple verification criteria',
      impact: 'medium',
      estimatedCost: 0.20,
      mitigation: 'Prioritize most critical criteria',
    });
  }

  // Vague outcome
  if (module.outcome.length < 20) {
    drivers.push({
      factor: 'Outcome definition is brief',
      impact: 'medium',
      estimatedCost: 0.30,
      mitigation: 'Define outcome more specifically before starting',
    });
  }

  // Foundational module
  if ('isFoundational' in module && module.isFoundational) {
    drivers.push({
      factor: 'Foundational module - changes cascade',
      impact: 'high',
      estimatedCost: 0.40,
      mitigation: 'Ensure strong consensus before proceeding',
    });
  }

  return drivers;
}

/**
 * Generate scope reduction options.
 */
function generateReductionOptions(module: SynthesizedModule | ProposalModule): ScopeReduction[] {
  const options: ScopeReduction[] = [];

  // Always offer reduced verification
  if (module.verificationCriteria.length > 2) {
    options.push({
      id: crypto.randomUUID(),
      description: 'Reduce verification criteria to essentials only',
      savingsEstimate: 0.15,
      tradeoff: 'Less confidence in output quality',
      recommended: false,
    });
  }

  // Offer simpler outcome
  options.push({
    id: crypto.randomUUID(),
    description: 'Accept simpler outcome (80% of original scope)',
    savingsEstimate: 0.25,
    tradeoff: 'May need follow-up work later',
    recommended: module.riskLevel === 'high',
  });

  // Offer defer if not foundational
  if (!('isFoundational' in module && module.isFoundational)) {
    options.push({
      id: crypto.randomUUID(),
      description: 'Defer this module to a later phase',
      savingsEstimate: module.riskLevel === 'high' ? 0.80 : 0.60,
      tradeoff: 'Delayed value delivery',
      recommended: false,
    });
  }

  return options;
}

/**
 * Aggregate module verifications into overall output.
 */
function aggregateVerifications(
  moduleVerifications: ModuleVerification[],
  synthesis: SynthesizerOutput
): VerifierOutput {
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  // Check overall coherence
  const incoherentModules = moduleVerifications.filter((v) => !v.isCoherent);
  const overallCoherence = incoherentModules.length === 0;

  if (!overallCoherence) {
    for (const v of incoherentModules) {
      criticalIssues.push(`Module "${v.moduleName}" has coherence issues: ${v.coherenceIssues.join(', ')}`);
    }
  }

  // Check overall feasibility
  const infeasibleModules = moduleVerifications.filter((v) => !v.isFeasible);
  const overallFeasibility = infeasibleModules.length <= 1; // Allow one questionable module

  if (!overallFeasibility) {
    for (const v of infeasibleModules) {
      criticalIssues.push(`Module "${v.moduleName}" has feasibility concerns: ${v.feasibilityIssues.join(', ')}`);
    }
  }

  // Calculate total cost
  const totalCost = calculateTotalCost(moduleVerifications);

  // Check for known unknowns
  if (synthesis.knownUnknowns.length > 3) {
    recommendations.push('Consider resolving some known unknowns before committing');
  }

  // Check confidence
  if (synthesis.confidenceScore < 0.5) {
    recommendations.push('Low confidence score suggests more exploration needed');
  }

  // Check for high-cost modules
  const highCostModules = moduleVerifications.filter(
    (v) => v.costBreakdown.total.expected > 3.0
  );
  if (highCostModules.length > 0) {
    recommendations.push(
      `${highCostModules.length} module(s) have significant cost. Review reduction options.`
    );
  }

  return {
    moduleVerifications,
    overallCoherence,
    overallFeasibility,
    totalCost,
    criticalIssues,
    recommendations,
  };
}

function calculateTotalCost(verifications: ModuleVerification[]): CostRange {
  let minimum = 0;
  let expected = 0;
  let maximum = 0;
  let confidenceSum = 0;

  for (const v of verifications) {
    minimum += v.costBreakdown.total.minimum;
    expected += v.costBreakdown.total.expected;
    maximum += v.costBreakdown.total.maximum;
    confidenceSum += v.costBreakdown.total.confidence;
  }

  return {
    minimum,
    expected,
    maximum,
    currency: 'USD',
    confidence: verifications.length > 0 ? confidenceSum / verifications.length : 0,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { VERIFIER_SYSTEM_PROMPT, buildVerifierUserPrompt };
