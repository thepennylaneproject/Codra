import { describe, expect, it } from 'vitest';

import {
    buildAuditPrompt,
    CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT,
} from '../audit-templates';

describe('codebase intelligence extraction prompt', () => {
    it('contains the required section headers and metadata block', () => {
        expect(CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT).toContain('# View Source: Codebase Intelligence Extraction Prompt');
        expect(CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT).toContain(
            '> **Instructions:** Run this prompt through an AI agent with full access to each codebase. Replace `[PROJECT_NAME]` with the actual project name before running. Output should be returned in the exact section structure below. Do not skip sections — mark any section where information is unavailable as `[NOT FOUND IN CODEBASE — REQUIRES MANUAL INPUT]`.',
        );

        for (const section of [
            '### SECTION 1: PROJECT IDENTITY',
            '### SECTION 2: TECHNICAL ARCHITECTURE',
            '### SECTION 3: FEATURE INVENTORY',
            '### SECTION 4: DESIGN SYSTEM & BRAND',
            '### SECTION 5: DATA & SCALE SIGNALS',
            '### SECTION 6: MONETIZATION & BUSINESS LOGIC',
            '### SECTION 7: CODE QUALITY & MATURITY SIGNALS',
            '### SECTION 8: ECOSYSTEM CONNECTIONS',
            '### SECTION 9: WHAT\'S MISSING (CRITICAL)',
            '### SECTION 10: EXECUTIVE SUMMARY',
            '## OUTPUT FORMAT',
            'AUDIT METADATA',
            'Codebase access: [full repo / partial / read-only]',
        ]) {
            expect(CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT).toContain(section);
        }
    });

    it('uses the exact view source prompt for the investor-diligence audit template', () => {
        const prompt = buildAuditPrompt('investor-diligence', {
            projectDescription: 'Codra',
            targetAudience: 'Founders',
            launchTimeline: 'weeks',
            knownConstraints: ['time'],
        });

        expect(prompt.system).toContain('source-backed codebase diligence');
        expect(prompt.user.trim()).toBe(CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT);
        expect(prompt.user).not.toContain('Return ONLY valid JSON');
    });
});
