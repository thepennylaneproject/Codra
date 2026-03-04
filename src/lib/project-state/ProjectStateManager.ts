import type { ProjectSpecification, ProjectContext } from '../../domain/types';
import type { TaskQueue } from '../../domain/task-queue';
import type { ConflictState } from '../../hooks/useConflictDetection';
import { loadSpecification } from '../../domain/specification/engine';
import { loadTaskQueue } from '../../domain/specification/task-queue-engine';

export type ProjectStateSource = 'remote' | 'local' | 'memory' | 'mixed' | 'empty';

export interface ProjectState {
  specification: ProjectSpecification | null;
  taskQueue: TaskQueue | null;
  contextSnapshot?: Partial<ProjectContext> | null;
  source: ProjectStateSource;
}

export interface ProjectStateConflict {
  specification?: ConflictState;
  localSpecification?: ProjectSpecification | null;
  localTaskQueue?: TaskQueue | null;
  taskQueueConflict?: boolean;
}

export interface ProjectStateLoadOptions {
  projectId: string;
  remote?: {
    specification?: ProjectSpecification | null;
    taskQueue?: TaskQueue | null;
  };
  local?: {
    specification?: ProjectSpecification | null;
    taskQueue?: TaskQueue | null;
  };
  inMemory?: {
    specification?: ProjectSpecification | null;
    taskQueue?: TaskQueue | null;
    contextSnapshot?: Partial<ProjectContext> | null;
  };
}

export interface ProjectStateLoadResult {
  state: ProjectState;
  conflict?: ProjectStateConflict;
}

const LOG_PREFIX = '[ProjectStateManager]';

function normalizeVersion(version?: number | null): number {
  return typeof version === 'number' && Number.isFinite(version) ? version : 0;
}

export function compareVersions(a?: number | null, b?: number | null): number {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
  if (left === right) return 0;
  return left > right ? 1 : -1;
}

function serializeSpecification(specification: ProjectSpecification): string {
  return JSON.stringify({
    sections: specification.sections,
    toc: specification.toc,
    assistantState: specification.assistantState,
    updatedAt: specification.updatedAt,
  });
}

function serializeTaskQueue(queue: TaskQueue): string {
  return JSON.stringify({
    tasks: queue.tasks,
    generatedAt: queue.generatedAt,
    contextVersion: queue.contextVersion ?? (queue as any).tearSheetVersion,
    stale: queue.stale,
  });
}

export function hasSpecificationConflict(local: ProjectSpecification | null, remote: ProjectSpecification | null): boolean {
  if (!local || !remote) return false;
  if (serializeSpecification(local) === serializeSpecification(remote)) return false;
  return true;
}

export function hasTaskQueueConflict(local: TaskQueue | null, remote: TaskQueue | null): boolean {
  if (!local || !remote) return false;
  if (serializeTaskQueue(local) === serializeTaskQueue(remote)) return false;
  return true;
}

function diffSections(base: ProjectSpecification, other: ProjectSpecification): string[] {
  const changed: string[] = [];
  const baseSections = base.sections || [];
  const otherSections = other.sections || [];

  const baseData: Record<string, string> = {};
  baseSections.forEach((section) => {
    baseData[section.id] = JSON.stringify(section.content);
  });

  const otherData: Record<string, string> = {};
  otherSections.forEach((section) => {
    otherData[section.id] = JSON.stringify(section.content);
  });

  otherSections.forEach((section) => {
    if (baseData[section.id] !== otherData[section.id]) {
      changed.push(section.title || section.id);
    }
  });

  baseSections.forEach((section) => {
    if (!otherData[section.id]) {
      changed.push(`${section.title || section.id} (removed)`);
    }
  });

  return Array.from(new Set(changed));
}

function buildSpecificationConflict(local: ProjectSpecification, remote: ProjectSpecification): ConflictState {
  const yourChanges = diffSections(remote, local);
  const theirChanges = diffSections(local, remote);
  const overlap = yourChanges.filter((change) => theirChanges.includes(change));

  return {
    yourChanges,
    theirChanges,
    overlap,
    canAutoMerge: overlap.length === 0,
    serverData: remote,
    serverVersion: normalizeVersion(remote.version),
  };
}

function resolveEntity<T>(inMemory: T | null | undefined, remote: T | null | undefined, local: T | null | undefined) {
  // Priority order: remote source of truth, then in-memory edits, then local cache.
  if (remote) return { value: remote, source: 'remote' as const };
  if (inMemory) return { value: inMemory, source: 'memory' as const };
  if (local) return { value: local, source: 'local' as const };
  return { value: null, source: 'empty' as const };
}

export const ProjectStateManager = {
  load(options: ProjectStateLoadOptions): ProjectStateLoadResult {
    const { projectId, remote, local, inMemory } = options;
    const localSpecification = local?.specification ?? loadSpecification(projectId);
    const localTaskQueue = local?.taskQueue ?? loadTaskQueue(projectId);
    const remoteSpecification = remote?.specification ?? null;
    const remoteTaskQueue = remote?.taskQueue ?? null;

    let resolvedSpecification = resolveEntity(inMemory?.specification, remoteSpecification, localSpecification);
    const resolvedTaskQueue = resolveEntity(inMemory?.taskQueue, remoteTaskQueue, localTaskQueue);

    const sources = new Set<ProjectStateSource>([resolvedSpecification.source, resolvedTaskQueue.source]);
    const source: ProjectStateSource =
      sources.size === 1 ? Array.from(sources)[0] : 'mixed';

    const state: ProjectState = {
      specification: resolvedSpecification.value,
      taskQueue: resolvedTaskQueue.value,
      contextSnapshot: inMemory?.contextSnapshot ?? null,
      source,
    };

    const conflict: ProjectStateConflict = {};
    const localCandidate = inMemory?.specification ?? localSpecification;
    if (remoteSpecification && localCandidate && hasSpecificationConflict(localCandidate, remoteSpecification)) {
      conflict.specification = buildSpecificationConflict(localCandidate, remoteSpecification);
      conflict.localSpecification = localCandidate;
      resolvedSpecification = {
        value: localCandidate,
        source: inMemory?.specification ? 'memory' : 'local',
      };
    }

    const localQueueCandidate = inMemory?.taskQueue ?? localTaskQueue;
    if (remoteTaskQueue && localQueueCandidate && hasTaskQueueConflict(localQueueCandidate, remoteTaskQueue)) {
      conflict.taskQueueConflict = true;
      conflict.localTaskQueue = localQueueCandidate;
    }

    console.info(`${LOG_PREFIX} Loaded state`, { projectId, source });

    return {
      state,
      conflict: conflict.specification || conflict.taskQueueConflict ? conflict : undefined,
    };
  },
};
