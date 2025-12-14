/**
 * useAdminSettings Hook
 * 
 * Manages admin settings for app, provider, and model configuration.
 * Provides CRUD operations with React Query caching and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Types
export interface AppSettings {
    id?: string;
    workspace_id: string;
    router_weight_cost: number;
    router_weight_latency: number;
    router_weight_quality: number;
    router_weight_task_match: number;
    max_cost_per_run_usd: number;
    monthly_budget_usd: number;
    default_retrieval_provider: 'auto' | 'brave' | 'tavily';
    default_retrieval_max_results: number;
    default_retrieval_timeout_ms: number;
    retrieval_keyword_rules: Array<{ keyword: string; provider: string }>;
}

export interface ProviderSettings {
    id?: string;
    workspace_id: string;
    provider_id: string;
    enabled: boolean;
    display_name_override?: string;
}

export interface ModelSettings {
    id?: string;
    workspace_id: string;
    model_id: string;
    tags?: string[];
    context_window?: number;
    price_hint_input_per_1k?: number;
    price_hint_output_per_1k?: number;
    latency_hint_ms?: number;
    default_for_task_types?: string[];
    enabled: boolean;
}

// Fetch settings
async function fetchSettings<T>(type: 'app' | 'provider' | 'model', workspaceId: string): Promise<T[]> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('No active session');
    }

    const response = await fetch(
        `/.netlify/functions/api/admin-settings?type=${type}&workspace_id=${workspaceId}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch ${type} settings`);
    }

    const result = await response.json();
    return result.data || [];
}

// Update settings
async function updateSettings<T>(
    type: 'app' | 'provider' | 'model',
    workspaceId: string,
    data: Partial<T>
): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('No active session');
    }

    const response = await fetch('/.netlify/functions/api/admin-settings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type,
            workspace_id: workspaceId,
            data,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to update ${type} settings`);
    }

    const result = await response.json();
    return result.data[0];
}

// Delete settings
async function deleteSettings(type: 'app' | 'provider' | 'model', id: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('No active session');
    }

    const response = await fetch(
        `/.netlify/functions/api/admin-settings?type=${type}&id=${id}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete ${type} settings`);
    }
}

export function useAdminSettings(workspaceId: string) {
    const queryClient = useQueryClient();

    // Fetch app settings
    const {
        data: appSettings,
        isLoading: appLoading,
        error: appError,
    } = useQuery<AppSettings[]>({
        queryKey: ['admin-settings', 'app', workspaceId],
        queryFn: () => fetchSettings<AppSettings>('app', workspaceId),
        enabled: !!workspaceId,
    });

    // Fetch provider settings
    const {
        data: providerSettings,
        isLoading: providerLoading,
        error: providerError,
    } = useQuery<ProviderSettings[]>({
        queryKey: ['admin-settings', 'provider', workspaceId],
        queryFn: () => fetchSettings<ProviderSettings>('provider', workspaceId),
        enabled: !!workspaceId,
    });

    // Fetch model settings
    const {
        data: modelSettings,
        isLoading: modelLoading,
        error: modelError,
    } = useQuery<ModelSettings[]>({
        queryKey: ['admin-settings', 'model', workspaceId],
        queryFn: () => fetchSettings<ModelSettings>('model', workspaceId),
        enabled: !!workspaceId,
    });

    // Update app settings
    const updateAppSettings = useMutation({
        mutationFn: (data: Partial<AppSettings>) =>
            updateSettings<AppSettings>('app', workspaceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings', 'app', workspaceId] });
        },
    });

    // Update provider settings
    const updateProviderSettings = useMutation({
        mutationFn: (data: Partial<ProviderSettings>) =>
            updateSettings<ProviderSettings>('provider', workspaceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings', 'provider', workspaceId] });
        },
    });

    // Update model settings
    const updateModelSettings = useMutation({
        mutationFn: (data: Partial<ModelSettings>) =>
            updateSettings<ModelSettings>('model', workspaceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings', 'model', workspaceId] });
        },
    });

    // Delete mutations
    const deleteProviderSettings = useMutation({
        mutationFn: (id: string) => deleteSettings('provider', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings', 'provider', workspaceId] });
        },
    });

    const deleteModelSettings = useMutation({
        mutationFn: (id: string) => deleteSettings('model', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings', 'model', workspaceId] });
        },
    });

    return {
        // Data
        appSettings: appSettings?.[0] || null,
        providerSettings: providerSettings || [],
        modelSettings: modelSettings || [],

        // Loading states
        isLoading: appLoading || providerLoading || modelLoading,

        // Errors
        error: appError || providerError || modelError,

        // Mutations
        updateAppSettings: updateAppSettings.mutateAsync,
        updateProviderSettings: updateProviderSettings.mutateAsync,
        updateModelSettings: updateModelSettings.mutateAsync,
        deleteProviderSettings: deleteProviderSettings.mutateAsync,
        deleteModelSettings: deleteModelSettings.mutateAsync,

        // Refetch
        refetch: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings', workspaceId] });
        },
    };
}
