export type CostLedgerEntryType = 'reserve' | 'commit' | 'rollback' | 'refund';

export interface CostLedgerEntry {
  id: string;
  projectId: string;
  taskId?: string;
  amount: number;
  currency: 'USD';
  type: CostLedgerEntryType;
  createdAt: string;
  relatedEntryId?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface CostLedgerSummary {
  date: string;
  spent: number;
  reserved: number;
  refunded: number;
  committedCount: number;
}

const STORAGE_PREFIX = 'codra:cost-ledger:';

function getStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function readEntries(projectId: string): CostLedgerEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getStorageKey(projectId));
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(projectId: string, entries: CostLedgerEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(projectId), JSON.stringify(entries));
}

function matchesDate(entry: CostLedgerEntry, date: string): boolean {
  return entry.createdAt.startsWith(date);
}

export class CostLedger {
  reserve(input: {
    projectId: string;
    taskId?: string;
    amount: number;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }): CostLedgerEntry {
    return this.appendEntry({
      ...input,
      type: 'reserve',
    });
  }

  commit(input: {
    projectId: string;
    taskId?: string;
    amount: number;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }): CostLedgerEntry {
    return this.appendEntry({
      ...input,
      type: 'commit',
    });
  }

  rollback(input: {
    projectId: string;
    taskId?: string;
    amount: number;
    relatedEntryId?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }): CostLedgerEntry {
    return this.appendEntry({
      ...input,
      type: 'rollback',
    });
  }

  refund(input: {
    projectId: string;
    taskId?: string;
    amount: number;
    relatedEntryId?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }): CostLedgerEntry {
    return this.appendEntry({
      ...input,
      type: 'refund',
    });
  }

  getEntries(projectId: string): CostLedgerEntry[] {
    return readEntries(projectId);
  }

  getDailySummary(projectId: string, date: string = todayKey()): CostLedgerSummary {
    const entries = this.getEntries(projectId).filter((entry) => matchesDate(entry, date));
    const committed = entries.filter((entry) => entry.type === 'commit');
    const refunds = entries.filter((entry) => entry.type === 'refund');
    const reserves = entries.filter((entry) => entry.type === 'reserve');
    const rollbacks = entries.filter((entry) => entry.type === 'rollback');

    const spent = committed.reduce((sum, entry) => sum + entry.amount, 0) -
      refunds.reduce((sum, entry) => sum + entry.amount, 0);
    const reserved = reserves.reduce((sum, entry) => sum + entry.amount, 0) -
      rollbacks.reduce((sum, entry) => sum + entry.amount, 0);
    const refunded = refunds.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      date,
      spent: Math.max(0, spent),
      reserved: Math.max(0, reserved),
      refunded,
      committedCount: committed.length,
    };
  }

  private appendEntry(input: {
    projectId: string;
    taskId?: string;
    amount: number;
    type: CostLedgerEntryType;
    relatedEntryId?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }): CostLedgerEntry {
    const entry: CostLedgerEntry = {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      taskId: input.taskId,
      amount: Math.max(0, input.amount),
      currency: 'USD',
      type: input.type,
      createdAt: new Date().toISOString(),
      relatedEntryId: input.relatedEntryId,
      metadata: input.metadata,
    };

    const entries = readEntries(input.projectId);
    entries.push(entry);
    writeEntries(input.projectId, entries);
    return entry;
  }
}

export const costLedger = new CostLedger();
