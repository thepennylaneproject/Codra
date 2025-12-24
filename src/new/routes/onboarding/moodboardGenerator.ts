import { OnboardingProfile, MoodboardImage, EditorialPreferences } from '../../../domain/types';

// Curated sets (mocked with Unsplash for now, representing Cloudinary assets)
const ASSETS = {
    tone: {
        neutral: 'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?auto=format&fit=crop&q=80&w=600', // Clean desk / white
        authoritative: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600', // Skyscrapers / structure
        conversational: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600', // People talking
        provocative: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=600', // Red / bold abstract
    },
    structure: {
        minimal: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=600', // White minimalist
        dense: 'https://images.unsplash.com/photo-1621360841013-c768371e93cf?auto=format&fit=crop&q=80&w=600', // Newspaper text
        bold: 'https://images.unsplash.com/photo-1496661415325-ef852f9c0983?auto=format&fit=crop&q=80&w=600', // Large typography
        soft: 'https://images.unsplash.com/photo-1549775957-3004bb97864f?auto=format&fit=crop&q=80&w=600', // Pastel gradient
        architectural: 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&q=80&w=600', // Architecture
    },
    reference: {
        brief: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
        article: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600',
        report: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
        deck: 'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?auto=format&fit=crop&q=80&w=600',
        'visual-essay': 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=600',
    },
    tension: {
        default: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&q=80&w=600', // Stormy / contrast
    }
};

export const generateMoodboard = (data: OnboardingProfile): MoodboardImage[] => {
    const prefs = data.editorialPreferences || {
        tone: 'neutral',
        pacing: 'steady',
        visualPosture: 'minimal',
        intendedOutput: 'article',
        audienceRelationship: 'peer'
    } as EditorialPreferences;

    // 1. Tone & Voice
    // Start with a valid URL or fallback
    const toneUrl = ASSETS.tone[prefs.tone as keyof typeof ASSETS.tone] || ASSETS.tone.neutral;

    // 2. Visual Density / Structure
    const structureUrl = ASSETS.structure[prefs.visualPosture as keyof typeof ASSETS.structure] || ASSETS.structure.minimal;

    // 3. Reference World
    const refUrl = ASSETS.reference[prefs.intendedOutput as keyof typeof ASSETS.reference] || ASSETS.reference.article;

    // 4. Tension / Wildcard
    // In a real app this might use 'pacing' or 'audienceRelationship' to create tension
    const tensionUrl = ASSETS.tension.default;

    return [
        {
            id: 'mb-1',
            role: 'tone',
            imageUrl: toneUrl,
            source: 'Codra Curated',
            locked: false,
            caption: `Tone: ${prefs.tone}`
        },
        {
            id: 'mb-2',
            role: 'structure',
            imageUrl: structureUrl,
            source: 'Codra Curated',
            locked: false,
            caption: `Structure: ${prefs.visualPosture || 'Default'}`
        },
        {
            id: 'mb-3',
            role: 'reference',
            imageUrl: refUrl,
            source: 'Codra Curated',
            locked: false,
            caption: `Ref: ${prefs.intendedOutput || 'Article'}`
        },
        {
            id: 'mb-4',
            role: 'tension',
            imageUrl: tensionUrl,
            source: 'Codra Curated',
            locked: false,
            caption: 'Wildcard: Tension'
        }
    ];
};
