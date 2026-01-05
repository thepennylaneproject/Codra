/**
 * CONTEXT SIMILARITY SCORING
 * Algorithm to identify similar past projects for smart context import
 */

import type { StreamlinedProjectType } from '@/new/routes/onboarding/hooks/useOnboarding';

export interface ProjectInput {
    name: string;
    type: StreamlinedProjectType | null;
    description: string;
    goals?: string[];
    audience?: string;
}

export interface PastProject {
    id: string;
    name: string;
    type: StreamlinedProjectType | null;
    description?: string;
    goals?: string[];
    audience?: string;
    created_at: string;
    approval_rate?: number;
}

export interface SimilarityFactors {
    typeMatch: number;      // 0.3 weight
    audienceMatch: number;  // 0.2 weight
    goalsOverlap: number;   // 0.2 weight
    recency: number;        // 0.1 weight
    successRate: number;    // 0.1 weight
}

export interface ScoredProject extends PastProject {
    matchScore: number;
    matchReason: string;
    factors: SimilarityFactors;
}

/**
 * Calculate text similarity using Jaccard similarity coefficient
 * Returns 0-1 where 1 is perfect match
 */
export function textSimilarity(text1: string | undefined, text2: string | undefined): number {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    if (words1.size === 0 && words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
}

/**
 * Calculate overlap score between two arrays
 * Returns 0-1 where 1 is perfect overlap
 */
export function overlapScore(arr1: string[] | undefined, arr2: string[] | undefined): number {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    
    const set1 = new Set(arr1.map(s => s.toLowerCase()));
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

/**
 * Calculate recency score with exponential decay
 * Returns 0-1 where 1 is very recent
 */
export function recencyScore(createdAt: string): number {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const ageInDays = (now - created) / (1000 * 60 * 60 * 24);
    
    // Exponential decay: projects lose 50% value every 60 days
    const halfLife = 60;
    return Math.pow(0.5, ageInDays / halfLife);
}

/**
 * Generate human-readable match reason from similarity factors
 */
export function getMatchReason(factors: SimilarityFactors): string {
    const reasons: string[] = [];
    
    if (factors.typeMatch === 1) {
        reasons.push('same project type');
    }
    
    if (factors.audienceMatch > 0.5) {
        reasons.push('similar audience');
    }
    
    if (factors.goalsOverlap > 0.5) {
        reasons.push('similar goals');
    }
    
    if (factors.successRate > 0.7) {
        reasons.push('high success rate');
    }
    
    if (factors.recency > 0.7) {
        reasons.push('recent project');
    }
    
    if (reasons.length === 0) {
        return 'Similar project characteristics';
    }
    
    // Capitalize first letter
    const text = reasons.join(' and ');
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Calculate similarity score between new project and past project
 * Returns 0-1 where 1 is perfect match
 */
export function calculateSimilarity(
    newProject: ProjectInput,
    pastProject: PastProject
): number {
    const factors: SimilarityFactors = {
        typeMatch: newProject.type === pastProject.type ? 1 : 0,
        audienceMatch: textSimilarity(newProject.audience, pastProject.audience),
        goalsOverlap: overlapScore(newProject.goals, pastProject.goals),
        recency: recencyScore(pastProject.created_at),
        successRate: pastProject.approval_rate || 0,
    };
    
    // Weighted sum
    return (
        factors.typeMatch * 0.3 +
        factors.audienceMatch * 0.2 +
        factors.goalsOverlap * 0.2 +
        factors.recency * 0.1 +
        factors.successRate * 0.1 +
        // Add 20% base score for description similarity
        textSimilarity(newProject.description, pastProject.description) * 0.2
    );
}

/**
 * Score and rank past projects by similarity
 * Returns projects above threshold, sorted by score descending
 */
export function scoreSimilarProjects(
    newProject: ProjectInput,
    pastProjects: PastProject[],
    threshold: number = 0.6,
    limit: number = 5
): ScoredProject[] {
    const scored = pastProjects.map(pastProject => {
        const factors: SimilarityFactors = {
            typeMatch: newProject.type === pastProject.type ? 1 : 0,
            audienceMatch: textSimilarity(newProject.audience, pastProject.audience),
            goalsOverlap: overlapScore(newProject.goals, pastProject.goals),
            recency: recencyScore(pastProject.created_at),
            successRate: pastProject.approval_rate || 0,
        };
        
        const matchScore = calculateSimilarity(newProject, pastProject);
        const matchReason = getMatchReason(factors);
        
        return {
            ...pastProject,
            matchScore,
            matchReason,
            factors,
        };
    });
    
    return scored
        .filter(p => p.matchScore >= threshold)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
}
