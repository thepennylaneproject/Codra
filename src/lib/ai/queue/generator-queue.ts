/**
 * src/lib/ai/queue/generator-queue.ts
 * Queue management for async image generation jobs
 */

import { createClient } from '@supabase/supabase-js';
import {
  ImageGenerationJob,
  ImageGenerationOptions,
  ImageGenerationResult,
  GenerationJobRecord,
  QueueStatus,
  IImageProvider,
} from '../types-image';

export class ImageGeneratorQueue {
  private supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // private providers: Map<string, IImageProvider>;

  constructor(_providers: Map<string, IImageProvider>) {
    // this.providers = providers;
  }

  /**
   * Create a new generation job
   */
  async createJob(
    userId: string,
    workspaceId: string,
    provider: string,
    model: string,
    options: ImageGenerationOptions
  ): Promise<ImageGenerationJob> {
    const jobId = this.generateJobId();

    const record: GenerationJobRecord = {
      id: jobId,
      user_id: userId,
      workspace_id: workspaceId,
      provider,
      model,
      status: 'pending',
      prompt: options.prompt,
      negative_prompt: options.negativePrompt,
      width: options.width,
      height: options.height,
      steps: options.steps,
      seed: options.seed,
      style: options.style,
      guidance: options.guidance,
      cost: 0,
      retry_count: 0,
      max_retries: 3,
      webhook_url: options.webhookUrl,
      webhook_delivered: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('image_generation_jobs')
      .insert([record])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return this.recordToJob(data as GenerationJobRecord);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<ImageGenerationJob | null> {
    const { data, error } = await this.supabase
      .from('image_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get job: ${error.message}`);
    }

    return this.recordToJob(data as GenerationJobRecord);
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    updates?: Partial<GenerationJobRecord>
  ): Promise<void> {
    const payload: Partial<GenerationJobRecord> = {
      status,
      ...updates,
    };

    if (status === 'processing' && !updates?.started_at) {
      payload.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      payload.completed_at = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('image_generation_jobs')
      .update(payload)
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  /**
   * Set job result
   */
  async setJobResult(
    jobId: string,
    result: ImageGenerationResult,
    cost: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('image_generation_jobs')
      .update({
        status: 'completed',
        image_url: result.url,
        cost,
        generation_time: result.generationTime,
        revised_prompt: result.metadata.revisedPrompt,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to set job result: ${error.message}`);
    }
  }

  /**
   * Set job error
   */
  async setJobError(
    jobId: string,
    code: string,
    message: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('image_generation_jobs')
      .update({
        status: 'failed',
        error_code: code,
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to set job error: ${error.message}`);
    }
  }

  /**
   * Get user's generation jobs
   */
  async getUserJobs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ImageGenerationJob[]> {
    const { data, error } = await this.supabase
      .from('image_generation_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch user jobs: ${error.message}`);
    }

    return (data as GenerationJobRecord[]).map(record =>
      this.recordToJob(record)
    );
  }

  /**
   * Get workspace generation jobs
   */
  async getWorkspaceJobs(
    workspaceId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ImageGenerationJob[]> {
    const { data, error } = await this.supabase
      .from('image_generation_jobs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch workspace jobs: ${error.message}`);
    }

    return (data as GenerationJobRecord[]).map(record =>
      this.recordToJob(record)
    );
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<QueueStatus> {
    const { data, error } = await this.supabase
      .from('image_generation_jobs')
      .select('status, generation_time');

    if (error) {
      throw new Error(`Failed to get queue status: ${error.message}`);
    }

    const jobs = data as Array<{
      status: string;
      generation_time: number | null;
    }>;

    const totalJobs = jobs.length;
    const pendingJobs = jobs.filter(j => j.status === 'pending').length;
    const processingJobs = jobs.filter(j => j.status === 'processing').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const failedJobs = jobs.filter(j => j.status === 'failed').length;

    const completedWithTime = jobs.filter(
      j => j.status === 'completed' && j.generation_time
    );
    const avgGenerationTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, j) => sum + (j.generation_time || 0), 0) /
      completedWithTime.length
      : 0;

    // Estimate wait time: pending + processing jobs * avg time
    const estimatedWaitTime = (pendingJobs + processingJobs) * avgGenerationTime;

    return {
      totalJobs,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      avgGenerationTime,
      estimatedWaitTime,
    };
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<ImageGenerationJob> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.retryCount >= job.maxRetries) {
      throw new Error(`Job has exceeded max retries (${job.maxRetries})`);
    }

    await this.updateJobStatus(jobId, 'pending', {
      retry_count: job.retryCount + 1,
      error_code: undefined,
      error_message: undefined,
    });

    const updatedJob = await this.getJob(jobId);
    if (!updatedJob) {
      throw new Error('Failed to retrieve updated job');
    }

    return updatedJob;
  }

  /**
   * Deliver webhook for completed job
   */
  async deliverWebhook(job: ImageGenerationJob): Promise<boolean> {
    if (!job.webhookUrl) {
      return true;
    }

    try {
      const payload = {
        jobId: job.id,
        status: job.status,
        timestamp: new Date().toISOString(),
        result: job.result,
        error: job.error,
      };

      const response = await fetch(job.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Codra/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await this.supabase
          .from('image_generation_jobs')
          .update({ webhook_delivered: true })
          .eq('id', job.id);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      return false;
    }
  }

  /**
   * Get pending jobs for processing
   */
  async getPendingJobs(limit: number = 10): Promise<ImageGenerationJob[]> {
    const { data, error } = await this.supabase
      .from('image_generation_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch pending jobs: ${error.message}`);
    }

    return (data as GenerationJobRecord[]).map(record =>
      this.recordToJob(record)
    );
  }

  /**
   * Get jobs with failures
   */
  async getFailedJobs(limit: number = 50): Promise<ImageGenerationJob[]> {
    const { data, error } = await this.supabase
      .from('image_generation_jobs')
      .select('*')
      .eq('status', 'failed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch failed jobs: ${error.message}`);
    }

    return (data as GenerationJobRecord[]).map(record =>
      this.recordToJob(record)
    );
  }

  /**
   * Helper: Convert database record to job object
   */
  private recordToJob(record: GenerationJobRecord): ImageGenerationJob {
    const job: ImageGenerationJob = {
      id: record.id,
      userId: record.user_id,
      workspaceId: record.workspace_id,
      provider: record.provider,
      model: record.model,
      status: record.status as 'pending' | 'processing' | 'completed' | 'failed',
      options: {
        prompt: record.prompt,
        negativePrompt: record.negative_prompt || undefined,
        model: record.model,
        width: record.width || undefined,
        height: record.height || undefined,
        steps: record.steps || undefined,
        seed: record.seed || undefined,
        style: record.style || undefined,
        guidance: record.guidance || undefined,
        webhookUrl: record.webhook_url || undefined,
      },
      retryCount: record.retry_count,
      maxRetries: record.max_retries,
      createdAt: new Date(record.created_at),
      startedAt: record.started_at ? new Date(record.started_at) : undefined,
      completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
      webhookUrl: record.webhook_url || undefined,
      webhookDelivered: record.webhook_delivered,
    };

    if (record.image_url) {
      job.result = {
        url: record.image_url,
        model: record.model,
        provider: record.provider,
        dimensions: {
          width: record.width || 1024,
          height: record.height || 1024,
        },
        cost: record.cost,
        generationTime: record.generation_time || 0,
        metadata: {
          prompt: record.prompt,
          negativePrompt: record.negative_prompt,
          seed: 0,
          revisedPrompt: record.revised_prompt || undefined,
        },
      };
    }

    if (record.error_code) {
      job.error = {
        code: record.error_code,
        message: record.error_message || 'Unknown error',
      };
    }

    return job;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
