/**
 * TASK CANCEL - Netlify Function
 * netlify/functions/task-cancel.ts
 *
 * Endpoint for cancelling a running task.
 * POST /.netlify/functions/task-cancel
 *
 * Request body: { projectId: string, taskId: string }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate env vars
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Response helper
const response = (statusCode: number, body: object) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders,
  },
  body: JSON.stringify(body),
});

// Extract and verify JWT from Authorization header
async function verifyAuth(event: HandlerEvent): Promise<{ userId: string } | null> {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('JWT verification failed:', error);
      return null;
    }

    return { userId: user.id };
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
}

// Main Handler
export const handler: Handler = async (event: HandlerEvent) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  // Parse request body
  if (!event.body) {
    return response(400, { error: 'Request body required' });
  }

  let body: { projectId?: string; taskId?: string };
  try {
    body = JSON.parse(event.body);
  } catch {
    return response(400, { error: 'Invalid JSON body' });
  }

  const { projectId, taskId } = body;

  if (!projectId || !taskId) {
    return response(400, { error: 'projectId and taskId are required' });
  }

  // Verify authentication (optional - can be made stricter)
  const auth = await verifyAuth(event);
  if (!auth) {
    // For now, allow unauthenticated cancel requests from the client
    // In production, you may want to require authentication
    console.warn('Unauthenticated cancel request - proceeding anyway');
  }

  try {
    // Update task status in spreads table
    // The spreads table stores task_queue as a JSONB field
    const { data: spreadData, error: fetchError } = await supabaseAdmin
      .from('spreads')
      .select('task_queue')
      .eq('project_id', projectId)
      .single();

    if (fetchError) {
      console.error('Error fetching spread:', fetchError);
      return response(404, { error: 'Project spread not found' });
    }

    if (!spreadData?.task_queue) {
      return response(404, { error: 'Task queue not found' });
    }

    // Parse and update task queue
    const taskQueue = spreadData.task_queue as {
      tasks: Array<{
        id: string;
        status: string;
        cancelledAt?: number;
      }>;
    };

    const taskIndex = taskQueue.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return response(404, { error: 'Task not found' });
    }

    // Update task status to cancelled
    const cancelledAt = Date.now();
    taskQueue.tasks[taskIndex] = {
      ...taskQueue.tasks[taskIndex],
      status: 'cancelled',
      cancelledAt,
    };

    // Save updated task queue
    const { error: updateError } = await supabaseAdmin
      .from('spreads')
      .update({ task_queue: taskQueue })
      .eq('project_id', projectId);

    if (updateError) {
      console.error('Error updating task queue:', updateError);
      return response(500, { error: 'Failed to update task status' });
    }

    // Log cancellation event
    console.log(`Task ${taskId} cancelled for project ${projectId} at ${cancelledAt}`);

    return response(200, {
      success: true,
      taskId,
      status: 'cancelled',
      cancelledAt,
    });

  } catch (error) {
    console.error('Task cancel error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
