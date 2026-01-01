/**
 * TASK OVERRIDES
 * Manage per-task setting overrides with optional persistence
 */

import { supabase } from '../supabase';
import type {
    TaskOverrideSettings,
    TaskPattern,
    DeskId,
} from '../../domain/smart-defaults-types';

// In-memory cache for active task overrides (cleared on page refresh)
const activeOverrides = new Map<string, TaskOverrideSettings>();

/**
 * Apply overrides for a single task execution
 */
export function applyTaskOverrides(taskId: string, overrides: TaskOverrideSettings): void {
    activeOverrides.set(taskId, overrides);
}

/**
 * Get overrides for a task (if any)
 */
export function getTaskOverridesById(taskId: string): TaskOverrideSettings | null {
    return activeOverrides.get(taskId) || null;
}

/**
 * Clear task overrides after execution
 */
export function clearTaskOverrides(taskId: string): void {
    activeOverrides.delete(taskId);
}

/**
 * Save task pattern for "Remember for similar tasks"
 */
export async function saveTaskPattern(
    userId: string,
    pattern: TaskPattern
): Promise<void> {
    try {
        const { error } = await supabase
            .from('task_patterns')
            .upsert({
                user_id: userId,
                desk_id: pattern.deskId,
                task_type: pattern.taskType,
                overrides: pattern.overrides,
            }, {
                onConflict: 'user_id,desk_id,task_type',
            });

        if (error) {
            console.error('Failed to save task pattern:', error);
        }
    } catch (err) {
        console.error('Error saving task pattern:', err);
    }
}

/**
 * Get saved task pattern for a task (desk + type combination)
 */
export async function getTaskPattern(
    userId: string,
    deskId: DeskId,
    taskType: string
): Promise<TaskOverrideSettings | null> {
    try {
        const { data, error } = await supabase
            .from('task_patterns')
            .select('overrides')
            .eq('user_id', userId)
            .eq('desk_id', deskId)
            .eq('task_type', taskType)
            .single();

        if (error || !data) {
            return null;
        }

        return data.overrides as TaskOverrideSettings;
    } catch (err) {
        console.error('Error fetching task pattern:', err);
        return null;
    }
}

/**
 * Delete a saved task pattern
 */
export async function deleteTaskPattern(
    userId: string,
    deskId: DeskId,
    taskType: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('task_patterns')
            .delete()
            .eq('user_id', userId)
            .eq('desk_id', deskId)
            .eq('task_type', taskType);

        if (error) {
            console.error('Failed to delete task pattern:', error);
        }
    } catch (err) {
        console.error('Error deleting task pattern:', err);
    }
}

/**
 * Get all saved task patterns for a user
 */
export async function getAllTaskPatterns(userId: string): Promise<TaskPattern[]> {
    try {
        const { data, error } = await supabase
            .from('task_patterns')
            .select('*')
            .eq('user_id', userId);

        if (error || !data) {
            return [];
        }

        return data.map(row => ({
            deskId: row.desk_id as DeskId,
            taskType: row.task_type,
            overrides: row.overrides as TaskOverrideSettings,
        }));
    } catch (err) {
        console.error('Error fetching task patterns:', err);
        return [];
    }
}
