/**
 * PROJECT STORE
 * Zustand store for managing ProjectContext state
 * Handles local state + Supabase persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
    ProjectSpec,
    ProjectWorkstream,
    ProjectTask,
    TaskPrompt,
    Artifact,
    ArtifactVersion,
    NameRecord,
    SuccessCriteria,
    ProjectContext,
    TaskStatus,
    ArtifactStatus,
} from '../../types/architect';

interface ProjectState {
    // Current project context
    currentProjectId: string | null;
    projects: Record<string, ProjectSpec>;
    workstreams: Record<string, ProjectWorkstream>;
    tasks: Record<string, ProjectTask>;
    prompts: Record<string, TaskPrompt>;
    artifacts: Record<string, Artifact>;
    versions: Record<string, ArtifactVersion>;
    names: Record<string, NameRecord>;
    successCriteria: Record<string, SuccessCriteria>;

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions - Projects
    setCurrentProject: (projectId: string | null) => void;
    addProject: (project: ProjectSpec) => void;
    updateProject: (projectId: string, updates: Partial<ProjectSpec>) => void;
    deleteProject: (projectId: string) => void;

    // Actions - Workstreams
    addWorkstream: (workstream: ProjectWorkstream) => void;
    updateWorkstream: (id: string, updates: Partial<ProjectWorkstream>) => void;
    deleteWorkstream: (id: string) => void;
    reorderWorkstreams: (projectId: string, orderedIds: string[]) => void;

    // Actions - Tasks
    addTask: (task: ProjectTask) => void;
    updateTask: (id: string, updates: Partial<ProjectTask>) => void;
    updateTaskStatus: (id: string, status: TaskStatus) => void;
    deleteTask: (id: string) => void;
    moveTask: (taskId: string, toWorkstreamId: string) => void;

    // Actions - Prompts
    addPrompt: (prompt: TaskPrompt) => void;
    updatePrompt: (id: string, updates: Partial<TaskPrompt>) => void;
    deletePrompt: (id: string) => void;

    // Actions - Artifacts
    addArtifact: (artifact: Artifact) => void;
    updateArtifact: (id: string, updates: Partial<Artifact>) => void;
    updateArtifactStatus: (id: string, status: ArtifactStatus) => void;
    addArtifactVersion: (version: ArtifactVersion) => void;
    setCurrentVersion: (artifactId: string, versionId: string) => void;

    // Actions - Names
    registerName: (name: NameRecord) => void;
    checkNameCollision: (name: string, projectId: string) => boolean;

    // Actions - Bulk operations
    loadProjectContext: (context: Partial<ProjectContext>) => void;
    clearCurrentProject: () => void;

    // Selectors (computed)
    getCurrentProject: () => ProjectSpec | null;
    getProjectWorkstreams: (projectId: string) => ProjectWorkstream[];
    getWorkstreamTasks: (workstreamId: string) => ProjectTask[];
    getTaskPrompts: (taskId: string) => TaskPrompt[];
    getTaskArtifacts: (taskId: string) => Artifact[];
    getArtifactVersions: (artifactId: string) => ArtifactVersion[];
    getNextBestTask: (projectId: string) => ProjectTask | null;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        immer((set, get) => ({
            // Initial state
            currentProjectId: null,
            projects: {},
            workstreams: {},
            tasks: {},
            prompts: {},
            artifacts: {},
            versions: {},
            names: {},
            successCriteria: {},
            isLoading: false,
            error: null,

            // Project actions
            setCurrentProject: (projectId) => {
                set((state) => {
                    state.currentProjectId = projectId;
                });
            },

            addProject: (project) => {
                set((state) => {
                    state.projects[project.id] = project;
                });
            },

            updateProject: (projectId, updates) => {
                set((state) => {
                    if (state.projects[projectId]) {
                        state.projects[projectId] = {
                            ...state.projects[projectId],
                            ...updates,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                });
            },

            deleteProject: (projectId) => {
                set((state) => {
                    delete state.projects[projectId];
                    // Clean up related data
                    Object.keys(state.workstreams).forEach((id) => {
                        if (state.workstreams[id].projectId === projectId) {
                            delete state.workstreams[id];
                        }
                    });
                    Object.keys(state.tasks).forEach((id) => {
                        if (state.tasks[id].projectId === projectId) {
                            delete state.tasks[id];
                        }
                    });
                    Object.keys(state.prompts).forEach((id) => {
                        if (state.prompts[id].projectId === projectId) {
                            delete state.prompts[id];
                        }
                    });
                    Object.keys(state.artifacts).forEach((id) => {
                        if (state.artifacts[id].projectId === projectId) {
                            delete state.artifacts[id];
                        }
                    });
                    Object.keys(state.names).forEach((id) => {
                        if (state.names[id].projectId === projectId) {
                            delete state.names[id];
                        }
                    });
                    Object.keys(state.successCriteria).forEach((id) => {
                        if (state.successCriteria[id].projectId === projectId) {
                            delete state.successCriteria[id];
                        }
                    });
                    if (state.currentProjectId === projectId) {
                        state.currentProjectId = null;
                    }
                });
            },

            // Workstream actions
            addWorkstream: (workstream) => {
                set((state) => {
                    state.workstreams[workstream.id] = workstream;
                });
            },

            updateWorkstream: (id, updates) => {
                set((state) => {
                    if (state.workstreams[id]) {
                        state.workstreams[id] = {
                            ...state.workstreams[id],
                            ...updates,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                });
            },

            deleteWorkstream: (id) => {
                set((state) => {
                    const workstream = state.workstreams[id];
                    if (workstream) {
                        // Move tasks to backlog or delete
                        Object.keys(state.tasks).forEach((taskId) => {
                            if (state.tasks[taskId].workstreamId === id) {
                                delete state.tasks[taskId];
                            }
                        });
                        delete state.workstreams[id];
                    }
                });
            },

            reorderWorkstreams: (projectId, orderedIds) => {
                set((state) => {
                    orderedIds.forEach((id, index) => {
                        if (state.workstreams[id]?.projectId === projectId) {
                            state.workstreams[id].order = index;
                        }
                    });
                });
            },

            // Task actions
            addTask: (task) => {
                set((state) => {
                    state.tasks[task.id] = task;
                    // Update workstream task count
                    const ws = state.workstreams[task.workstreamId];
                    if (ws) {
                        ws.taskCount = (ws.taskCount || 0) + 1;
                    }
                });
            },

            updateTask: (id, updates) => {
                set((state) => {
                    if (state.tasks[id]) {
                        state.tasks[id] = {
                            ...state.tasks[id],
                            ...updates,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                });
            },

            updateTaskStatus: (id, status) => {
                set((state) => {
                    const task = state.tasks[id];
                    if (task) {
                        const wasCompleted = task.status === 'completed';
                        const isNowCompleted = status === 'completed';

                        task.status = status;
                        task.updatedAt = new Date().toISOString();

                        if (isNowCompleted && !wasCompleted) {
                            task.completedAt = new Date().toISOString();
                        } else if (!isNowCompleted && wasCompleted) {
                            task.completedAt = undefined;
                        }

                        // Update workstream completed count
                        const ws = state.workstreams[task.workstreamId];
                        if (ws) {
                            if (isNowCompleted && !wasCompleted) {
                                ws.completedTaskCount = (ws.completedTaskCount || 0) + 1;
                            } else if (!isNowCompleted && wasCompleted) {
                                ws.completedTaskCount = Math.max(0, (ws.completedTaskCount || 0) - 1);
                            }
                        }
                    }
                });
            },

            deleteTask: (id) => {
                set((state) => {
                    const task = state.tasks[id];
                    if (task) {
                        // Update workstream counts
                        const ws = state.workstreams[task.workstreamId];
                        if (ws) {
                            ws.taskCount = Math.max(0, (ws.taskCount || 0) - 1);
                            if (task.status === 'completed') {
                                ws.completedTaskCount = Math.max(0, (ws.completedTaskCount || 0) - 1);
                            }
                        }
                        // Clean up related prompts and artifacts
                        Object.keys(state.prompts).forEach((promptId) => {
                            if (state.prompts[promptId].taskId === id) {
                                delete state.prompts[promptId];
                            }
                        });
                        delete state.tasks[id];
                    }
                });
            },

            moveTask: (taskId, toWorkstreamId) => {
                set((state) => {
                    const task = state.tasks[taskId];
                    if (task && task.workstreamId !== toWorkstreamId) {
                        const fromWs = state.workstreams[task.workstreamId];
                        const toWs = state.workstreams[toWorkstreamId];

                        if (fromWs) {
                            fromWs.taskCount = Math.max(0, (fromWs.taskCount || 0) - 1);
                            if (task.status === 'completed') {
                                fromWs.completedTaskCount = Math.max(0, (fromWs.completedTaskCount || 0) - 1);
                            }
                        }

                        if (toWs) {
                            toWs.taskCount = (toWs.taskCount || 0) + 1;
                            if (task.status === 'completed') {
                                toWs.completedTaskCount = (toWs.completedTaskCount || 0) + 1;
                            }
                        }

                        task.workstreamId = toWorkstreamId;
                        task.updatedAt = new Date().toISOString();
                    }
                });
            },

            // Prompt actions
            addPrompt: (prompt) => {
                set((state) => {
                    state.prompts[prompt.id] = prompt;
                });
            },

            updatePrompt: (id, updates) => {
                set((state) => {
                    if (state.prompts[id]) {
                        state.prompts[id] = {
                            ...state.prompts[id],
                            ...updates,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                });
            },

            deletePrompt: (id) => {
                set((state) => {
                    delete state.prompts[id];
                });
            },

            // Artifact actions
            addArtifact: (artifact) => {
                set((state) => {
                    state.artifacts[artifact.id] = artifact;
                    // Add to task's artifact list
                    const task = state.tasks[artifact.taskId];
                    if (task && !task.artifactIds.includes(artifact.id)) {
                        task.artifactIds.push(artifact.id);
                    }
                });
            },

            updateArtifact: (id, updates) => {
                set((state) => {
                    if (state.artifacts[id]) {
                        state.artifacts[id] = {
                            ...state.artifacts[id],
                            ...updates,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                });
            },

            updateArtifactStatus: (id, status) => {
                set((state) => {
                    const artifact = state.artifacts[id];
                    if (artifact) {
                        artifact.status = status;
                        artifact.updatedAt = new Date().toISOString();
                        if (status === 'approved') {
                            artifact.approvedAt = new Date().toISOString();
                        }
                    }
                });
            },

            addArtifactVersion: (version) => {
                set((state) => {
                    state.versions[version.id] = version;
                    const artifact = state.artifacts[version.artifactId];
                    if (artifact) {
                        artifact.versionCount = (artifact.versionCount || 0) + 1;
                        artifact.currentVersionId = version.id;
                        artifact.updatedAt = new Date().toISOString();
                    }
                });
            },

            setCurrentVersion: (artifactId, versionId) => {
                set((state) => {
                    const artifact = state.artifacts[artifactId];
                    if (artifact && state.versions[versionId]) {
                        artifact.currentVersionId = versionId;
                        artifact.updatedAt = new Date().toISOString();
                    }
                });
            },

            // Name registry actions
            registerName: (name) => {
                set((state) => {
                    state.names[name.id] = name;
                });
            },

            checkNameCollision: (name, projectId) => {
                const state = get();
                return Object.values(state.names).some(
                    (n) => n.projectId === projectId && n.name.toLowerCase() === name.toLowerCase()
                );
            },

            // Bulk operations
            loadProjectContext: (context) => {
                set((state) => {
                    if (context.project) {
                        state.projects[context.project.id] = context.project;
                        state.currentProjectId = context.project.id;
                    }
                    context.workstreams?.forEach((ws) => {
                        state.workstreams[ws.id] = ws;
                    });
                    context.tasks?.forEach((task) => {
                        state.tasks[task.id] = task;
                    });
                    context.prompts?.forEach((prompt) => {
                        state.prompts[prompt.id] = prompt;
                    });
                    context.artifacts?.forEach((artifact) => {
                        state.artifacts[artifact.id] = artifact;
                    });
                    context.versions?.forEach((version) => {
                        state.versions[version.id] = version;
                    });
                    context.names?.forEach((name) => {
                        state.names[name.id] = name;
                    });
                    context.successCriteria?.forEach((sc) => {
                        state.successCriteria[sc.id] = sc;
                    });
                });
            },

            clearCurrentProject: () => {
                set((state) => {
                    state.currentProjectId = null;
                });
            },

            // Selectors
            getCurrentProject: () => {
                const state = get();
                return state.currentProjectId ? state.projects[state.currentProjectId] : null;
            },

            getProjectWorkstreams: (projectId) => {
                const state = get();
                return Object.values(state.workstreams)
                    .filter((ws) => ws.projectId === projectId)
                    .sort((a, b) => a.order - b.order);
            },

            getWorkstreamTasks: (workstreamId) => {
                const state = get();
                return Object.values(state.tasks)
                    .filter((task) => task.workstreamId === workstreamId)
                    .sort((a, b) => a.order - b.order);
            },

            getTaskPrompts: (taskId) => {
                const state = get();
                return Object.values(state.prompts).filter((p) => p.taskId === taskId);
            },

            getTaskArtifacts: (taskId) => {
                const state = get();
                return Object.values(state.artifacts).filter((a) => a.taskId === taskId);
            },

            getArtifactVersions: (artifactId) => {
                const state = get();
                return Object.values(state.versions)
                    .filter((v) => v.artifactId === artifactId)
                    .sort((a, b) => b.versionNumber - a.versionNumber);
            },

            getNextBestTask: (projectId) => {
                const state = get();
                const tasks = Object.values(state.tasks).filter(
                    (t) =>
                        t.projectId === projectId &&
                        t.status === 'ready' &&
                        (!t.blockedBy || t.blockedBy.length === 0)
                );

                // Sort by priority, then by order
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                tasks.sort((a, b) => {
                    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                    if (pDiff !== 0) return pDiff;
                    return a.order - b.order;
                });

                return tasks[0] || null;
            },
        })),
        {
            name: 'codra-project-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                currentProjectId: state.currentProjectId,
                projects: state.projects,
                workstreams: state.workstreams,
                tasks: state.tasks,
                prompts: state.prompts,
                artifacts: state.artifacts,
                versions: state.versions,
                names: state.names,
                successCriteria: state.successCriteria,
            }),
        }
    )
);
