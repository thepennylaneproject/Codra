/**
 * FEEDBACK PROMPT BUILDER
 * Incorporates user feedback into regeneration prompts
 */

import { feedbackStore, FEEDBACK_TAGS, FeedbackTagId } from './feedback-store';
import type { ProjectSpec, Artifact, ArtifactVersion } from '../../types/architect';

interface RegenerationContext {
    artifact: Artifact;
    currentVersion: ArtifactVersion;
    feedbackTags: FeedbackTagId[];
    feedbackNote: string;
    project: ProjectSpec;
}

export async function buildRegenerationPrompt(ctx: RegenerationContext): Promise<{
    systemPrompt: string;
    userPrompt: string;
}> {
    // Get historical feedback context
    const historicalFeedback = await feedbackStore.getFeedbackContext(ctx.artifact.id);

    // Build tag-specific instructions
    const tagInstructions = ctx.feedbackTags.map(tagId => {
        const tag = FEEDBACK_TAGS[tagId];
        if (!tag) return '';

        switch (tagId) {
            case 'too_complex':
                return '- SIMPLIFY: Use clearer language, shorter sentences, fewer nested structures';
            case 'too_simple':
                return '- ADD DEPTH: Include more detail, nuance, and comprehensive coverage';
            case 'wrong_tone':
                return `- FIX TONE: Match the brand voice: ${ctx.project.brand.voiceTags.join(', ')}`;
            case 'too_formal':
                return '- LESS FORMAL: Use conversational language, contractions, friendly tone';
            case 'too_casual':
                return '- MORE FORMAL: Use professional language, complete sentences, measured tone';
            case 'off_brand':
                return `- ALIGN WITH BRAND: Voice should be ${ctx.project.brand.adjectives.join(', ')}. Avoid: ${ctx.project.brand.bannedWords.join(', ') || 'nothing specific'}`;
            case 'too_long':
                return '- SHORTEN: Cut length by 30-50%. Be more concise. Remove redundancy.';
            case 'too_short':
                return '- EXPAND: Add 50-100% more content. Include examples, details, context.';
            case 'not_technical':
                return '- MORE TECHNICAL: Include technical details, specifications, implementation notes';
            case 'too_technical':
                return '- LESS TECHNICAL: Simplify jargon, explain concepts, focus on outcomes';
            case 'generic':
                return `- BE SPECIFIC: Tailor to ${ctx.project.targetUsers.join(', ')}. Reference project context.`;
            case 'not_creative':
                return '- MORE CREATIVE: Add unique angles, unexpected approaches, fresh perspective';
            case 'has_errors':
                return '- FIX ERRORS: Double-check accuracy, syntax, logic. Validate all claims.';
            case 'wrong_layout':
                return '- FIX LAYOUT: Reconsider structure, hierarchy, visual organization';
            case 'wrong_colors':
                return '- FIX COLORS: Align with brand palette, ensure contrast, check accessibility';
            default:
                return '';
        }
    }).filter(Boolean);

    const systemPrompt = `You are regenerating a ${ctx.artifact.type} artifact for the project "${ctx.project.title}".

PROJECT CONTEXT:
- Domain: ${ctx.project.domain}
- Goal: ${ctx.project.primaryGoal}
- Target Users: ${ctx.project.targetUsers.join(', ')}
- Brand Voice: ${ctx.project.brand.voiceTags.join(', ')}

${historicalFeedback}

CURRENT FEEDBACK - You MUST address these issues:
${tagInstructions.join('\n')}

${ctx.feedbackNote ? `USER NOTE: "${ctx.feedbackNote}"` : ''}

Generate an improved version that directly addresses all feedback points.
Explain briefly what you changed and why at the start of your response.`;

    const userPrompt = `Here is the current version that needs improvement:

---
${ctx.currentVersion.content}
---

Please regenerate this ${ctx.artifact.type}, addressing all the feedback above.
Start your response with a brief "Changes made:" summary, then provide the improved content.`;

    return { systemPrompt, userPrompt };
}
