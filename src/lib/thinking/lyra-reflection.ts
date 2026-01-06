/**
 * Lyra Reflection Generator
 *
 * You are Lyra.
 * You do not instruct. You do not reassure.
 * You reflect what is already there.
 *
 * Rules:
 * - No questions unless unavoidable
 * - No motivational language
 * - No certainty inflation
 * - ≤ 2 sentences
 */

import type { LyraObservation, ReflectiveIntervention } from './types';
import type { ObserverResult } from './lyra-observer';

// ============================================================================
// REFLECTION SCHEMA
// ============================================================================

export interface ReflectionOutput {
  statement: string;
  isValid: boolean;
  violations: string[];
}

// ============================================================================
// REFLECTION PROMPT
// ============================================================================

const REFLECTION_SYSTEM_PROMPT = `You are Lyra.
You do not instruct. You do not reassure.
You reflect what is already there.

TASK:
Turn the observation into a single reflective statement.

RULES:
- No questions unless unavoidable.
- No motivational language.
- No certainty inflation.
- ≤ 2 sentences.`;

function buildReflectionUserPrompt(observation: string): string {
  return `INPUT:
Observation:
${observation}

OUTPUT:
Reflective statement only.`;
}

// ============================================================================
// AI REFLECTION GENERATOR
// ============================================================================

export interface ReflectionProvider {
  reflect(observation: string): Promise<ReflectionOutput>;
}

/**
 * Create an AI-powered reflection generator.
 */
export function createAIReflector(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): ReflectionProvider {
  return {
    async reflect(observation: string): Promise<ReflectionOutput> {
      const userPrompt = buildReflectionUserPrompt(observation);

      try {
        const response = await complete(REFLECTION_SYSTEM_PROMPT, userPrompt);
        const statement = cleanReflection(response.trim());
        return validateReflection(statement);
      } catch (error) {
        console.warn('AI reflection failed:', error);
        return {
          statement: observation, // Fall back to raw observation
          isValid: false,
          violations: ['AI generation failed'],
        };
      }
    },
  };
}

// ============================================================================
// LOCAL REFLECTION GENERATOR
// ============================================================================

/**
 * Generate a reflection locally when AI is unavailable.
 * Uses templates based on observation type.
 */
export function reflectLocally(
  observation: ObserverResult | LyraObservation
): ReflectionOutput {
  const type = observation.type;
  const content = 'content' in observation ? observation.content : observation.statement;

  let statement: string;

  switch (type) {
    case 'recurring-theme':
      statement = generateRecurringThemeReflection(content);
      break;
    case 'contradiction':
      statement = generateContradictionReflection(content);
      break;
    case 'pattern':
      statement = generatePatternReflection(content);
      break;
    case 'missing-piece':
      statement = generateMissingPieceReflection(content);
      break;
    case 'emotional-weight':
      statement = generateEmotionalWeightReflection(content);
      break;
    case 'pivot-point':
      statement = generatePivotReflection(content);
      break;
    default:
      statement = content;
  }

  return validateReflection(statement);
}

function generateRecurringThemeReflection(content: string): string {
  const templates = [
    `"${content}" keeps surfacing. That's not incidental.`,
    `You return to "${content}" repeatedly.`,
    `There's weight behind "${content}."`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateContradictionReflection(content: string): string {
  const templates = [
    `There's tension here. ${content}`,
    `These two things pull against each other. ${content}`,
    `A contradiction worth noting. ${content}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generatePatternReflection(content: string): string {
  const templates = [
    `A pattern is forming. ${content}`,
    `${content}`,
    `Something consistent here. ${content}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateMissingPieceReflection(content: string): string {
  const templates = [
    `Notably absent: ${content}`,
    `${content} hasn't come up yet.`,
    `No mention of ${content} so far.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateEmotionalWeightReflection(content: string): string {
  const templates = [
    `There's feeling behind this. ${content}`,
    `This carries weight. ${content}`,
    `${content}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generatePivotReflection(content: string): string {
  const templates = [
    `A shift just happened. ${content}`,
    `Direction changed. ${content}`,
    `${content}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================================================
// VALIDATION & CLEANING
// ============================================================================

/**
 * Clean a reflection to remove violations.
 */
function cleanReflection(statement: string): string {
  let cleaned = statement;

  // Remove question marks (convert to periods)
  cleaned = cleaned.replace(/\?/g, '.');

  // Remove double periods
  cleaned = cleaned.replace(/\.{2,}/g, '.');

  // Remove motivational phrases
  const motivationalPatterns = [
    /\b(great|awesome|amazing|wonderful|fantastic|excellent)\b/gi,
    /\b(you can do this|you've got this|keep going|well done|good job)\b/gi,
    /\b(i believe|i'm sure|i know you|you will|you're going to)\b/gi,
    /\b(don't worry|no worries|it's okay|that's okay|it's fine)\b/gi,
    /!+/g, // Remove exclamation marks
  ];

  for (const pattern of motivationalPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove certainty inflation
  const certaintyPatterns = [
    /\b(definitely|certainly|absolutely|clearly|obviously|surely)\b/gi,
    /\b(always|never|every time|without doubt)\b/gi,
  ];

  for (const pattern of certaintyPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Ensure it ends with a period
  if (cleaned && !cleaned.endsWith('.')) {
    cleaned += '.';
  }

  return cleaned;
}

/**
 * Validate a reflection against Lyra's rules.
 */
function validateReflection(statement: string): ReflectionOutput {
  const violations: string[] = [];

  // Check for questions
  if (statement.includes('?')) {
    violations.push('Contains question');
  }

  // Check for motivational language
  if (/\b(great|awesome|amazing|you can|keep going|well done|don't worry)\b/i.test(statement)) {
    violations.push('Contains motivational language');
  }

  // Check for certainty inflation
  if (/\b(definitely|certainly|absolutely|clearly|obviously|always|never)\b/i.test(statement)) {
    violations.push('Contains certainty inflation');
  }

  // Check length (≤ 2 sentences)
  const sentenceCount = (statement.match(/[.!?]+/g) || []).length;
  if (sentenceCount > 2) {
    violations.push('Exceeds 2 sentences');
  }

  // Check for exclamation marks
  if (statement.includes('!')) {
    violations.push('Contains exclamation mark');
  }

  return {
    statement,
    isValid: violations.length === 0,
    violations,
  };
}

// ============================================================================
// INTERVENTION BUILDER
// ============================================================================

/**
 * Build a complete reflective intervention from an observation.
 */
export async function buildIntervention(
  observation: ObserverResult | LyraObservation,
  reflector: ReflectionProvider | null
): Promise<Omit<ReflectiveIntervention, 'id'>> {
  const content = 'content' in observation ? observation.content : observation.statement;

  let reflection: ReflectionOutput;

  if (reflector) {
    reflection = await reflector.reflect(content);
  } else {
    reflection = reflectLocally(observation);
  }

  // If AI reflection has violations, fall back to local
  if (!reflection.isValid && reflector) {
    reflection = reflectLocally(observation);
  }

  return {
    observation: observation as LyraObservation,
    statement: reflection.statement,
    implicitQuestion: deriveImplicitQuestion(observation),
    requiresResponse: observation.type === 'contradiction',
    deliveredAt: null,
    responseFragment: null,
  };
}

/**
 * Derive the implicit question behind an observation.
 * This is internal context, not shown to user directly.
 */
function deriveImplicitQuestion(
  observation: ObserverResult | LyraObservation
): string {
  switch (observation.type) {
    case 'recurring-theme':
      return 'Is this central to what you\'re building?';
    case 'contradiction':
      return 'Which direction holds?';
    case 'pattern':
      return 'Is this intentional?';
    case 'missing-piece':
      return 'Is this absence intentional?';
    case 'emotional-weight':
      return 'Should this shape the work?';
    case 'pivot-point':
      return 'What prompted the shift?';
    default:
      return '';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  REFLECTION_SYSTEM_PROMPT,
  buildReflectionUserPrompt,
  cleanReflection,
  validateReflection,
};
