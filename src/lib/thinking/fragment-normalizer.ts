/**
 * Fragment Normalization Engine
 *
 * Silently classifies user input into typed fragments.
 * The user doesn't see this classification — they just talk.
 * Codra listens and understands.
 */

import type {
  ThoughtFragment,
  FragmentType,
  FragmentStrength,
  FragmentClassification,
} from './types';


// ============================================================================
// CLASSIFICATION PATTERNS
// ============================================================================

/**
 * Patterns that indicate fragment type based on language markers.
 * These are heuristics — not perfect, but fast and local.
 */
const TYPE_PATTERNS: Record<FragmentType, RegExp[]> = {
  statement: [
    /^i want/i,
    /^i need/i,
    /^it should/i,
    /^it must/i,
    /^this is/i,
    /^the (goal|purpose|point) is/i,
    /^we're (building|creating|making)/i,
  ],

  question: [
    /\?$/,
    /^how (do|can|should|would)/i,
    /^what (if|about|is|are)/i,
    /^should (i|we)/i,
    /^is (it|this|there)/i,
    /^can (i|we|this)/i,
    /^why (do|does|is|are)/i,
    /^where (do|does|is|are)/i,
    /^when (do|does|should)/i,
  ],

  constraint: [
    /^(i |we )?(don'?t|won'?t|can'?t|shouldn'?t|must not|cannot)/i,
    /^no (more|less|way|room for)/i,
    /^not (more|less|like|going to)/i,
    /^never/i,
    /^avoid/i,
    /^stay away from/i,
    /^nothing (that|like|with)/i,
    /limited (to|by)/i,
    /budget (is|of|around)/i,
    /maximum (of|is)/i,
    /^(at most|at least)/i,
  ],

  anxiety: [
    /^(i |we )?(worry|worried|anxious|nervous|scared|afraid|concerned)/i,
    /^(i |we )?fear/i,
    /^what (if|happens when)/i,
    /^(i |we )?(hope|hopefully) (not|this doesn'?t)/i,
    /^(i |we )?hate/i,
    /^(i |we )?can'?t (stand|bear|handle)/i,
    /^the (last|worst) thing/i,
    /^please (don'?t|not)/i,
    /^i'?d (hate|die|be devastated)/i,
    /scares me/i,
    /keeps me up/i,
    /nightmare/i,
  ],

  signal: [
    // These are detected through repetition, not initial markers
    // Placeholder patterns for explicit signals
    /^(importantly|crucially|key point)/i,
    /^this is (core|fundamental|essential|critical)/i,
    /^(above all|most importantly)/i,
  ],

  aesthetic: [
    /^(it |this )?(should |needs to )?(feel|look|sound|seem)/i,
    /^(i want |we want )?(it to )?(feel|look|be)/i,
    /^the (vibe|mood|tone|feeling|aesthetic) (is|should be)/i,
    /^like .+ (but|except|without)/i,
    /^minimal/i,
    /^clean/i,
    /^calm/i,
    /^professional/i,
    /^friendly/i,
    /^serious/i,
    /^playful/i,
  ],

  'anti-pattern': [
    /^(i |we )?(hate|despise|can'?t stand|loathe)/i,
    /^no .+ (vibes?|energy|feeling)/i,
    /^not like/i,
    /^the opposite of/i,
    /^anything but/i,
    /^(tired of|sick of|done with)/i,
    /^(i'?ve seen too much|too many)/i,
    /^typical .+ (stuff|garbage|crap|nonsense)/i,
    /saas vibes?/i,
    /startup (clichés?|bs|bullshit)/i,
  ],
};


/**
 * Patterns that indicate domain classification.
 */
const DOMAIN_PATTERNS: Record<FragmentClassification['domain'], RegExp[]> = {
  product: [
    /\b(users?|customers?|audience|people)\b/i,
    /\b(feature|functionality|capability)\b/i,
    /\b(launch|release|ship|deploy)\b/i,
    /\b(market|competition|competitors?)\b/i,
    /\b(pricing|monetization|revenue)\b/i,
  ],

  system: [
    /\b(architecture|infrastructure|backend|frontend)\b/i,
    /\b(database|api|server|cloud)\b/i,
    /\b(performance|scalability|security)\b/i,
    /\b(integration|deployment|ci\/cd)\b/i,
    /\b(stack|framework|library)\b/i,
  ],

  narrative: [
    /\b(story|message|voice|tone)\b/i,
    /\b(brand|identity|values?)\b/i,
    /\b(communication|messaging|copy)\b/i,
    /\b(mission|vision|purpose)\b/i,
    /\b(feel|feeling|emotion|vibe)\b/i,
  ],

  execution: [
    /\b(timeline|deadline|schedule)\b/i,
    /\b(budget|cost|spending|price)\b/i,
    /\b(phase|milestone|sprint)\b/i,
    /\b(task|todo|action item)\b/i,
    /\b(priority|priorities|urgent)\b/i,
  ],

  identity: [
    /\b(who we are|who i am|our values?)\b/i,
    /\b(believe|belief|principle)\b/i,
    /\b(stand for|represent)\b/i,
    /\b(culture|ethos)\b/i,
    /\b(my|our|personal)\s+(style|approach|philosophy)\b/i,
  ],
};


/**
 * Sentiment indicators.
 */
const SENTIMENT_PATTERNS = {
  positive: [
    /\b(love|like|want|need|enjoy|excited|happy|good|great|amazing|beautiful)\b/i,
    /\b(should|must|will|can)\b/i,
  ],
  negative: [
    /\b(hate|dislike|avoid|worry|fear|concerned|bad|terrible|awful|ugly)\b/i,
    /\b(don'?t|won'?t|can'?t|shouldn'?t|never|no)\b/i,
  ],
};


// ============================================================================
// CLASSIFICATION FUNCTIONS
// ============================================================================

/**
 * Determine the type of a fragment based on its content.
 */
export function classifyFragmentType(content: string): FragmentType {
  const normalized = content.trim().toLowerCase();

  // Check each type's patterns in priority order
  const typeChecks: FragmentType[] = [
    'anxiety',      // Highest priority — emotional safety
    'constraint',   // Next — hard limits
    'anti-pattern', // What they hate
    'aesthetic',    // How it should feel
    'question',     // Open inquiries
    'signal',       // Explicit importance markers
    'statement',    // Default catch-all
  ];

  for (const type of typeChecks) {
    const patterns = TYPE_PATTERNS[type];
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return type;
    }
  }

  // Default to statement
  return 'statement';
}


/**
 * Determine the domain of a fragment.
 */
export function classifyFragmentDomain(
  content: string
): FragmentClassification['domain'] {
  const normalized = content.toLowerCase();

  // Count matches per domain
  const domainScores: Record<FragmentClassification['domain'], number> = {
    product: 0,
    system: 0,
    narrative: 0,
    execution: 0,
    identity: 0,
  };

  for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
    domainScores[domain as FragmentClassification['domain']] = patterns.filter(
      (pattern) => pattern.test(normalized)
    ).length;
  }

  // Find highest scoring domain
  const maxScore = Math.max(...Object.values(domainScores));
  if (maxScore === 0) {
    return 'product'; // Default
  }

  return Object.entries(domainScores).find(
    ([, score]) => score === maxScore
  )![0] as FragmentClassification['domain'];
}


/**
 * Determine sentiment of a fragment.
 */
export function classifyFragmentSentiment(
  content: string
): FragmentClassification['sentiment'] {
  const normalized = content.toLowerCase();

  const positiveMatches = SENTIMENT_PATTERNS.positive.filter((p) =>
    p.test(normalized)
  ).length;
  const negativeMatches = SENTIMENT_PATTERNS.negative.filter((p) =>
    p.test(normalized)
  ).length;

  if (positiveMatches > negativeMatches) return 'positive';
  if (negativeMatches > positiveMatches) return 'negative';
  return 'neutral';
}


/**
 * Determine if a fragment is actionable (implies work to be done).
 */
export function isFragmentActionable(content: string, type: FragmentType): boolean {
  // Constraints, anxieties, and anti-patterns are not directly actionable
  if (['constraint', 'anxiety', 'anti-pattern'].includes(type)) {
    return false;
  }

  // Questions might be actionable if they imply decisions
  if (type === 'question') {
    return /\b(should|how to|what to)\b/i.test(content);
  }

  // Statements about what should exist are actionable
  return /\b(need|want|should|must|will|build|create|make|add|implement)\b/i.test(
    content
  );
}


/**
 * Full classification of a fragment.
 */
export function classifyFragment(content: string): FragmentClassification {
  const type = classifyFragmentType(content);

  return {
    type,
    strength: 'passing', // Initial strength is always passing
    domain: classifyFragmentDomain(content),
    sentiment: classifyFragmentSentiment(content),
    isActionable: isFragmentActionable(content, type),
  };
}


// ============================================================================
// SIMILARITY DETECTION
// ============================================================================

/**
 * Simple word-based similarity for finding related fragments.
 * Not semantic — just lexical overlap.
 */
export function calculateFragmentSimilarity(
  content1: string,
  content2: string
): number {
  const words1 = extractSignificantWords(content1);
  const words2 = extractSignificantWords(content2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const intersection = words1.filter((w) => words2.includes(w));
  const union = [...new Set([...words1, ...words2])];

  return intersection.length / union.length; // Jaccard similarity
}


/**
 * Extract significant words (remove stopwords).
 */
function extractSignificantWords(content: string): string[] {
  const stopwords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just',
    'don', 'now', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its',
    'this', 'that', 'these', 'those', 'and', 'but', 'or', 'as', 'if',
  ]);

  return content
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));
}


/**
 * Find fragments similar to a new one.
 */
export function findSimilarFragments(
  newContent: string,
  existingFragments: ThoughtFragment[],
  threshold: number = 0.3
): ThoughtFragment[] {
  return existingFragments.filter(
    (fragment) =>
      calculateFragmentSimilarity(newContent, fragment.content) >= threshold
  );
}


// ============================================================================
// STRENGTH ANALYSIS
// ============================================================================

/**
 * Determine if a new fragment should upgrade an existing one's strength.
 * Returns the ID of the fragment to upgrade, or null.
 */
export function findFragmentToUpgrade(
  newContent: string,
  existingFragments: ThoughtFragment[]
): { fragmentId: string; newStrength: FragmentStrength } | null {
  const similar = findSimilarFragments(newContent, existingFragments, 0.4);

  if (similar.length === 0) return null;

  // Find the most similar
  let mostSimilar: ThoughtFragment | null = null;
  let highestSimilarity = 0;

  for (const fragment of similar) {
    const similarity = calculateFragmentSimilarity(newContent, fragment.content);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      mostSimilar = fragment;
    }
  }

  if (!mostSimilar) return null;

  // Determine new strength
  const currentStrength = mostSimilar.strength;
  let newStrength: FragmentStrength = currentStrength;

  if (currentStrength === 'passing') {
    newStrength = 'recurring';
  } else if (currentStrength === 'recurring') {
    newStrength = 'core';
  }

  if (newStrength === currentStrength) return null;

  return { fragmentId: mostSimilar.id, newStrength };
}


// ============================================================================
// THEME EXTRACTION
// ============================================================================

/**
 * Extract recurring themes from a set of fragments.
 * A theme is a concept that appears across multiple fragments.
 */
export function extractThemes(
  fragments: ThoughtFragment[]
): Array<{ theme: string; fragmentIds: string[]; strength: number }> {
  // Extract all significant words with their fragment sources
  const wordToFragments: Map<string, Set<string>> = new Map();

  for (const fragment of fragments) {
    const words = extractSignificantWords(fragment.content);
    for (const word of words) {
      if (!wordToFragments.has(word)) {
        wordToFragments.set(word, new Set());
      }
      wordToFragments.get(word)!.add(fragment.id);
    }
  }

  // Find words that appear in multiple fragments
  const themes: Array<{ theme: string; fragmentIds: string[]; strength: number }> = [];

  for (const [word, fragmentIds] of wordToFragments.entries()) {
    if (fragmentIds.size >= 2) {
      themes.push({
        theme: word,
        fragmentIds: Array.from(fragmentIds),
        strength: fragmentIds.size / fragments.length,
      });
    }
  }

  // Sort by strength
  return themes.sort((a, b) => b.strength - a.strength);
}


// ============================================================================
// EXPORT MAIN NORMALIZER
// ============================================================================

export interface NormalizationResult {
  classification: FragmentClassification;
  similarFragments: ThoughtFragment[];
  upgradeTarget: { fragmentId: string; newStrength: FragmentStrength } | null;
  isRepetition: boolean; // True if this is essentially the same as an existing fragment
}


/**
 * Full normalization of a new fragment against existing ones.
 */
export function normalizeFragment(
  content: string,
  existingFragments: ThoughtFragment[]
): NormalizationResult {
  const classification = classifyFragment(content);
  const similarFragments = findSimilarFragments(content, existingFragments);
  const upgradeTarget = findFragmentToUpgrade(content, existingFragments);

  // Check if this is essentially a repetition (very high similarity)
  const isRepetition = similarFragments.some(
    (f) => calculateFragmentSimilarity(content, f.content) > 0.8
  );

  return {
    classification,
    similarFragments,
    upgradeTarget,
    isRepetition,
  };
}
