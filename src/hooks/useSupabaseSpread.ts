import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/api/auth';
import { Spread } from '../domain/types';
import { TaskQueue } from '../domain/task-queue';
import { useAuth } from './useAuth';

/**
 * HOOK: useSupabaseSpread
 * Handles persistent storage of Spread and TaskQueue in Supabase.
 * syncs local state with database state.
 */
export function useSupabaseSpread(projectId: string | undefined) {
    const { user } = useAuth();
    const [spread, setSpread] = useState<Spread | null>(null);
    const [taskQueue, setTaskQueue] = useState<TaskQueue | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load data from Supabase
    useEffect(() => {
        if (!projectId || !user) {
            setLoading(false);
            return;
        }

        async function loadData() {
            setLoading(true);
            try {
                const { data: spreads, error: spreadError } = await supabase
                    .from('spreads')
                    .select('*')
                    .eq('project_id', projectId)
                    .limit(1);

                if (spreadError) throw spreadError;

                const spreadData = spreads?.[0];
                if (spreadData) {
                    setSpread({
                        id: spreadData.id,
                        projectId: spreadData.project_id,
                        sections: spreadData.sections,
                        toc: spreadData.toc,
                        lyraState: spreadData.lyra_state,
                        createdAt: spreadData.created_at,
                        updatedAt: spreadData.updated_at,
                    });
                }

                const { data: queues, error: queueError } = await supabase
                    .from('task_queues')
                    .select('*')
                    .eq('project_id', projectId)
                    .limit(1);

                if (queueError) throw queueError;

                const queueData = queues?.[0];
                if (queueData) {
                    setTaskQueue({
                        id: queueData.id,
                        projectId: queueData.project_id,
                        tasks: queueData.tasks,
                        generatedAt: queueData.generated_at,
                        tearSheetVersion: queueData.tear_sheet_version,
                        stale: queueData.stale,
                    });
                }
            } catch (err) {
                console.error('Error loading spread data:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [projectId, user]);

    // Save Spread function
    const saveSpread = useCallback(async (updatedSpread: Spread) => {
        if (!user || !projectId || saving) return;

        setSaving(true);
        setError(null);
        try {
            const dbRow = {
                project_id: projectId,
                user_id: user.id,
                sections: updatedSpread.sections,
                toc: updatedSpread.toc,
                lyra_state: updatedSpread.lyraState,
                updated_at: new Date().toISOString(),
            };

            const { error: upsertError } = await supabase
                .from('spreads')
                .upsert(dbRow, { onConflict: 'project_id' });

            if (upsertError) throw upsertError;

            setSpread(updatedSpread);
        } catch (err: any) {
            console.error('Error saving spread:', err);
            if (err && typeof err === 'object') {
                console.error('Full Supabase Error (Spread):', JSON.stringify(err, null, 2));
            }
            setError(err instanceof Error ? err.message : 'Save error');
        } finally {
            setSaving(false);
        }
    }, [user, projectId]);

    // Save Task Queue function
    const saveTaskQueue = useCallback(async (updatedQueue: TaskQueue) => {
        if (!user || !projectId || saving) return;

        setSaving(true);
        setError(null);
        try {
            const dbRow = {
                project_id: projectId,
                user_id: user.id,
                tasks: updatedQueue.tasks,
                version: 1, // Placeholder
                stale: updatedQueue.stale,
                generated_at: updatedQueue.generatedAt,
                tear_sheet_version: updatedQueue.tearSheetVersion,
                updated_at: new Date().toISOString(),
            };

            const { error: upsertError } = await supabase
                .from('task_queues')
                .upsert(dbRow, { onConflict: 'project_id' });

            if (upsertError) throw upsertError;

            setTaskQueue(updatedQueue);
        } catch (err: any) {
            console.error('Error saving task queue:', err);
            // Log full error for debugging (contains hint, details, code)
            if (err && typeof err === 'object') {
                console.error('Full Supabase Error:', JSON.stringify(err, null, 2));
            }
            setError(err instanceof Error ? err.message : 'Save error');
        } finally {
            setSaving(false);
        }
    }, [user, projectId]);

    return {
        spread,
        taskQueue,
        loading,
        saving,
        error,
        saveSpread,
        saveTaskQueue,
        setSpread, // For optimistic UI updates
        setTaskQueue,
    };
}
