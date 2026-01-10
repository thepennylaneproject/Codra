/**
 * Content Hash Cache
 *
 * Ensures idempotency: same image bytes = same enrichment result
 */

import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface CachedEnrichment {
  content_hash: string;
  public_id: string;
  enriched_at: string;
  enrichment_version: number;
  metadata: Record<string, unknown>;
}

export class ContentHashCache {
  private cache: Map<string, CachedEnrichment>;
  private cacheFile: string;
  private dirty: boolean;

  constructor(cacheDir: string = '.cache/enrichment') {
    this.cache = new Map();
    this.cacheFile = path.join(cacheDir, 'content-hash-cache.json');
    this.dirty = false;
  }

  /**
   * Load cache from disk
   */
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const entries = JSON.parse(data) as CachedEnrichment[];
      for (const entry of entries) {
        this.cache.set(entry.content_hash, entry);
      }
      console.log(`[Cache] Loaded ${this.cache.size} entries`);
    } catch (error) {
      // Cache file doesn't exist yet, that's okay
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[Cache] Failed to load cache:', error);
      }
    }
  }

  /**
   * Save cache to disk
   */
  async save(): Promise<void> {
    if (!this.dirty) return;

    try {
      const dir = path.dirname(this.cacheFile);
      await fs.mkdir(dir, { recursive: true });

      const entries = Array.from(this.cache.values());
      await fs.writeFile(this.cacheFile, JSON.stringify(entries, null, 2));
      this.dirty = false;
      console.log(`[Cache] Saved ${entries.length} entries`);
    } catch (error) {
      console.error('[Cache] Failed to save cache:', error);
      throw error;
    }
  }

  /**
   * Compute content hash from image bytes or etag
   */
  static computeHash(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if content hash exists in cache
   */
  has(contentHash: string): boolean {
    return this.cache.has(contentHash);
  }

  /**
   * Get cached enrichment by content hash
   */
  get(contentHash: string): CachedEnrichment | undefined {
    return this.cache.get(contentHash);
  }

  /**
   * Store enrichment result in cache
   */
  set(enrichment: CachedEnrichment): void {
    this.cache.set(enrichment.content_hash, enrichment);
    this.dirty = true;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    oldest: string | null;
    newest: string | null;
  } {
    const entries = Array.from(this.cache.values());
    const dates = entries
      .map((e) => e.enriched_at)
      .filter(Boolean)
      .sort();

    return {
      size: entries.length,
      oldest: dates[0] || null,
      newest: dates[dates.length - 1] || null,
    };
  }

  /**
   * Prune cache entries older than N days
   */
  prune(maxAgeDays: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);
    const cutoffIso = cutoff.toISOString();

    let pruned = 0;
    for (const [hash, entry] of this.cache.entries()) {
      if (entry.enriched_at < cutoffIso) {
        this.cache.delete(hash);
        pruned++;
      }
    }

    if (pruned > 0) {
      this.dirty = true;
      console.log(`[Cache] Pruned ${pruned} stale entries`);
    }

    return pruned;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.dirty = true;
  }
}

/**
 * Singleton cache instance
 */
let globalCache: ContentHashCache | null = null;

export function getContentHashCache(
  cacheDir?: string,
): ContentHashCache {
  if (!globalCache) {
    globalCache = new ContentHashCache(cacheDir);
  }
  return globalCache;
}
