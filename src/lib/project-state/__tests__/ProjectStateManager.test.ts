import { describe, it, expect } from 'vitest';
import type { ProjectSpecification } from '../../../domain/types';
import { compareVersions, hasSpecificationConflict } from '../ProjectStateManager';

function buildProjectSpecification(overrides: Partial<ProjectSpecification> = {}): ProjectSpecification {
  return {
    id: 'spread-1',
    projectId: 'project-1',
    sections: [],
    toc: [],
    version: 1,
    lastModifiedBy: 'user-1',
    lastModifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ProjectStateManager version compare', () => {
  it('treats undefined versions as equal', () => {
    expect(compareVersions(undefined, undefined)).toBe(0);
  });

  it('detects newer versions correctly', () => {
    expect(compareVersions(2, 1)).toBe(1);
    expect(compareVersions(1, 2)).toBe(-1);
    expect(compareVersions(3, 3)).toBe(0);
  });
});

describe('ProjectStateManager spread conflict detection', () => {
  it('returns false when spreads are identical', () => {
    const spread = buildProjectSpecification();
    expect(hasSpecificationConflict(spread, spread)).toBe(false);
  });

  it('returns true when spread content differs', () => {
    const local = buildProjectSpecification({
      sections: [{ id: 's1', title: 'Alpha', status: 'draft', content: { text: 'A' } }] as any,
    });
    const remote = buildProjectSpecification({
      sections: [{ id: 's1', title: 'Alpha', status: 'draft', content: { text: 'B' } }] as any,
    });

    expect(hasSpecificationConflict(local, remote)).toBe(true);
  });
});
