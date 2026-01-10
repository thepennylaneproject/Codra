import { describe, expect, it } from 'vitest';
import { estimateDebateCost } from '../cost-preflight';
import type { ShadowProject, ThoughtFragment } from '../../types';

function createShadow(id: string): ShadowProject {
  return {
    id,
    inferredType: 'app',
    coreBeliefs: ['clarity', 'speed'],
    constraints: ['no ads'],
    anxieties: ['scope creep'],
    aesthetics: ['minimal'],
    antiPatterns: ['overbuilt'],
    openQuestions: ['who is the primary user?'],
    readinessScore: 0.7,
    confidenceMap: new Map(),
    lastUpdated: new Date(0),
  };
}

function createFragments(count: number, contentLength: number): ThoughtFragment[] {
  const content = 'x'.repeat(contentLength);
  return Array.from({ length: count }, (_, index) => ({
    id: `f-${index}`,
    content: `${content}-${index}`,
    timestamp: new Date(0),
    type: 'statement',
    strength: 'passing',
    mentionCount: 1,
    relatedFragments: [],
    confidence: 0.5,
  }));
}

describe('estimateDebateCost', () => {
  it('is deterministic for identical inputs', () => {
    const shadow = createShadow('s-1');
    const fragments = createFragments(3, 40);
    const estimateA = estimateDebateCost(shadow, fragments);
    const estimateB = estimateDebateCost(shadow, fragments);

    expect(estimateA.tokensTotal).toBe(estimateB.tokensTotal);
    expect(estimateA.creditsTotal).toBe(estimateB.creditsTotal);
    expect(estimateA.estimateHash).toBe(estimateB.estimateHash);
  });

  it('scales for small, medium, and large inputs', () => {
    const shadow = createShadow('s-2');
    const small = estimateDebateCost(shadow, createFragments(2, 20));
    const medium = estimateDebateCost(shadow, createFragments(8, 60));
    const large = estimateDebateCost(shadow, createFragments(20, 120));

    expect(small.tokensTotal).toBeLessThan(medium.tokensTotal);
    expect(medium.tokensTotal).toBeLessThan(large.tokensTotal);
  });

  it('changes hash when input changes', () => {
    const shadow = createShadow('s-3');
    const fragments = createFragments(4, 40);
    const baseEstimate = estimateDebateCost(shadow, fragments);
    const newEstimate = estimateDebateCost(shadow, [...fragments, ...createFragments(1, 40)]);

    expect(baseEstimate.estimateHash).not.toBe(newEstimate.estimateHash);
  });

  it('keeps estimateHash stable for identical inputs', () => {
    const shadow = createShadow('s-4');
    const fragments = createFragments(5, 30);
    const estimateA = estimateDebateCost(shadow, fragments);
    const estimateB = estimateDebateCost(shadow, fragments);

    expect(estimateA.estimateHash).toBe(estimateB.estimateHash);
  });

  it('changes estimateHash for meaningful input changes', () => {
    const shadow = createShadow('s-5');
    const fragments = createFragments(5, 30);
    const estimateA = estimateDebateCost(shadow, fragments);
    const changedShadow = { ...shadow, readinessScore: 0.9 };
    const estimateB = estimateDebateCost(changedShadow, fragments);

    expect(estimateA.estimateHash).not.toBe(estimateB.estimateHash);
  });
});
