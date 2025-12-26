/**
 * AUTHENTICITY DETECTOR
 * src/lib/copy/authenticity-detector.ts
 * 
 * Detects generic AI-generated phrases and suggests more authentic alternatives.
 * Solves the "homogenization" problem where AI content sounds the same.
 */

export interface AuthenticityIssue {
    id: string;
    type: 'cliche' | 'filler' | 'buzzword' | 'structure' | 'hedge' | 'excessive-adjective';
    original: string;
    startIndex: number;
    endIndex: number;
    severity: 'low' | 'medium' | 'high';
    reason: string;
    suggestions: string[];
}

export interface AuthenticityResult {
    score: number; // 0-100, higher = more authentic
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    issues: AuthenticityIssue[];
    summary: string;
}

// AI clichés with severity and suggestions
const AI_CLICHES: Array<{
    pattern: RegExp;
    type: AuthenticityIssue['type'];
    severity: AuthenticityIssue['severity'];
    reason: string;
    suggestions: string[];
}> = [
    // Overused openers
    {
        pattern: /in today['']?s (fast-paced|digital|modern|ever-changing|rapidly evolving) world/gi,
        type: 'cliche',
        severity: 'high',
        reason: 'Overused AI opener that signals generic content',
        suggestions: ['[Start with your specific point]', 'Right now,', 'Currently,'],
    },
    {
        pattern: /in (this|the) (ever-evolving|rapidly changing|dynamic) landscape/gi,
        type: 'cliche',
        severity: 'high',
        reason: 'Generic landscape phrase',
        suggestions: ['In [specific industry/context],', '[Start with concrete observation]'],
    },
    {
        pattern: /without further ado/gi,
        type: 'filler',
        severity: 'medium',
        reason: 'Unnecessary filler phrase',
        suggestions: ['[Just start the content]', 'Here\'s', 'Let\'s look at'],
    },
    {
        pattern: /let['']?s dive (in|into|deep)/gi,
        type: 'cliche',
        severity: 'medium',
        reason: 'Overused transition',
        suggestions: ['[Just start]', 'Here\'s how', 'First,'],
    },
    
    // Buzzwords
    {
        pattern: /\bgame[ -]?changer\b/gi,
        type: 'buzzword',
        severity: 'high',
        reason: 'Overused buzzword with no specific meaning',
        suggestions: ['significant improvement', 'major shift', '[specific benefit]'],
    },
    {
        pattern: /\bcutting[ -]?edge\b/gi,
        type: 'buzzword',
        severity: 'medium',
        reason: 'Vague buzzword',
        suggestions: ['latest', 'new', 'recent', '[specific technology]'],
    },
    {
        pattern: /\bbest[ -]?in[ -]?class\b/gi,
        type: 'buzzword',
        severity: 'medium',
        reason: 'Unsubstantiated superlative',
        suggestions: ['leading', 'top-rated', '[specific ranking/metric]'],
    },
    {
        pattern: /\bleverage\b/gi,
        type: 'buzzword',
        severity: 'low',
        reason: 'Corporate jargon',
        suggestions: ['use', 'apply', 'take advantage of'],
    },
    {
        pattern: /\bsynergy\b/gi,
        type: 'buzzword',
        severity: 'medium',
        reason: 'Meaningless corporate term',
        suggestions: ['collaboration', 'partnership', 'combined effort'],
    },
    {
        pattern: /\bholistic approach\b/gi,
        type: 'buzzword',
        severity: 'medium',
        reason: 'Vague descriptor',
        suggestions: ['complete', 'comprehensive', 'full-scope'],
    },
    {
        pattern: /\bparadigm shift\b/gi,
        type: 'buzzword',
        severity: 'high',
        reason: 'Overused and pretentious',
        suggestions: ['major change', 'new approach', 'fundamental change'],
    },
    {
        pattern: /\bdelve (into|deeper)\b/gi,
        type: 'buzzword',
        severity: 'high',
        reason: 'Classic AI tell',
        suggestions: ['explore', 'examine', 'look at', 'discuss'],
    },
    {
        pattern: /\btapestry\b/gi,
        type: 'buzzword',
        severity: 'high',
        reason: 'Overused metaphor in AI writing',
        suggestions: ['mix', 'combination', 'variety', '[specific term]'],
    },
    {
        pattern: /\belevate (your|the)\b/gi,
        type: 'buzzword',
        severity: 'medium',
        reason: 'Generic enhancement language',
        suggestions: ['improve', 'enhance', 'boost', '[specific improvement]'],
    },
    {
        pattern: /\bunlock the (power|potential|secrets?)\b/gi,
        type: 'cliche',
        severity: 'high',
        reason: 'Overused AI phrase',
        suggestions: ['access', 'discover', 'learn', 'use'],
    },
    {
        pattern: /\bseamlessly?\b/gi,
        type: 'buzzword',
        severity: 'low',
        reason: 'Often inaccurate or vague',
        suggestions: ['smoothly', 'easily', 'without friction', '[specific mechanism]'],
    },
    {
        pattern: /\brobust\b/gi,
        type: 'buzzword',
        severity: 'low',
        reason: 'Overused technical buzzword',
        suggestions: ['strong', 'reliable', 'sturdy', '[specific quality]'],
    },
    
    // Hedging language
    {
        pattern: /\bit['']?s (important|worth|crucial|essential) to (note|mention|remember)\b/gi,
        type: 'hedge',
        severity: 'medium',
        reason: 'Hedging filler - just state the point',
        suggestions: ['[State the point directly]'],
    },
    
    // Excessive adjectives
    {
        pattern: /\b(truly|really|very|extremely|incredibly|absolutely|definitely) (unique|amazing|incredible|revolutionary)\b/gi,
        type: 'excessive-adjective',
        severity: 'medium',
        reason: 'Redundant intensifier + superlative',
        suggestions: ['[Use specific evidence instead]', '[Remove intensifier]'],
    },
    
    // Structure patterns
    {
        pattern: /are you tired of \[?[^\]?]+\]?\??/gi,
        type: 'structure',
        severity: 'high',
        reason: 'Clichéd sales copy opener',
        suggestions: ['[Start with solution or benefit]'],
    },
    {
        pattern: /imagine a world where/gi,
        type: 'structure',
        severity: 'medium',
        reason: 'Overused visionary opener',
        suggestions: ['[Start with concrete scenario]', 'Picture this:'],
    },
    {
        pattern: /but wait,? there['']?s more/gi,
        type: 'structure',
        severity: 'high',
        reason: 'Infomercial cliché',
        suggestions: ['Additionally,', 'Also,', 'Plus,'],
    },
    {
        pattern: /what if I told you/gi,
        type: 'structure',
        severity: 'high',
        reason: 'Overused rhetorical device',
        suggestions: ['[Just tell them]', 'Here\'s the thing:'],
    },
];

/**
 * Analyze text for authenticity issues
 */
export function analyzeAuthenticity(text: string): AuthenticityResult {
    const issues: AuthenticityIssue[] = [];
    
    for (const cliche of AI_CLICHES) {
        let match;
        const regex = new RegExp(cliche.pattern.source, cliche.pattern.flags);
        
        while ((match = regex.exec(text)) !== null) {
            issues.push({
                id: crypto.randomUUID(),
                type: cliche.type,
                original: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                severity: cliche.severity,
                reason: cliche.reason,
                suggestions: cliche.suggestions,
            });
        }
    }
    
    // Sort by position in text
    issues.sort((a, b) => a.startIndex - b.startIndex);
    
    // Calculate score
    const score = calculateScore(text, issues);
    const grade = scoreToGrade(score);
    const summary = generateSummary(score, issues);
    
    return { score, grade, issues, summary };
}

/**
 * Calculate authenticity score
 */
function calculateScore(text: string, issues: AuthenticityIssue[]): number {
    if (text.length < 50) return 100; // Too short to judge
    
    // Base score
    let score = 100;
    
    // Deduct points based on issues
    for (const issue of issues) {
        switch (issue.severity) {
            case 'high': score -= 15; break;
            case 'medium': score -= 8; break;
            case 'low': score -= 3; break;
        }
    }
    
    // Bonus for longer text with few issues (scaled)
    const wordCount = text.split(/\s+/).length;
    const issueRatio = issues.length / (wordCount / 100);
    if (issueRatio < 0.5 && wordCount > 200) {
        score += 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Convert score to letter grade
 */
function scoreToGrade(score: number): AuthenticityResult['grade'] {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

/**
 * Generate human-readable summary
 */
function generateSummary(score: number, issues: AuthenticityIssue[]): string {
    if (issues.length === 0) {
        return 'No AI patterns detected. Content appears authentic.';
    }
    
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    
    const parts: string[] = [];
    
    if (highCount > 0) {
        parts.push(`${highCount} major AI pattern${highCount > 1 ? 's' : ''}`);
    }
    if (mediumCount > 0) {
        parts.push(`${mediumCount} moderate issue${mediumCount > 1 ? 's' : ''}`);
    }
    
    const verdict = score >= 80 
        ? 'Overall authentic with minor AI patterns.' 
        : score >= 60 
            ? 'Some AI patterns detected. Consider revising flagged sections.'
            : 'Heavy AI patterns detected. Significant revision recommended.';
    
    return `Found ${parts.join(' and ')}. ${verdict}`;
}

/**
 * Get highlighted text with issues marked
 */
export function highlightIssues(text: string, issues: AuthenticityIssue[]): string {
    if (issues.length === 0) return text;
    
    let result = '';
    let lastIndex = 0;
    
    for (const issue of issues) {
        result += text.slice(lastIndex, issue.startIndex);
        result += `【${issue.original}】`; // Mark issue with brackets
        lastIndex = issue.endIndex;
    }
    
    result += text.slice(lastIndex);
    return result;
}

/**
 * Auto-fix issues with first suggestion
 */
export function autoFixIssues(text: string, issues: AuthenticityIssue[]): string {
    if (issues.length === 0) return text;
    
    let result = text;
    
    // Process in reverse order to maintain indices
    const sortedIssues = [...issues].sort((a, b) => b.startIndex - a.startIndex);
    
    for (const issue of sortedIssues) {
        const suggestion = issue.suggestions[0];
        if (suggestion && !suggestion.startsWith('[')) {
            result = result.slice(0, issue.startIndex) + suggestion + result.slice(issue.endIndex);
        }
    }
    
    return result;
}

/**
 * Get color class for severity
 */
export function getSeverityColor(severity: AuthenticityIssue['severity']): string {
    switch (severity) {
        case 'high': return 'text-red-600 bg-red-50 border-red-200';
        case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
}
