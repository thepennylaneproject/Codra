/**
 * DECOMPOSE ENDPOINT
 * AI-powered project decomposition
 * Generates workstreams, tasks, and prompts from a ProjectSpec
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
    buildWorkstreamPrompt,
    buildTaskPrompt,
    buildPromptSynthesisPrompt
} from '../../../../src/lib/api/architect/prompts';
import { decryptApiKey, deriveUserEncryptionKey } from '../../../../src/lib/api/encryption';
import type { ProjectSpec } from '../../../../src/types/architect';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const appSecret = process.env.CODRA_APP_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface DecomposeRequest {
    projectId: string;
    depth: 'workstreams' | 'tasks' | 'prompts';
}

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        // 1. Verify auth
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
        }

        const { projectId, depth = 'tasks' }: DecomposeRequest = JSON.parse(event.body || '{}');

        // 2. Fetch project
        const { data: projectData, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (projectError || !projectData) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Project not found' }) };
        }

        // Cast to ProjectSpec to ensure type safety with prompt builders
        const project = projectData as unknown as ProjectSpec;

        // 3. Get user's AI credentials
        // Prioritize AIMLAPI, then others
        const { data: credentialsList } = await supabaseAdmin
            .from('api_credentials')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .in('provider', ['aimlapi', 'deepseek', 'gemini', 'openai', 'anthropic'])
            .order('updated_at', { ascending: false });

        if (!credentialsList || credentialsList.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No active AI credentials found. Please add a provider in Settings.' })
            };
        }

        // Pick the best credential (prefer aimlapi)
        const credential = credentialsList.find(c => c.provider === 'aimlapi') || credentialsList[0];

        // 4. Decrypt API key
        // Polyfill crypto if needed (Netlify Node runtime usually has it, but just in case)
        if (!globalThis.crypto) {
            // @ts-ignore
            globalThis.crypto = await import('node:crypto').then(m => m.webcrypto);
        }

        const encryptionKey = await deriveUserEncryptionKey(user.id, appSecret);
        const apiKey = await decryptApiKey(credential.encrypted_key, encryptionKey);

        // Build prompts based on depth
        const results: any = {};

        // ------------------------------------------------------------------------
        // Step 1: Generate workstreams
        // ------------------------------------------------------------------------
        const shouldGenWorkstreams = depth === 'workstreams' || depth === 'tasks' || depth === 'prompts';
        let workstreams = [];

        // Check if workstreams already exist
        const { data: existingWorkstreams } = await supabaseAdmin
            .from('workstreams')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true });

        if (shouldGenWorkstreams && (!existingWorkstreams || existingWorkstreams.length === 0)) {
            console.log('Generating workstreams...');
            const workstreamPrompt = buildWorkstreamPrompt(project);
            const workstreamsResponse = await callAI(apiKey, workstreamPrompt, credential.provider);
            const workstreamsData = parseJSONResponse(workstreamsResponse);

            // Save workstreams to database
            for (const ws of workstreamsData) {
                const { data: saved } = await supabaseAdmin
                    .from('workstreams')
                    .insert({
                        project_id: projectId,
                        title: ws.title,
                        description: ws.description,
                        sort_order: ws.order,
                        status: 'not_started',
                        context_hints: ws.contextHints || [],
                    })
                    .select()
                    .single();

                if (saved) workstreams.push(saved);
            }
            results.workstreams = workstreams;
        } else {
            workstreams = existingWorkstreams || [];
            results.workstreams = workstreams;
        }

        // ------------------------------------------------------------------------
        // Step 2: Generate tasks for each workstream
        // ------------------------------------------------------------------------
        if ((depth === 'tasks' || depth === 'prompts') && workstreams.length > 0) {
            console.log('Generating tasks...');
            const allTasks = [];

            for (const workstream of workstreams) {
                // Check if tasks already exist for this workstream
                const { count } = await supabaseAdmin
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('workstream_id', workstream.id);

                if (count && count > 0) {
                    // Skip generation if tasks exist
                    const { data: existingTasks } = await supabaseAdmin
                        .from('tasks')
                        .select('*')
                        .eq('workstream_id', workstream.id);
                    if (existingTasks) allTasks.push(...existingTasks);
                    continue;
                }

                const taskPrompt = buildTaskPrompt(project, workstream);
                const tasksResponse = await callAI(apiKey, taskPrompt, credential.provider);
                const tasksData = parseJSONResponse(tasksResponse);

                for (const task of tasksData) {
                    const { data: saved }: { data: any | null } = await supabaseAdmin
                        .from('tasks')
                        .insert({
                            project_id: projectId,
                            workstream_id: workstream.id,
                            title: task.title,
                            description: task.description,
                            type: task.type,
                            priority: task.priority,
                            status: 'backlog',
                            ai_context: task.aiContext || {},
                            artifact_ids: [],
                            sort_order: allTasks.length + 1 // Simple ordering
                        })
                        .select()
                        .single();

                    if (saved) allTasks.push(saved);
                }

                // Update workstream task count
                await supabaseAdmin
                    .from('workstreams')
                    .update({ task_count: tasksData.length })
                    .eq('id', workstream.id);
            }
            results.tasks = allTasks;
        }

        // ------------------------------------------------------------------------
        // Step 3: Generate prompts for each task
        // ------------------------------------------------------------------------
        if (depth === 'prompts' && results.tasks && results.tasks.length > 0) {
            console.log('Generating prompts...');
            const allPrompts = [];

            for (const task of results.tasks) {
                // Check if prompt exists
                const { count } = await supabaseAdmin
                    .from('task_prompts')
                    .select('*', { count: 'exact', head: true })
                    .eq('task_id', task.id);

                if (count && count > 0) continue;

                const promptSynthesisPrompt = buildPromptSynthesisPrompt(project, task);
                const promptResponse = await callAI(apiKey, promptSynthesisPrompt, credential.provider);
                const promptData = parseJSONResponse(promptResponse);

                const { data: saved } = await supabaseAdmin
                    .from('task_prompts')
                    .insert({
                        project_id: projectId,
                        task_id: task.id,
                        system_prompt: promptData.systemPrompt,
                        user_prompt: promptData.userPrompt,
                        suggested_model: promptData.suggestedModel,
                        temperature: promptData.temperature,
                        max_tokens: promptData.maxTokens,
                        variables: promptData.variables || [],
                    })
                    .select()
                    .single();

                if (saved) allPrompts.push(saved);
            }
            results.prompts = allPrompts;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                ...results,
            }),
        };

    } catch (error) {
        console.error('Decomposition error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error instanceof Error ? error.message : 'Decomposition failed'
            }),
        };
    }
};

// ============================================================================
// HELPERS
// ============================================================================

async function callAI(apiKey: string, prompt: string, provider: string): Promise<string> {
    // Basic routing based on provider
    let url = 'https://api.aimlapi.com/v1/chat/completions';
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };
    let body: any = {
        model: 'gpt-4o', // Default to a strong model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
    };

    if (provider === 'anthropic') {
        url = 'https://api.anthropic.com/v1/messages';
        headers = {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        };
        body = {
            model: 'claude-3-sonnet-20240229',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4000,
        };
    } else if (provider === 'openai') {
        url = 'https://api.openai.com/v1/chat/completions';
    } else if (provider === 'deepseek') {
        url = 'https://api.deepseek.com/chat/completions';
        body.model = 'deepseek-chat';
    } else if (provider === 'gemini') {
        // Gemini often requires different setup, but AIMLAPI might handle it if provider is set to aimlapi
        // If native gemini, url is https://generativelanguage.googleapis.com
        // For now, assuming standard OpenAI compatible format for most
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('AI API Error:', err);
        throw new Error(`AI Provider ${provider} failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (provider === 'anthropic') {
        return data.content[0].text;
    }

    return data.choices[0].message.content;
}

function parseJSONResponse(response: string): any {
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
        // If no explicit JSON block, try parsing the whole thing
        try {
            return JSON.parse(response);
        } catch {
            throw new Error('No JSON found in response');
        }
    }
    return JSON.parse(jsonMatch[0]);
}
