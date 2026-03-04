export type GenerationSessionStatus = 'running' | 'complete';

export interface GenerationSession {
  id: string;
  projectId: string;
  status: GenerationSessionStatus;
  startedAt?: number;
  completedAt?: number;
  skippedContext?: boolean;
  operationId?: string;
  operationStatus?: 'idle' | 'running' | 'success' | 'error';
  phase?: string;
  progress?: number;
}

const SESSION_PREFIX = 'codra:onboarding:gen-session:';
const SESSION_ID_PREFIX = 'codra:onboarding:gen-session:id:';

function getSessionKey(projectId: string) {
  return `${SESSION_PREFIX}${projectId}`;
}

function getSessionIdKey(sessionId: string) {
  return `${SESSION_ID_PREFIX}${sessionId}`;
}

function loadFromKey(key: string): GenerationSession | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as GenerationSession;
  } catch {
    return null;
  }
}

function saveToKey(key: string, session: GenerationSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(session));
}

export function loadGenerationSession(projectId: string): GenerationSession | null {
  return loadFromKey(getSessionKey(projectId));
}

export function saveGenerationSession(session: GenerationSession): void {
  saveToKey(getSessionKey(session.projectId), session);
  saveToKey(getSessionIdKey(session.id), session);
}

export function loadGenerationSessionById(sessionId: string): GenerationSession | null {
  return loadFromKey(getSessionIdKey(sessionId));
}

export function saveGenerationSessionById(sessionId: string, session: GenerationSession): void {
  saveToKey(getSessionIdKey(sessionId), session);
}

export function ensureGenerationSession(
  projectId: string,
  sessionId?: string | null,
  options?: { skippedContext?: boolean }
): GenerationSession {
  const existing = loadGenerationSession(projectId);
  if (existing) {
    if (options?.skippedContext) {
      const updated = { ...existing, skippedContext: true };
      saveGenerationSession(updated);
      return updated;
    }
    return existing;
  }

  const session: GenerationSession = {
    id: sessionId || crypto.randomUUID(),
    projectId,
    status: 'running',
    skippedContext: options?.skippedContext,
  };
  saveGenerationSession(session);
  return session;
}

export function markGenerationRunning(session: GenerationSession): GenerationSession {
  const next = {
    ...session,
    status: 'running' as const,
    startedAt: session.startedAt ?? Date.now(),
  };
  saveGenerationSession(next);
  return next;
}

export function markGenerationComplete(session: GenerationSession): GenerationSession {
  const next = {
    ...session,
    status: 'complete' as const,
    completedAt: Date.now(),
  };
  saveGenerationSession(next);
  return next;
}

export function updateGenerationSession(sessionId: string, updates: Partial<GenerationSession>): GenerationSession | null {
  const existing = loadGenerationSessionById(sessionId);
  if (!existing) return null;
  const next = { ...existing, ...updates };
  saveGenerationSession(next);
  return next;
}
