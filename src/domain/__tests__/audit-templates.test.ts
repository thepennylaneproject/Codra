import { describe, expect, it } from 'vitest';

import {
    buildAuditPrompt,
    CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT,
} from '../audit-templates';

describe('codebase intelligence extraction prompt', () => {
    it('contains the required section headers and investor readiness structure', () => {
        expect(CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT).toContain('investor-readiness audit');

        for (const section of [
            '── REPO HYGIENE ──',
            '── SECURITY ──',
            '── DOCUMENTATION ──',
            '── CODE QUALITY ──',
            '── CI/CD & DEPLOYMENT ──',
            '── DEPENDENCY MANAGEMENT ──',
            '── GIT DISCIPLINE ──',
            '── PORTFOLIO COHESION ──',
            '── INVESTOR SIGNALS ──',
        ]) {
            expect(CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT).toContain(section);
        }
    });

    it('the investor-diligence audit template uses the investor-readiness prompt as its user message', () => {
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
