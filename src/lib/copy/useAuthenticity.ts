/**
 * USE AUTHENTICITY
 * src/lib/copy/useAuthenticity.ts
 * 
 * React hook for real-time authenticity checking of copy.
 */

import { useState, useCallback } from 'react';
import {
    analyzeAuthenticity,
    AuthenticityResult,
    AuthenticityIssue,
    highlightIssues,
    autoFixIssues,
} from './authenticity-detector';

interface UseAuthenticityReturn {
    // Analysis
    result: AuthenticityResult | null;
    analyze: (text: string) => AuthenticityResult;
    
    // Results
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
    issues: AuthenticityIssue[];
    summary: string;
    
    // Helpers
    getHighlightedText: (text: string) => string;
    getAutoFixedText: (text: string) => string;
    
    // State
    isAnalyzing: boolean;
    hasAnalyzed: boolean;
}

export function useAuthenticity(): UseAuthenticityReturn {
    const [result, setResult] = useState<AuthenticityResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyze = useCallback((text: string): AuthenticityResult => {
        setIsAnalyzing(true);
        const analysisResult = analyzeAuthenticity(text);
        setResult(analysisResult);
        setIsAnalyzing(false);
        return analysisResult;
    }, []);

    const getHighlightedText = useCallback((text: string): string => {
        if (!result) return text;
        return highlightIssues(text, result.issues);
    }, [result]);

    const getAutoFixedText = useCallback((text: string): string => {
        if (!result) return text;
        return autoFixIssues(text, result.issues);
    }, [result]);

    return {
        result,
        analyze,
        score: result?.score ?? 0,
        grade: result?.grade ?? null,
        issues: result?.issues ?? [],
        summary: result?.summary ?? '',
        getHighlightedText,
        getAutoFixedText,
        isAnalyzing,
        hasAnalyzed: result !== null,
    };
}

/**
 * Hook for debounced real-time analysis
 */
export function useRealtimeAuthenticity(debounceMs: number = 500) {
    const { analyze, ...rest } = useAuthenticity();
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const debouncedAnalyze = useCallback((text: string) => {
        if (timeoutId) clearTimeout(timeoutId);
        
        const newTimeoutId = setTimeout(() => {
            if (text.length > 50) { // Only analyze substantial text
                analyze(text);
            }
        }, debounceMs);
        
        setTimeoutId(newTimeoutId);
    }, [analyze, debounceMs, timeoutId]);

    return {
        analyze: debouncedAnalyze,
        analyzeNow: analyze,
        ...rest,
    };
}
