
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Mock function for now, simpler than importing the store + types which might confuse Netlify bundler without proper setup
export const handler: Handler = async (event, context) => {
    if (!supabase) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Missing Supabase configuration' }),
        };
    }

    const { projectId } = event.queryStringParameters || {};

    if (!projectId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing projectId' }),
        };
    }

    try {
        // Basic aggregation similar to client-side store
        // Ideally this would use a more powerful model to analyze the text notes specifically

        // 1. Fetch text feedback
        const { data: artifacts } = await supabase
            .from('artifacts')
            .select('id')
            .eq('project_id', projectId);

        if (!artifacts?.length) {
            return {
                statusCode: 200,
                body: JSON.stringify({ insights: [] }),
            };
        }

        const artifactIds = artifacts.map(a => a.id);

        const { data: feedback } = await supabase
            .from('artifact_versions')
            .select('user_feedback_note, user_feedback_tags')
            .in('artifact_id', artifactIds)
            .not('user_feedback_note', 'is', null);

        // 2. Mock AI analysis (in real app, send `feedback` to LLM here)
        const insights = [
            "Analysis of feedback notes suggests a preference for more concise code explanations.",
            "Several feedback items mention 'accessibility', suggesting a need for stricter a11y checks.",
        ];

        return {
            statusCode: 200,
            body: JSON.stringify({
                projectId,
                insights,
                analyzedCount: feedback?.length || 0
            }),
        };

    } catch (error) {
        console.error('Error analyzing feedback:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to analyze feedback' }),
        };
    }
};
