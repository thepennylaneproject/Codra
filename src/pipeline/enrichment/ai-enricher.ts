/**
 * AI Enricher
 *
 * Handles AI-based image analysis with rate limiting, retry logic,
 * and cost controls.
 */

import pLimit from 'p-limit';
import { AI_ENRICHMENT_PROMPT } from '../config/taxonomy';

// ============================================================================
// Types
// ============================================================================

export interface AIAnalysisResult {
  tags: string[];
  tone: string;
  palette_primary: string;
  usage_notes: string;
}

export interface EnricherOptions {
  apiKey: string;
  model?: string;
  maxConcurrency?: number;
  maxRequestsPerMinute?: number;
  retryAttempts?: number;
  timeoutMs?: number;
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerMinute: number;

  constructor(maxRequestsPerMinute: number) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  async acquireSlot(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo,
    );

    // If we're at the limit, wait
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitMs = oldestTimestamp + 60000 - now;
      if (waitMs > 0) {
        console.log(`[RateLimiter] Waiting ${waitMs}ms to respect rate limit`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  getStats(): { current: number; limit: number } {
    const oneMinuteAgo = Date.now() - 60000;
    const current = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo,
    ).length;
    return { current, limit: this.maxRequestsPerMinute };
  }
}

// ============================================================================
// AI Enricher Class
// ============================================================================

export class AIEnricher {
  private apiKey: string;
  private model: string;
  private limiter: pLimit.Limit;
  private rateLimiter: RateLimiter;
  private retryAttempts: number;
  private timeoutMs: number;

  // Statistics
  private stats = {
    requestsMade: 0,
    requestsSucceeded: 0,
    requestsFailed: 0,
    totalCost: 0, // Approximate, in tokens
  };

  constructor(options: EnricherOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'claude-3-haiku-20240307';
    this.retryAttempts = options.retryAttempts || 5;
    this.timeoutMs = options.timeoutMs || 60000;

    // Concurrency limiter
    this.limiter = pLimit(options.maxConcurrency || 3);

    // Rate limiter (requests per minute)
    this.rateLimiter = new RateLimiter(
      options.maxRequestsPerMinute || 10,
    );
  }

  /**
   * Analyze a single image
   */
  async analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
    return this.limiter(async () => {
      await this.rateLimiter.acquireSlot();
      return this.analyzeImageInternal(imageUrl);
    });
  }

  /**
   * Internal analysis with retry logic
   */
  private async analyzeImageInternal(
    imageUrl: string,
  ): Promise<AIAnalysisResult> {
    this.stats.requestsMade++;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.makeApiCall(imageUrl);
        this.stats.requestsSucceeded++;
        return result;
      } catch (error) {
        const err = error as Error & { status?: number; retryAfter?: number };

        // Non-retryable errors
        if (err.status === 401 || err.status === 403) {
          this.stats.requestsFailed++;
          throw new Error(`Authentication failed: ${err.message}`);
        }

        // Retryable errors
        const isRateLimit = err.status === 429;
        const isRetryable =
          isRateLimit ||
          err.status === 408 ||
          err.status === 503 ||
          err.message.includes('timeout');

        if (!isRetryable || attempt === this.retryAttempts) {
          this.stats.requestsFailed++;
          throw error;
        }

        // Calculate backoff
        let sleepMs: number;
        if (isRateLimit && err.retryAfter) {
          sleepMs = err.retryAfter * 1000;
        } else {
          const base = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s
          const jitter = Math.floor(Math.random() * 500);
          sleepMs = Math.min(30000, base + jitter); // cap at 30s
        }

        console.log(
          `[AIEnricher] Retry ${attempt}/${this.retryAttempts} after ${sleepMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Make API call to Claude Vision
   */
  private async makeApiCall(imageUrl: string): Promise<AIAnalysisResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Apply Cloudinary transformation to resize image for AI analysis (max 5MB limit)
      // Transform: resize to max 2000px, quality 80, auto format
      const optimizedUrl = this.applyAIOptimization(imageUrl);
      
      // Fetch image and convert to base64
      const imageResponse = await fetch(optimizedUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const mimeType =
        imageResponse.headers.get('content-type') || 'image/jpeg';

      // Call Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: base64Image,
                  },
                },
                {
                  type: 'text',
                  text: AI_ENRICHMENT_PROMPT,
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `Anthropic API error ${response.status}: ${errorText}`,
        ) as Error & { status?: number; retryAfter?: number };
        error.status = response.status;

        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          error.retryAfter = parseInt(retryAfter, 10);
        }

        throw error;
      }

      const data = (await response.json()) as {
        content?: Array<{ text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error('No content in Anthropic response');
      }

      // Track approximate cost (tokens)
      if (data.usage) {
        const inputTokens = data.usage.input_tokens || 0;
        const outputTokens = data.usage.output_tokens || 0;
        this.stats.totalCost += inputTokens + outputTokens;
      }

      // Parse JSON response
      return this.parseResponse(content);
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Parse JSON response from Claude
   */
  private parseResponse(content: string): AIAnalysisResult {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(jsonStr) as AIAnalysisResult;

      // Validate required fields
      if (!parsed.tags || !Array.isArray(parsed.tags)) {
        throw new Error('Missing or invalid tags field');
      }
      if (!parsed.tone || typeof parsed.tone !== 'string') {
        throw new Error('Missing or invalid tone field');
      }
      if (
        !parsed.palette_primary ||
        typeof parsed.palette_primary !== 'string'
      ) {
        throw new Error('Missing or invalid palette_primary field');
      }

      return parsed;
    } catch (error) {
      throw new Error(
        `Failed to parse AI response: ${(error as Error).message}\nContent: ${content}`,
      );
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    requestsMade: number;
    requestsSucceeded: number;
    requestsFailed: number;
    totalCost: number;
    rateLimitStatus: { current: number; limit: number };
  } {
    return {
      ...this.stats,
      rateLimitStatus: this.rateLimiter.getStats(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      requestsMade: 0,
      requestsSucceeded: 0,
      requestsFailed: 0,
      totalCost: 0,
    };
  }

  /**
   * Apply Cloudinary transformations to optimize image for AI analysis.
   * Ensures image stays under Anthropic's 5MB limit.
   * 
   * Transformation: w_2000,h_2000,c_limit,q_80,f_jpg
   * - Max 2000px on longest side
   * - Quality 80 (good balance of size vs quality)
   * - Convert to JPEG (smaller than PNG)
   */
  private applyAIOptimization(imageUrl: string): string {
    // Check if it's a Cloudinary URL
    const cloudinaryPattern = /https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.*)/;
    const match = imageUrl.match(cloudinaryPattern);
    
    if (!match) {
      // Not a Cloudinary URL, return as-is
      console.log(`[AIEnricher] Non-Cloudinary URL, using original: ${imageUrl}`);
      return imageUrl;
    }
    
    const cloudName = match[1];
    let pathAfterUpload = match[2];
    
    // Remove any existing transformations (everything before the public_id)
    // Cloudinary URLs: /upload/[transformations]/[version]/public_id
    // We need to find where the public_id starts
    
    // If there's a version (v1234...), keep it and everything after
    const versionMatch = pathAfterUpload.match(/(v\d+\/.*)/);
    if (versionMatch) {
      pathAfterUpload = versionMatch[1];
    }
    
    // Insert our optimization transformation
    const transformation = 'w_2000,h_2000,c_limit,q_80,f_jpg';
    const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${pathAfterUpload}`;
    
    console.log(`[AIEnricher] Optimized image URL for AI: ${optimizedUrl}`);
    return optimizedUrl;
  }
}
