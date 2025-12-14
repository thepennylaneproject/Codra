/**
 * PROJECT API HOOKS
 * React Query hooks for Architect entities
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import * as adapter from './adapter';
import type {
    ProjectSpec,
    ProjectWorkstream,
    ProjectTask,
    TaskPrompt,
    Artifact,
    ArtifactVersion,
    NameRecord,
    SuccessCriteria,
    CreateProjectRequest,
} from '../../../types/architect';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const projectKeys = {
    all: ['projects'] as const,
    lists: () => [...projectKeys.all, 'list'] as const,
    list: (userId: string) => [...projectKeys.lists(), userId] as const,
    details: () => [...projectKeys.all, 'detail'] as const,
    detail: (id: string) => [...projectKeys.details(), id] as const,
    workstreams: (projectId: string) => [...projectKeys.detail(projectId), 'workstreams'] as const,
    tasks: (projectId: string) => [...projectKeys.detail(projectId), 'tasks'] as const,
    workstreamTasks: (workstreamId: string) => ['workstreams', workstreamId, 'tasks'] as const,
    taskPrompts: (taskId: string) => ['tasks', taskId, 'prompts'] as const,
    taskArtifacts: (taskId: string) => ['tasks', taskId, 'artifacts'] as const,
    artifactVersions: (artifactId: string) => ['artifacts', artifactId, 'versions'] as const,
    names: (projectId: string) => [...projectKeys.detail(projectId), 'names'] as const,
    successCriteria: (projectId: string) => [...projectKeys.detail(projectId), 'criteria'] as const,
};

// ============================================================================
// PROJECT HOOKS
// ============================================================================

export function useProjects() {
    const { user } = useAuth();

    return useQuery({
        queryKey: projectKeys.list(user?.id || ''),
        queryFn: () => adapter.getUserProjects(user!.id),
        enabled: !!user,
    });
}

export function useProject(projectId: string | null) {
    return useQuery({
        queryKey: projectKeys.detail(projectId || ''),
        queryFn: () => adapter.getProject(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateProject() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateProjectRequest) => adapter.createProject(request, user!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectSpec> }) =>
            adapter.updateProject(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => adapter.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        },
    });
}

// ============================================================================
// WORKSTREAM HOOKS
// ============================================================================

export function useProjectWorkstreams(projectId: string | null) {
    return useQuery({
        queryKey: projectKeys.workstreams(projectId || ''),
        queryFn: () => adapter.getProjectWorkstreams(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateWorkstream() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (workstream: Omit<ProjectWorkstream, 'id' | 'createdAt' | 'updatedAt'>) =>
            adapter.createWorkstream(workstream),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreams(data.projectId) });
        },
    });
}

export function useUpdateWorkstream() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectWorkstream> }) =>
            adapter.updateWorkstream(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreams(data.projectId) });
        },
    });
}

export function useDeleteWorkstream() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string; projectId: string }) =>
            adapter.deleteWorkstream(id),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreams(variables.projectId) });
        },
    });
}

// ============================================================================
// TASK HOOKS
// ============================================================================

export function useProjectTasks(projectId: string | null) {
    return useQuery({
        queryKey: projectKeys.tasks(projectId || ''),
        queryFn: () => adapter.getProjectTasks(projectId!),
        enabled: !!projectId,
    });
}

export function useWorkstreamTasks(workstreamId: string | null) {
    return useQuery({
        queryKey: projectKeys.workstreamTasks(workstreamId || ''),
        queryFn: () => adapter.getWorkstreamTasks(workstreamId!),
        enabled: !!workstreamId,
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (task: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt'>) =>
            adapter.createTask(task),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.tasks(data.projectId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreamTasks(data.workstreamId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreams(data.projectId) });
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectTask> }) =>
            adapter.updateTask(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.tasks(data.projectId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreamTasks(data.workstreamId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreams(data.projectId) });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string; projectId: string; workstreamId: string }) =>
            adapter.deleteTask(id),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreamTasks(variables.workstreamId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.workstreams(variables.projectId) });
        },
    });
}

// ============================================================================
// PROMPT HOOKS
// ============================================================================

export function useTaskPrompts(taskId: string | null) {
    return useQuery({
        queryKey: projectKeys.taskPrompts(taskId || ''),
        queryFn: () => adapter.getTaskPrompts(taskId!),
        enabled: !!taskId,
    });
}

export function useCreateTaskPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (prompt: Omit<TaskPrompt, 'id' | 'createdAt' | 'updatedAt'>) =>
            adapter.createTaskPrompt(prompt),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.taskPrompts(data.taskId) });
        },
    });
}

export function useUpdateTaskPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskPrompt> }) =>
            adapter.updateTaskPrompt(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.taskPrompts(data.taskId) });
        },
    });
}

// ============================================================================
// ARTIFACT HOOKS
// ============================================================================

export function useTaskArtifacts(taskId: string | null) {
    return useQuery({
        queryKey: projectKeys.taskArtifacts(taskId || ''),
        queryFn: () => adapter.getTaskArtifacts(taskId!),
        enabled: !!taskId,
    });
}

export function useCreateArtifact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt'>) =>
            adapter.createArtifact(artifact),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.taskArtifacts(data.taskId) });
        },
    });
}

export function useUpdateArtifact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Artifact> }) =>
            adapter.updateArtifact(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.taskArtifacts(data.taskId) });
        },
    });
}

// ============================================================================
// ARTIFACT VERSION HOOKS
// ============================================================================

export function useArtifactVersions(artifactId: string | null) {
    return useQuery({
        queryKey: projectKeys.artifactVersions(artifactId || ''),
        queryFn: () => adapter.getArtifactVersions(artifactId!),
        enabled: !!artifactId,
    });
}

export function useCreateArtifactVersion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (version: Omit<ArtifactVersion, 'id' | 'createdAt'>) =>
            adapter.createArtifactVersion(version),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.artifactVersions(data.artifactId) });
        },
    });
}

// ============================================================================
// NAME REGISTRY HOOKS
// ============================================================================

export function useProjectNames(projectId: string | null) {
    return useQuery({
        queryKey: projectKeys.names(projectId || ''),
        queryFn: () => adapter.getProjectNames(projectId!),
        enabled: !!projectId,
    });
}

export function useRegisterName() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: Omit<NameRecord, 'id' | 'createdAt'>) =>
            adapter.registerName(name),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.names(data.projectId) });
        },
    });
}

// ============================================================================
// SUCCESS CRITERIA HOOKS
// ============================================================================

export function useProjectSuccessCriteria(projectId: string | null) {
    return useQuery({
        queryKey: projectKeys.successCriteria(projectId || ''),
        queryFn: () => adapter.getProjectSuccessCriteria(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateSuccessCriterion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (criterion: Omit<SuccessCriteria, 'id'>) =>
            adapter.createSuccessCriterion(criterion),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.successCriteria(data.projectId) });
        },
    });
}

export function useUpdateSuccessCriterion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<SuccessCriteria> }) =>
            adapter.updateSuccessCriterion(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.successCriteria(data.projectId) });
        },
    });
}
