/**
 * Cloudinary Configuration and Client Setup
 */

import { v2 as cloudinary } from 'cloudinary';

/**
 * Parse Cloudinary credentials from environment
 */
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function parseCloudinaryEnv(): CloudinaryConfig {
  const url = process.env.CLOUDINARY_URL;

  if (url && url.startsWith('cloudinary://')) {
    const withoutScheme = url.replace('cloudinary://', '');
    const [creds, cloudName] = withoutScheme.split('@');
    const [apiKey, apiSecret] = creds.split(':');

    if (!apiKey || !apiSecret || !cloudName) {
      throw new Error('Invalid CLOUDINARY_URL format.');
    }

    return { cloudName, apiKey, apiSecret };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary credentials. Set CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
    );
  }

  return { cloudName, apiKey, apiSecret };
}

/**
 * Initialize Cloudinary client
 */
export function initializeCloudinary(): typeof cloudinary {
  const config = parseCloudinaryEnv();

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return cloudinary;
}

/**
 * Get configured Cloudinary instance
 */
export function getCloudinary(): typeof cloudinary {
  // Check if already configured
  const existingConfig = cloudinary.config();
  if (!existingConfig.cloud_name) {
    return initializeCloudinary();
  }
  return cloudinary;
}

/**
 * Normalize Cloudinary public_id from various input formats
 */
export function normalizePublicId(input: string): string | null {
  if (!input) return null;

  let s = String(input).split('?')[0]; // strip query params

  // If it's a URL, extract the upload path
  const uploadIndex = s.indexOf('/upload/');
  if (uploadIndex !== -1) {
    s = s.slice(uploadIndex + '/upload/'.length);
  }

  // Remove transformation segments (everything before /v123/)
  const versionMatch = s.match(/\/v\d+\//);
  if (versionMatch) {
    s = s.slice(versionMatch.index! + versionMatch[0].length);
  }

  // Remove leading version if still present
  s = s.replace(/^v\d+\//, '');

  // Remove file extension
  s = s.replace(/\.[a-z0-9]+$/i, '');

  return s || null;
}

/**
 * Build Cloudinary URL from public_id
 */
export function buildCloudinaryUrl(
  publicId: string,
  options?: {
    transformation?: string;
    format?: string;
  },
): string {
  const config = parseCloudinaryEnv();
  const transformation = options?.transformation || 'f_auto,q_auto';
  const format = options?.format || '';

  return `https://res.cloudinary.com/${config.cloudName}/image/upload/${transformation}/${publicId}${format ? '.' + format : ''}`;
}
