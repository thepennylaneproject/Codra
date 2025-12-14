/**
 * PROJECT API ADAPTER
 * Supabase CRUD operations for Architect entities
 */

import { supabase } from '../../supabase';
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
import {
    mapProjectRowToSpec,
    mapWorkstreamRowToWorkstream,
    mapTaskRowToTask,
    mapPromptRowToPrompt,
    mapArtifactRowToArtifact,
    mapVersionRowToVersion,
    mapNameRowToName,
    mapSuccessCriteriaRowToSuccessCriteria,
    type ProjectRow,
    type WorkstreamRow,
    type TaskRow,
    type TaskPromptRow,
    type ArtifactRow,
    type ArtifactVersionRow,
    type NameRegistryRow,
    type SuccessCriteriaRow,
} from './types';

// ============================================================================
// PROJECTS
// ============================================================================

export async function createProject(request: CreateProjectRequest, userId: string): Promise<ProjectSpec> {
    const { data, error } = await supabase
        .from('projects')
        .insert({
            user_id: userId,
            title: request.title,
            summary: request.summary,
            domain: request.domain,
            primary_goal: request.primaryGoal,
            secondary_goals: request.secondaryGoals || [],
            target_users: request.targetUsers || [],
            tech_stack: request.techStack || {},
            constraints: request.constraints || {},
            brand: request.brand || {},
            status: 'draft',
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create project: ${error.message}`);
    return mapProjectRowToSpec(data as ProjectRow);
}

export async function getProject(projectId: string): Promise<ProjectSpec | null> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return mapProjectRowToSpec(data as ProjectRow);
}

export async function getUserProjects(userId: string): Promise<ProjectSpec[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
    return (data as ProjectRow[]).map(mapProjectRowToSpec);
}

export async function updateProject(projectId: string, updates: Partial<ProjectSpec>): Promise<ProjectSpec> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.title) dbUpdates.title = updates.title;
    if (updates.summary) dbUpdates.summary = updates.summary;
    if (updates.domain) dbUpdates.domain = updates.domain;
    if (updates.primaryGoal) dbUpdates.primary_goal = updates.primaryGoal;
    if (updates.secondaryGoals) dbUpdates.secondary_goals = updates.secondaryGoals;
    if (updates.targetUsers) dbUpdates.target_users = updates.targetUsers;
    if (updates.techStack) dbUpdates.tech_stack = updates.techStack;
    if (updates.constraints) dbUpdates.constraints = updates.constraints;
    if (updates.brand) dbUpdates.brand = updates.brand;
    if (updates.status) dbUpdates.status = updates.status;

    const { data, error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId)
        .select()
        .single();

    if (error) throw new Error(`Failed to update project: ${error.message}`);
    return mapProjectRowToSpec(data as ProjectRow);
}

export async function deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

// ============================================================================
// WORKSTREAMS
// ============================================================================

export async function createWorkstream(workstream: Omit<ProjectWorkstream, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectWorkstream> {
    const { data, error } = await supabase
        .from('workstreams')
        .insert({
            project_id: workstream.projectId,
            title: workstream.title,
            description: workstream.description,
            sort_order: workstream.order,
            status: workstream.status,
            task_count: workstream.taskCount || 0,
            completed_task_count: workstream.completedTaskCount || 0,
            context_hints: workstream.contextHints || [],
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create workstream: ${error.message}`);
    return mapWorkstreamRowToWorkstream(data as WorkstreamRow);
}

export async function getProjectWorkstreams(projectId: string): Promise<ProjectWorkstream[]> {
    const { data, error } = await supabase
        .from('workstreams')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch workstreams: ${error.message}`);
    return (data as WorkstreamRow[]).map(mapWorkstreamRowToWorkstream);
}

export async function updateWorkstream(id: string, updates: Partial<ProjectWorkstream>): Promise<ProjectWorkstream> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.order !== undefined) dbUpdates.sort_order = updates.order;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.taskCount !== undefined) dbUpdates.task_count = updates.taskCount;
    if (updates.completedTaskCount !== undefined) dbUpdates.completed_task_count = updates.completedTaskCount;
    if (updates.contextHints) dbUpdates.context_hints = updates.contextHints;

    const { data, error } = await supabase
        .from('workstreams')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update workstream: ${error.message}`);
    return mapWorkstreamRowToWorkstream(data as WorkstreamRow);
}

export async function deleteWorkstream(id: string): Promise<void> {
    const { error } = await supabase
        .from('workstreams')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete workstream: ${error.message}`);
}

// ============================================================================
// TASKS
// ============================================================================

export async function createTask(task: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectTask> {
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            project_id: task.projectId,
            workstream_id: task.workstreamId,
            title: task.title,
            description: task.description,
            type: task.type,
            status: task.status,
            priority: task.priority,
            sort_order: task.order,
            depends_on: task.dependsOn || [],
            blocked_by: task.blockedBy || [],
            ai_context: task.aiContext || {},
            artifact_ids: task.artifactIds || [],
            assigned_to: task.assignedTo || null,
            due_date: task.dueDate || null,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return mapTaskRowToTask(data as TaskRow);
}

export async function getWorkstreamTasks(workstreamId: string): Promise<ProjectTask[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workstream_id', workstreamId)
        .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
    return (data as TaskRow[]).map(mapTaskRowToTask);
}

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
    return (data as TaskRow[]).map(mapTaskRowToTask);
}

export async function updateTask(id: string, updates: Partial<ProjectTask>): Promise<ProjectTask> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.order !== undefined) dbUpdates.sort_order = updates.order;
    if (updates.dependsOn !== undefined) dbUpdates.depends_on = updates.dependsOn;
    if (updates.blockedBy !== undefined) dbUpdates.blocked_by = updates.blockedBy;
    if (updates.aiContext !== undefined) dbUpdates.ai_context = updates.aiContext;
    if (updates.artifactIds !== undefined) dbUpdates.artifact_ids = updates.artifactIds;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

    const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update task: ${error.message}`);
    return mapTaskRowToTask(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete task: ${error.message}`);
}

// ============================================================================
// TASK PROMPTS
// ============================================================================

export async function createTaskPrompt(prompt: Omit<TaskPrompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskPrompt> {
    const { data, error } = await supabase
        .from('task_prompts')
        .insert({
            task_id: prompt.taskId,
            project_id: prompt.projectId,
            system_prompt: prompt.systemPrompt,
            user_prompt: prompt.userPrompt,
            suggested_model: prompt.suggestedModel,
            temperature: prompt.temperature || null,
            max_tokens: prompt.maxTokens || null,
            variables: prompt.variables,
            generation_count: prompt.generationCount || 0,
            last_generated_at: prompt.lastGeneratedAt || null,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create prompt: ${error.message}`);
    return mapPromptRowToPrompt(data as TaskPromptRow);
}

export async function getTaskPrompts(taskId: string): Promise<TaskPrompt[]> {
    const { data, error } = await supabase
        .from('task_prompts')
        .select('*')
        .eq('task_id', taskId);

    if (error) throw new Error(`Failed to fetch prompts: ${error.message}`);
    return (data as TaskPromptRow[]).map(mapPromptRowToPrompt);
}

export async function updateTaskPrompt(id: string, updates: Partial<TaskPrompt>): Promise<TaskPrompt> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.systemPrompt) dbUpdates.system_prompt = updates.systemPrompt;
    if (updates.userPrompt) dbUpdates.user_prompt = updates.userPrompt;
    if (updates.suggestedModel) dbUpdates.suggested_model = updates.suggestedModel;
    if (updates.temperature !== undefined) dbUpdates.temperature = updates.temperature;
    if (updates.maxTokens !== undefined) dbUpdates.max_tokens = updates.maxTokens;
    if (updates.variables) dbUpdates.variables = updates.variables;
    if (updates.generationCount !== undefined) dbUpdates.generation_count = updates.generationCount;
    if (updates.lastGeneratedAt !== undefined) dbUpdates.last_generated_at = updates.lastGeneratedAt;

    const { data, error } = await supabase
        .from('task_prompts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update prompt: ${error.message}`);
    return mapPromptRowToPrompt(data as TaskPromptRow);
}

export async function deleteTaskPrompt(id: string): Promise<void> {
    const { error } = await supabase
        .from('task_prompts')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete prompt: ${error.message}`);
}

// ============================================================================
// ARTIFACTS
// ============================================================================

export async function createArtifact(artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Artifact> {
    const { data, error } = await supabase
        .from('artifacts')
        .insert({
            project_id: artifact.projectId,
            task_id: artifact.taskId,
            name: artifact.name,
            type: artifact.type,
            description: artifact.description || null,
            status: artifact.status,
            current_version_id: artifact.currentVersionId,
            version_count: artifact.versionCount || 0,
            content_type: artifact.contentType,
            approved_at: artifact.approvedAt || null,
            approved_by: artifact.approvedBy || null,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create artifact: ${error.message}`);
    return mapArtifactRowToArtifact(data as ArtifactRow);
}

export async function getTaskArtifacts(taskId: string): Promise<Artifact[]> {
    const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('task_id', taskId);

    if (error) throw new Error(`Failed to fetch artifacts: ${error.message}`);
    return (data as ArtifactRow[]).map(mapArtifactRowToArtifact);
}

export async function updateArtifact(id: string, updates: Partial<Artifact>): Promise<Artifact> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.currentVersionId) dbUpdates.current_version_id = updates.currentVersionId;
    if (updates.versionCount !== undefined) dbUpdates.version_count = updates.versionCount;
    if (updates.contentType) dbUpdates.content_type = updates.contentType;
    if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
    if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;

    const { data, error } = await supabase
        .from('artifacts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update artifact: ${error.message}`);
    return mapArtifactRowToArtifact(data as ArtifactRow);
}

export async function deleteArtifact(id: string): Promise<void> {
    const { error } = await supabase
        .from('artifacts')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete artifact: ${error.message}`);
}

// ============================================================================
// ARTIFACT VERSIONS
// ============================================================================

export async function createArtifactVersion(version: Omit<ArtifactVersion, 'id' | 'createdAt'>): Promise<ArtifactVersion> {
    const { data, error } = await supabase
        .from('artifact_versions')
        .insert({
            artifact_id: version.artifactId,
            version_number: version.versionNumber,
            content: version.content,
            content_hash: version.contentHash,
            created_by: version.createdBy,
            prompt_used: version.promptUsed || null,
            model_used: version.modelUsed || null,
            user_feedback_tags: version.userFeedbackTags || [],
            user_feedback_note: version.userFeedbackNote || null,
            diff_from_previous: version.diffFromPrevious || null,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create artifact version: ${error.message}`);
    return mapVersionRowToVersion(data as ArtifactVersionRow);
}

export async function getArtifactVersions(artifactId: string): Promise<ArtifactVersion[]> {
    const { data, error } = await supabase
        .from('artifact_versions')
        .select('*')
        .eq('artifact_id', artifactId)
        .order('version_number', { ascending: false });

    if (error) throw new Error(`Failed to fetch artifact versions: ${error.message}`);
    return (data as ArtifactVersionRow[]).map(mapVersionRowToVersion);
}

// ============================================================================
// NAME REGISTRY
// ============================================================================

export async function registerName(name: Omit<NameRecord, 'id' | 'createdAt'>): Promise<NameRecord> {
    const { data, error } = await supabase
        .from('name_registry')
        .insert({
            project_id: name.projectId,
            name: name.name,
            kind: name.kind,
            scope: name.scope,
            description: name.description || null,
            artifact_id: name.artifactId || null,
            task_id: name.taskId || null,
            created_by: name.createdBy,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to register name: ${error.message}`);
    return mapNameRowToName(data as NameRegistryRow);
}

export async function getProjectNames(projectId: string): Promise<NameRecord[]> {
    const { data, error } = await supabase
        .from('name_registry')
        .select('*')
        .eq('project_id', projectId);

    if (error) throw new Error(`Failed to fetch names: ${error.message}`);
    return (data as NameRegistryRow[]).map(mapNameRowToName);
}

// ============================================================================
// SUCCESS CRITERIA
// ============================================================================

export async function createSuccessCriterion(criterion: Omit<SuccessCriteria, 'id'>): Promise<SuccessCriteria> {
    const { data, error } = await supabase
        .from('success_criteria')
        .insert({
            project_id: criterion.projectId,
            criterion: criterion.criterion,
            is_met: criterion.isMet,
            evidence: criterion.evidence || null,
            checked_at: criterion.checkedAt || null,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create success criterion: ${error.message}`);
    return mapSuccessCriteriaRowToSuccessCriteria(data as SuccessCriteriaRow);
}

export async function getProjectSuccessCriteria(projectId: string): Promise<SuccessCriteria[]> {
    const { data, error } = await supabase
        .from('success_criteria')
        .select('*')
        .eq('project_id', projectId);

    if (error) throw new Error(`Failed to fetch success criteria: ${error.message}`);
    return (data as SuccessCriteriaRow[]).map(mapSuccessCriteriaRowToSuccessCriteria);
}

export async function updateSuccessCriterion(id: string, updates: Partial<SuccessCriteria>): Promise<SuccessCriteria> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.criterion) dbUpdates.criterion = updates.criterion;
    if (updates.isMet !== undefined) dbUpdates.is_met = updates.isMet;
    if (updates.evidence !== undefined) dbUpdates.evidence = updates.evidence;
    if (updates.checkedAt !== undefined) dbUpdates.checked_at = updates.checkedAt;

    const { data, error } = await supabase
        .from('success_criteria')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update success criterion: ${error.message}`);
    return mapSuccessCriteriaRowToSuccessCriteria(data as SuccessCriteriaRow);
}
