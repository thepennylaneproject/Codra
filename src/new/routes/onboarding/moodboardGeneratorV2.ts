/**
 * MOODBOARD GENERATOR V2
 * Generates a cohesive, intentional Moodboard from extended onboarding profile
 * Produces 4-6 inspiration images with derived labels
 */

import { MoodboardImage, OnboardingProfile, EditorialPreferences } from '../../../domain/types';
import { ExtendedOnboardingProfile } from '../../../domain/onboarding-types';

// Curated image sets organized by visual direction attributes
// In production, these would be Cloudinary URLs or generated via AI
const IMAGE_SETS = {
    // Personality-based images
    personality: {
        'bold-confident': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
        'minimal-refined': 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=600',
        'warm-approachable': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=600',
        'playful-energetic': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600',
        'premium-luxurious': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600',
        'technical-precise': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
        'organic-natural': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600',
        'edgy-provocative': 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=600',
    },

    // Visual style images
    style: {
        'clean-modern': 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&q=80&w=600',
        'vintage-retro': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600',
        'maximalist': 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&q=80&w=600',
        'brutalist': 'https://images.unsplash.com/photo-1496661415325-ef852f9c0983?auto=format&fit=crop&q=80&w=600',
        'organic-flowing': 'https://images.unsplash.com/photo-1549775957-3004bb97864f?auto=format&fit=crop&q=80&w=600',
        'geometric-structured': 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&q=80&w=600',
        'photographic-realistic': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600',
        'illustrated-artistic': 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=600',
    },

    // Color direction images
    color: {
        'neutral-monochrome': 'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?auto=format&fit=crop&q=80&w=600',
        'warm-earth-tones': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
        'cool-blues-greens': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
        'vibrant-saturated': 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&q=80&w=600',
        'pastel-soft': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600',
        'dark-moody': 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&q=80&w=600',
        'brand-specific': 'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?auto=format&fit=crop&q=80&w=600',
    },

    // Layout images
    layout: {
        'asymmetric-dynamic': 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&q=80&w=600',
        'grid-structured': 'https://images.unsplash.com/photo-1621360841013-c768371e93cf?auto=format&fit=crop&q=80&w=600',
        'centered-minimal': 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=600',
        'magazine-editorial': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600',
        'immersive-full-bleed': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=600',
    },

    // Typography images
    typography: {
        'classic-serif': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600',
        'modern-sans': 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&q=80&w=600',
        'display-statement': 'https://images.unsplash.com/photo-1496661415325-ef852f9c0983?auto=format&fit=crop&q=80&w=600',
        'handwritten-organic': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600',
        'technical-mono': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
        'mixed-eclectic': 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&q=80&w=600',
    },

    // Fallback/tension images
    tension: [
        'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
    ],
};

/**
 * Generate Moodboard v1 from extended onboarding profile
 * Produces 4-6 intentional images based on user's answers
 */
export function generateMoodboardV2(
    extendedProfile: ExtendedOnboardingProfile,
    _legacyProfile?: OnboardingProfile
): MoodboardImage[] {
    const { visualDirection } = extendedProfile;
    const images: MoodboardImage[] = [];

    // Track used URLs to avoid duplicates
    const usedUrls = new Set<string>();

    const addImage = (role: MoodboardImage['role'], imageUrl: string, caption: string) => {
        if (!usedUrls.has(imageUrl)) {
            usedUrls.add(imageUrl);
            images.push({
                id: `mb-${images.length + 1}`,
                role,
                imageUrl,
                source: 'Codra Curated',
                locked: false,
                caption,
            });
        }
    };

    // 1. TONE: Primary personality (first selection)
    if (visualDirection.personality.length > 0) {
        const primaryPersonality = visualDirection.personality[0];
        const url = (IMAGE_SETS.personality as any)[primaryPersonality] || IMAGE_SETS.personality['minimal-refined'];
        const label = primaryPersonality.replace(/-/g, ' ');
        addImage('tone', url, `Personality: ${label}`);
    }

    // 2. STRUCTURE: Layout preference
    if (visualDirection.layoutPreference) {
        const url = (IMAGE_SETS.layout as any)[visualDirection.layoutPreference] || IMAGE_SETS.layout['grid-structured'];
        const label = visualDirection.layoutPreference.replace(/-/g, ' ');
        addImage('structure', url, `Layout: ${label}`);
    }

    // 3. REFERENCE: Primary visual style
    if (visualDirection.visualStyles.length > 0) {
        const primaryStyle = visualDirection.visualStyles[0];
        const url = (IMAGE_SETS.style as any)[primaryStyle] || IMAGE_SETS.style['clean-modern'];
        const label = primaryStyle.replace(/-/g, ' ');
        addImage('reference', url, `Style: ${label}`);
    }

    // 4. COLOR: Primary color direction
    if (visualDirection.colorDirections.length > 0) {
        const primaryColor = visualDirection.colorDirections[0];
        const url = (IMAGE_SETS.color as any)[primaryColor] || IMAGE_SETS.color['neutral-monochrome'];
        const label = primaryColor.replace(/-/g, ' ');
        // Use 'tone' role for additional imagery (since MoodboardImage role is limited)
        addImage('tone', url, `Color: ${label}`);
    }

    // 5. TYPOGRAPHY (if we need more images)
    if (images.length < 5 && visualDirection.typographyVibe) {
        const url = (IMAGE_SETS.typography as any)[visualDirection.typographyVibe] || IMAGE_SETS.typography['modern-sans'];
        const label = visualDirection.typographyVibe.replace(/-/g, ' ');
        addImage('reference', url, `Type: ${label}`);
    }

    // 6. TENSION: Add contrast/wildcard if we have room
    if (images.length < 6) {
        // Pick a tension image that contrasts with the primary selections
        const adventurousness = visualDirection.colorAdventurousness || 3;
        const tensionIndex = adventurousness > 3 ? 0 : adventurousness < 3 ? 2 : 1;
        const tensionUrl = IMAGE_SETS.tension[tensionIndex];

        if (!usedUrls.has(tensionUrl)) {
            addImage('tension', tensionUrl, 'Tension / Contrast');
        }
    }

    // Ensure we have at least 4 images
    while (images.length < 4) {
        const fallbackIndex = images.length % IMAGE_SETS.tension.length;
        const fallbackUrl = IMAGE_SETS.tension[fallbackIndex];
        if (!usedUrls.has(fallbackUrl)) {
            addImage('reference', fallbackUrl, 'Reference');
        } else {
            // Last resort: use any unused personality image
            const unusedPersonality = Object.entries(IMAGE_SETS.personality)
                .find(([_, url]) => !usedUrls.has(url));
            if (unusedPersonality) {
                addImage('reference', unusedPersonality[1], `Reference: ${unusedPersonality[0].replace(/-/g, ' ')}`);
            } else {
                break; // Can't find more unique images
            }
        }
    }

    return images;
}

/**
 * Legacy generator for backward compatibility
 * Used by older flows that don't have extended profile
 */
export function generateMoodboard(data: OnboardingProfile): MoodboardImage[] {
    const prefs = data.editorialPreferences || {
        tone: 'neutral',
        pacing: 'steady',
        visualPosture: 'minimal',
        intendedOutput: 'article',
        audienceRelationship: 'peer'
    } as EditorialPreferences;

    // Map legacy preferences to new structure for generation
    const mockExtendedProfile: ExtendedOnboardingProfile = {
        isManualSetup: false,
        isImportFlow: false,
        projectType: null,
        context: {
            role: null,
            creativeGoals: [],
            aiFamiliarity: null,
            aiWorkStyle: null,
            topPriority: null,
            primaryAudience: null,
            firstProjectDescription: data.description || '',
        },
        importData: {
            projectType: null,
            projectSummary: '',
            projectStage: null,
            importGoals: [],
            successCriteria: '',
            cautionLevel: 3,
            offLimitsAreas: [],
            offLimitsOther: '',
            sourceOfTruth: null,
            hasExistingStyles: null,
            painPoints: [],
            aiDisagreementBehavior: null,
            doNotBreak: '',
        },
        aiPreferences: {
            qualityPriority: null,
            latencyTolerance: 3,
            costSensitivity: 3,
            dataSensitivity: null,
            instructionStrictness: 3,
            multiModelStrategy: null,
            lowConfidenceBehavior: null,
            showModelPerStep: false,
            smartMode: true,
        },
        budgetPreferences: {
            costQualityPriority: null,
            usageIntent: null,
            budgetFraming: null,
            budgetMode: null,
            overageBehavior: null,
            nearLimitBehavior: null,
            priorityTasks: [],
            costVisibility: null,
            dailyBudgetLimit: 50,
        },
        permissions: {
            defaultAutonomy: null,
            alwaysRequireApproval: [],
            maxStepsBeforePause: 10,
            riskTolerance: 3,
            neverAcceptableMistakes: [],
            dataAccessMode: null,
            conflictResolution: null,
        },
        visualDirection: {
            personality: prefs.tone === 'authoritative' ? ['bold-confident'] :
                prefs.tone === 'conversational' ? ['warm-approachable'] :
                    prefs.tone === 'provocative' ? ['edgy-provocative'] : ['minimal-refined'],
            visualAudience: [],
            desiredFeeling: '',
            visualStyles: prefs.visualPosture === 'dense' ? ['vintage-retro'] :
                prefs.visualPosture === 'bold' ? ['maximalist'] : ['clean-modern'],
            layoutPreference: prefs.visualPosture === 'architectural' ? 'grid-structured' :
                prefs.visualPosture === 'bold' ? 'immersive-full-bleed' : 'centered-minimal',
            similarBrands: '',
            colorAdventurousness: 3,
            colorDirections: ['neutral-monochrome'],
            typographyVibe: 'modern-sans',
            imageryTypes: [],
            mustAvoid: '',
            existingAssets: null,
        },
        projectIntent: {
            storyStatement: null,
            coreMessage: '',
            useCase: null,
            detailLevel: 3,
        },
    };

    return generateMoodboardV2(mockExtendedProfile, data);
}

/**
 * Update moodboard based on a new generated artifact
 * Adds generated images to the moodboard if they align with the visual direction
 */
export function updateFromOutput(
    currentMoodboard: MoodboardImage[],
    artifact: { type: string; url?: string; description?: string; tags?: string[] }
): MoodboardImage[] {
    if (artifact.type !== 'image' || !artifact.url) {
        return currentMoodboard;
    }

    // Clone array
    const newMoodboard = [...currentMoodboard];

    // Check availability
    if (newMoodboard.length < 6) {
        newMoodboard.push({
            id: `mb-gen-${Date.now()}`,
            role: 'reference',
            imageUrl: artifact.url,
            source: 'Generated',
            locked: false,
            caption: artifact.description || 'Generated Output',
        });
    } else {
        // Find a non-locked, non-primary reference to replace
        const replaceIndex = newMoodboard.findIndex(
            img => !img.locked && img.role === 'reference' && img.source !== 'Generated'
        );

        if (replaceIndex !== -1) {
            newMoodboard[replaceIndex] = {
                id: `mb-gen-${Date.now()}`,
                role: 'reference',
                imageUrl: artifact.url,
                source: 'Generated',
                locked: false,
                caption: artifact.description || 'Generated Output',
            };
        }
    }

    return newMoodboard;
}
