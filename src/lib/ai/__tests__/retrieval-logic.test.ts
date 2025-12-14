import { describe, it, expect } from 'vitest';
import { selectProviderAuto } from '../../../../netlify/functions/utils/retrieval-providers';

describe('Retrieval Provider Selection', () => {
    it('selects tavily for news keywords', () => {
        expect(selectProviderAuto('latest tech news')).toBe('tavily');
        expect(selectProviderAuto('breaking news today')).toBe('tavily');
        expect(selectProviderAuto('current events')).toBe('tavily');
        expect(selectProviderAuto('what happened yesterday')).toBe('tavily');
    });

    it('selects brave for general queries', () => {
        expect(selectProviderAuto('how to cook pasta')).toBe('brave');
        expect(selectProviderAuto('javascript array filter')).toBe('brave');
        expect(selectProviderAuto('history of Rome')).toBe('brave');
    });

    it('is case insensitive', () => {
        expect(selectProviderAuto('LATEST updates')).toBe('tavily');
    });
});
