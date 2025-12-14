/**
 * src/lib/ai/storage/image-storage.ts
 * Supabase Storage integration for image persistence
 */

import { createClient } from '@supabase/supabase-js';

export class ImageStorage {
  private supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  private bucketName = 'generated-images';

  /**
   * Initialize storage bucket (call once on startup)
   */
  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === this.bucketName);

      if (!exists) {
        // Create bucket with public access for reading images
        await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        console.log(`Created storage bucket: ${this.bucketName}`);
      }
    } catch (error) {
      console.error('Failed to initialize storage bucket:', error);
      throw error;
    }
  }

  /**
   * Download image from provider URL and upload to Supabase
   */
  async uploadImage(
    jobId: string,
    userId: string,
    imageUrl: string,
    prompt: string
  ): Promise<string> {
    try {
      // Download image from provider
      const imageBuffer = await this.downloadImage(imageUrl);

      // Generate storage path
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}-${jobId}.png`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          metadata: {
            jobId,
            userId,
            prompt: prompt.slice(0, 200), // Store truncated prompt
            uploadedAt: new Date().toISOString(),
          },
          cacheControl: '31536000', // 1 year cache
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Generate public URL
      const { data: publicUrl } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return publicUrl.publicUrl;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image upload failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Download image from URL (with retry)
   */
  async downloadImage(
    url: string,
    maxRetries: number = 3
  ): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Codra/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        // Check size
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 10485760) {
          // 10MB
          throw new Error('Image exceeds size limit (10MB)');
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to download image');
  }

  /**
   * Delete image from storage
   */
  async deleteImage(jobId: string, userId: string): Promise<void> {
    try {
      // Find file with this jobId
      const { data: files } = await this.supabase.storage
        .from(this.bucketName)
        .list(userId);

      const file = files?.find(f => f.name.includes(jobId));

      if (file) {
        const { error } = await this.supabase.storage
          .from(this.bucketName)
          .remove([`${userId}/${file.name}`]);

        if (error) {
          throw new Error(`Delete failed: ${error.message}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image deletion failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List images for user
   */
  async listImages(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<{ name: string; url: string; created: string }>> {
    try {
      const { data: files } = await this.supabase.storage
        .from(this.bucketName)
        .list(userId, {
          limit,
          offset,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (!files) {
        return [];
      }

      return files.map(file => {
        const { data: publicUrl } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(`${userId}/${file.name}`);

        return {
          name: file.name,
          url: publicUrl.publicUrl,
          created: file.created_at,
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list images: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get signed URL (private access)
   */
  async getSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Signed URL generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Clean up expired jobs (older than 30 days)
   */
  async cleanupExpiredImages(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(
        Date.now() - daysOld * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: files } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1000 });

      if (!files) {
        return 0;
      }

      let deletedCount = 0;

      for (const file of files) {
        if (file.created_at < cutoffDate) {
          const { error } = await this.supabase.storage
            .from(this.bucketName)
            .remove([file.name]);

          if (!error) {
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }
}

export const imageStorage = new ImageStorage();
