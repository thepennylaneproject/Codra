import { useEffect, useMemo, useState } from 'react';
import type { ProjectContext, ProjectContextRevision } from '@/domain/types';
import { storageAdapter } from '@/lib/storage/StorageKeyAdapter';

function loadRevisions(projectId: string): ProjectContextRevision[] {
  return storageAdapter.getContextRevisions(projectId) as ProjectContextRevision[];
}

function persistRevisions(projectId: string, revisions: ProjectContextRevision[]) {
  storageAdapter.saveContextRevisions(projectId, revisions);
}

function notifyRevisionUpdate(projectId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('codra:context-revisions-updated', { detail: { projectId } }));
}

function createRevision({
  version,
  status,
  summary,
  data,
}: {
  version: number;
  status: 'draft' | 'approved';
  summary: string;
  data?: Partial<ProjectContext>;
}): ProjectContextRevision {
  return {
    id: crypto.randomUUID(),
    version,
    createdAt: new Date().toISOString(),
    summary,
    status,
    createdFrom: 'manual',
    scopeImpact: 'Low',
    data,
  };
}

export function useContextRevisions(projectId?: string) {
  const [revisions, setRevisions] = useState<ProjectContextRevision[]>([]);
  const [currentRevisionId, setCurrentRevisionId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const loaded = loadRevisions(projectId);
    setRevisions(loaded);
    if (loaded.length > 0) {
      setCurrentRevisionId(loaded[loaded.length - 1].id);
    } else {
      setCurrentRevisionId(null);
    }
    const handleUpdate = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.projectId && event.detail.projectId !== projectId) {
        return;
      }
      const refreshed = loadRevisions(projectId);
      setRevisions(refreshed);
    };
    const handleStorage = (event: StorageEvent) => {
      const canonicalKey = storageAdapter.getCanonicalKey('contextRevisions', projectId);
      const legacyKey = storageAdapter.getLegacyKey('contextRevisions', projectId);
      if (event.key === canonicalKey || event.key === legacyKey) {
        const refreshed = loadRevisions(projectId);
        setRevisions(refreshed);
      }
    };
    window.addEventListener('codra:context-revisions-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('codra:context-revisions-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [projectId]);

  const currentRevision = useMemo(
    () => revisions.find((rev) => rev.id === currentRevisionId) || null,
    [revisions, currentRevisionId]
  );

  useEffect(() => {
    if (revisions.length === 0) return;
    if (!currentRevisionId || !revisions.find((rev) => rev.id === currentRevisionId)) {
      setCurrentRevisionId(revisions[revisions.length - 1].id);
    }
  }, [revisions, currentRevisionId]);

  const saveAll = (nextRevisions: ProjectContextRevision[]) => {
    if (!projectId) return;
    // Limit to last 20 revisions, always keep approved ones
    const limitedRevisions = limitRevisions(nextRevisions, 20);
    setRevisions(limitedRevisions);
    persistRevisions(projectId, limitedRevisions);
    notifyRevisionUpdate(projectId);
  };

  const saveDraft = (data: Partial<ProjectContext>, summary: string) => {
    if (!projectId) return;
    const next = [...revisions];
    const current = next.find((rev) => rev.id === currentRevisionId);
    
    // Coalescing: Check if we should update existing draft or create new one
    if (current && current.status === 'draft') {
      const timeSinceLastEdit = new Date().getTime() - new Date(current.createdAt).getTime();
      const coalesceWindow = 5000; // 5 seconds
      
      if (timeSinceLastEdit < coalesceWindow) {
        // Update existing draft within coalesce window
        current.data = data;
        current.summary = generateChangeSummary(current.data, data) || summary;
        saveAll(next);
        return current;
      }
    }
    
    // Create new draft if outside coalesce window or no current draft
    const version = next.length > 0 ? next[next.length - 1].version + 1 : 1;
    const draft = createRevision({ version, status: 'draft', summary, data });
    next.push(draft);
    setCurrentRevisionId(draft.id);
    saveAll(next);
    return draft;
  };

  const approveRevision = (data: Partial<ProjectContext>, summary: string) => {
    if (!projectId) return;
    const next = [...revisions];
    const current = next.find((rev) => rev.id === currentRevisionId);
    if (current) {
      current.data = data;
      current.summary = summary;
      current.status = 'approved';
      saveAll(next);
      return current;
    }
    const version = next.length > 0 ? next[next.length - 1].version + 1 : 1;
    const approved = createRevision({ version, status: 'approved', summary, data });
    next.push(approved);
    setCurrentRevisionId(approved.id);
    saveAll(next);
    return approved;
  };

  const restoreRevision = (revisionId: string) => {
    if (!projectId) return null;
    const source = revisions.find((rev) => rev.id === revisionId);
    if (!source) return null;
    const version = revisions.length > 0 ? revisions[revisions.length - 1].version + 1 : 1;
    const draft = createRevision({
      version,
      status: 'draft',
      summary: `Restored from v${source.version}`,
      data: source.data,
    });
    const next = [...revisions, draft];
    setCurrentRevisionId(draft.id);
    saveAll(next);
    return draft;
  };

  return {
    revisions,
    currentRevisionId,
    currentRevision,
    setCurrentRevisionId,
    saveDraft,
    approveRevision,
    restoreRevision,
  };
}

// Helper: Limit revisions, keeping approved ones
function limitRevisions(revisions: ProjectContextRevision[], maxCount: number): ProjectContextRevision[] {
  if (revisions.length <= maxCount) return revisions;
  
  const approved = revisions.filter(r => r.status === 'approved');
  const drafts = revisions.filter(r => r.status === 'draft');
  
  // Keep all approved + most recent drafts to fit within limit
  const availableSlots = maxCount - approved.length;
  const recentDrafts = drafts.slice(-availableSlots);
  
  return [...approved, ...recentDrafts].sort((a, b) => a.version - b.version);
}

// Helper: Generate summary based on changed fields
function generateChangeSummary(oldData?: Partial<ProjectContext>, newData?: Partial<ProjectContext>): string | null {
  if (!oldData || !newData) return null;
  
  const changes: string[] = [];
  
  if (JSON.stringify(oldData.audience) !== JSON.stringify(newData.audience)) {
    changes.push('audience');
  }
  if (JSON.stringify(oldData.brand) !== JSON.stringify(newData.brand)) {
    changes.push('brand');
  }
  if (JSON.stringify(oldData.success) !== JSON.stringify(newData.success)) {
    changes.push('success');
  }
  if (JSON.stringify(oldData.guardrails) !== JSON.stringify(newData.guardrails)) {
    changes.push('guardrails');
  }
  if (JSON.stringify(oldData.identity) !== JSON.stringify(newData.identity)) {
    changes.push('identity');
  }
  if (JSON.stringify(oldData.deliverables) !== JSON.stringify(newData.deliverables)) {
    changes.push('deliverables');
  }
  
  if (changes.length === 0) return null;
  if (changes.length === 1) return `Updated ${changes[0]}`;
  if (changes.length === 2) return `Updated ${changes[0]} & ${changes[1]}`;
  return `Updated ${changes.slice(0, -1).join(', ')} & ${changes[changes.length - 1]}`;
}
