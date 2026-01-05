/**
 * API TYPES FOR PROJECTS
 * Type definitions for API requests/responses
 */

import type {
    ProjectSpec,
    ProjectWorkstream,
    ProjectTask,
    TaskPrompt,
    Artifact,
    ArtifactVersion,
    NameRecord,
    SuccessCriteria,
} from '../../../types/architect';

// ============================================================================
// Database Row Types (snake_case from Supabase)
// ============================================================================

export interface ProjectRow {
    id: string;
    user_id: string;
    title: string;
    summary: string;
    domain: string;
    primary_goal: string;
    secondary_goals: string[];
    target_users: string[];
    tech_stack: Record<string, unknown>;
    constraints: Record<string, unknown>;
    brand: Record<string, unknown>;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface WorkstreamRow {
    id: string;
    project_id: string;
    title: string;
    description: string;
    sort_order: number;
    status: string;
    task_count: number;
    completed_task_count: number;
    context_hints: string[];
    created_at: string;
    updated_at: string;
}

export interface TaskRow {
    id: string;
    project_id: string;
    workstream_id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    priority: string;
    sort_order: number;
    depends_on: string[];
    blocked_by: string[];
    ai_context: Record<string, unknown>;
    artifact_ids: string[];
    assigned_to: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export interface TaskPromptRow {
    id: string;
    task_id: string;
    project_id: string;
    system_prompt: string;
    user_prompt: string;
    suggested_model: string;
    temperature: number | null;
    max_tokens: number | null;
    variables: Record<string, unknown>;
    generation_count: number;
    last_generated_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ArtifactRow {
    id: string;
    project_id: string;
    task_id: string;
    name: string;
    type: string;
    description: string | null;
    status: string;
    current_version_id: string;
    version_count: number;
    content_type: string;
    created_at: string;
    updated_at: string;
    approved_at: string | null;
    approved_by: string | null;
}

export interface ArtifactVersionRow {
    id: string;
    artifact_id: string;
    version_number: number;
    content: string;
    content_hash: string;
    created_by: string;
    prompt_used: string | null;
    model_used: string | null;
    user_feedback_tags: string[];
    user_feedback_note: string | null;
    diff_from_previous: string | null;
    approval_status: string;
    approved_at: string | null;
    approved_by: string | null;
    rejection_note: string | null;
    created_at: string;
}

export interface NameRegistryRow {
    id: string;
    project_id: string;
    name: string;
    kind: string;
    scope: string;
    description: string | null;
    artifact_id: string | null;
    task_id: string | null;
    created_at: string;
    created_by: string;
}

export interface SuccessCriteriaRow {
    id: string;
    project_id: string;
    criterion: string;
    is_met: boolean;
    evidence: string | null;
    checked_at: string | null;
}

// ============================================================================
// Mapper Functions
// ============================================================================

export function mapProjectRowToSpec(row: ProjectRow): ProjectSpec {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        summary: row.summary,
        domain: row.domain as ProjectSpec['domain'],
        primaryGoal: row.primary_goal,
        secondaryGoals: row.secondary_goals,
        targetUsers: row.target_users,
        techStack: row.tech_stack as unknown as ProjectSpec['techStack'],
        constraints: row.constraints as unknown as ProjectSpec['constraints'],
        brand: row.brand as unknown as ProjectSpec['brand'],
        status: row.status as ProjectSpec['status'],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapWorkstreamRowToWorkstream(row: WorkstreamRow): ProjectWorkstream {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        description: row.description,
        order: row.sort_order,
        status: row.status as ProjectWorkstream['status'],
        taskCount: row.task_count,
        completedTaskCount: row.completed_task_count,
        contextHints: row.context_hints,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapTaskRowToTask(row: TaskRow): ProjectTask {
    return {
        id: row.id,
        projectId: row.project_id,
        workstreamId: row.workstream_id,
        title: row.title,
        description: row.description,
        type: row.type as ProjectTask['type'],
        status: row.status as ProjectTask['status'],
        priority: row.priority as ProjectTask['priority'],
        order: row.sort_order,
        dependsOn: row.depends_on || undefined,
        blockedBy: row.blocked_by || undefined,
        aiContext: row.ai_context as ProjectTask['aiContext'],
        artifactIds: row.artifact_ids,
        assignedTo: row.assigned_to || undefined,
        dueDate: row.due_date || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at || undefined,
    };
}

export function mapPromptRowToPrompt(row: TaskPromptRow): TaskPrompt {
    return {
        id: row.id,
        taskId: row.task_id,
        projectId: row.project_id,
        systemPrompt: row.system_prompt,
        userPrompt: row.user_prompt,
        suggestedModel: row.suggested_model,
        temperature: row.temperature || undefined,
        maxTokens: row.max_tokens || undefined,
        variables: row.variables as unknown as TaskPrompt['variables'],
        generationCount: row.generation_count,
        lastGeneratedAt: row.last_generated_at || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapArtifactRowToArtifact(row: ArtifactRow): Artifact {
    return {
        id: row.id,
        projectId: row.project_id,
        taskId: row.task_id,
        name: row.name,
        type: row.type as Artifact['type'],
        description: row.description || undefined,
        status: row.status as Artifact['status'],
        currentVersionId: row.current_version_id,
        versionCount: row.version_count,
        contentType: row.content_type as Artifact['contentType'],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        approvedAt: row.approved_at || undefined,
        approvedBy: row.approved_by || undefined,
    };
}

export function mapVersionRowToVersion(row: ArtifactVersionRow): ArtifactVersion {
    return {
        id: row.id,
        artifactId: row.artifact_id,
        versionNumber: row.version_number,
        content: row.content,
        contentHash: row.content_hash,
        createdBy: row.created_by as ArtifactVersion['createdBy'],
        promptUsed: row.prompt_used || undefined,
        modelUsed: row.model_used || undefined,
        userFeedbackTags: row.user_feedback_tags,
        userFeedbackNote: row.user_feedback_note || undefined,
        diffFromPrevious: row.diff_from_previous || undefined,
        approvalStatus: (row.approval_status as ArtifactVersion['approvalStatus']) || 'pending',
        approvedAt: row.approved_at || undefined,
        approvedBy: row.approved_by || undefined,
        rejectionNote: row.rejection_note || undefined,
        createdAt: row.created_at,
    };
}

export function mapNameRowToName(row: NameRegistryRow): NameRecord {
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        kind: row.kind as NameRecord['kind'],
        scope: row.scope as NameRecord['scope'],
        description: row.description || undefined,
        artifactId: row.artifact_id || undefined,
        taskId: row.task_id || undefined,
        createdAt: row.created_at,
        createdBy: row.created_by as NameRecord['createdBy'],
    };
}

export function mapSuccessCriteriaRowToSuccessCriteria(row: SuccessCriteriaRow): SuccessCriteria {
    return {
        id: row.id,
        projectId: row.project_id,
        criterion: row.criterion,
        isMet: row.is_met,
        evidence: row.evidence || undefined,
        checkedAt: row.checked_at || undefined,
    };
}
