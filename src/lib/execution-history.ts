/**
 * EXECUTION HISTORY SERVICE
 * Manages saving and retrieving prompt executions from Supabase
 */

import { supabase } from './supabase';
import { getCurrentUser } from './supabase';

export interface ExecutionRecord {
  id?: string;
  userId: string;
  promptId: string;
  model: string;
  input: string;
  output: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  latency: number;
  status: 'success' | 'error';
  error?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Save an execution to the database
 */
export async function saveExecution(
  execution: Omit<ExecutionRecord, 'id' | 'userId' | 'createdAt'>
): Promise<ExecutionRecord | null> {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      console.warn('No user logged in, execution not saved');
      return null;
    }

    const { data, error } = await supabase
      .from('execution_history')
      .insert({
        user_id: user.id,
        prompt_id: execution.promptId,
        model: execution.model,
        input: execution.input,
        output: execution.output,
        tokens: execution.tokens,
        cost: execution.cost,
        latency: execution.latency,
        status: execution.status,
        error: execution.error,
        metadata: execution.metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data as ExecutionRecord;
  } catch (error) {
    console.error('Error saving execution:', error);
    return null;
  }
}

/**
 * Get execution history for a prompt
 */
export async function getPromptExecutions(promptId: string, limit = 10) {
  try {
    const { user } = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('execution_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ExecutionRecord[];
  } catch (error) {
    console.error('Error getting executions:', error);
    return [];
  }
}

/**
 * Get all execution history for the user
 */
export async function getAllExecutions(limit = 50) {
  try {
    const { user } = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('execution_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ExecutionRecord[];
  } catch (error) {
    console.error('Error getting all executions:', error);
    return [];
  }
}

/**
 * Get execution statistics for a user
 */
export async function getExecutionStats() {
  try {
    const { user } = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('execution_history')
      .select('cost, latency, status')
      .eq('user_id', user.id);

    if (error) throw error;

    const executions = data || [];
    const successCount = executions.filter(e => e.status === 'success').length;
    const errorCount = executions.filter(e => e.status === 'error').length;
    const totalCost = executions.reduce((sum, e) => sum + (e.cost || 0), 0);
    const avgLatency = executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.latency || 0), 0) / executions.length
      : 0;

    return {
      totalExecutions: executions.length,
      successCount,
      errorCount,
      successRate: executions.length > 0 ? (successCount / executions.length) * 100 : 0,
      totalCost,
      averageLatency: avgLatency
    };
  } catch (error) {
    console.error('Error getting execution stats:', error);
    return null;
  }
}

/**
 * Delete an execution
 */
export async function deleteExecution(id: string): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('execution_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting execution:', error);
    return false;
  }
}

/**
 * Clear all execution history for a user
 * (Use with caution!)
 */
export async function clearExecutionHistory(): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('execution_history')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing execution history:', error);
    return false;
  }
}
