/**
 * /api/credentials/create - Create and encrypt API credentials
 * 
 * SECURITY NOTES:
 * - Receives plaintext API key in request body
 * - Encrypts key server-side using per-user encryption key
 * - Stores only encrypted key in database
 * - Never logs or exposes plaintext keys
 * - Returns keyHash (SHA-256) for display purposes
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENCRYPTION_APP_SECRET = process.env.ENCRYPTION_APP_SECRET!;

/**
 * Derive encryption key from user ID (server-side version)
 */
async function deriveUserEncryptionKey(userId: string): Promise<string> {
  const salt = userId;
  const iterations = 100000;
  const keyLength = 32; // 256 bits
  
  const derivedKey = crypto.pbkdf2Sync(
    ENCRYPTION_APP_SECRET,
    salt,
    iterations,
    keyLength,
    'sha256'
  );

  return derivedKey.toString('hex');
}

/**
 * Encrypt API key using AES-256-GCM
 */
function encryptApiKey(plaintext: string, encryptionKeyHex: string): string {
  const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
  const iv = crypto.randomBytes(12); // 96 bits for GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine: iv + authTag + ciphertext (all hex-encoded, then base64)
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
  
  return combined.toString('base64');
}

/**
 * Compute SHA-256 hash of API key (for display/verification)
 */
function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex')
    .slice(0, 16) + '...'; // Display first 16 chars
}

export const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get authenticated user
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Parse request body
    const { providerId, environment, apiKey, metadata } = JSON.parse(
      event.body || '{}'
    );

    if (!providerId || !environment || !apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: providerId, environment, apiKey'
        })
      };
    }

    // Validate environment
    if (!['dev', 'staging', 'prod'].includes(environment)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid environment' })
      };
    }

    // Get user from auth token (simplified - in real app, verify JWT)
    const userId = 'user-123'; // TODO: Extract from JWT token

    // Derive encryption key
    const encryptionKey = await deriveUserEncryptionKey(userId);

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey, encryptionKey);
    const keyHash = hashApiKey(apiKey);

    // Store in Supabase
    const { data, error } = await supabase
      .from('api_credentials')
      .insert({
        user_id: userId,
        provider_id: providerId,
        environment,
        encrypted_key: encryptedKey,
        key_hash: keyHash,
        is_active: true,
        test_status: 'untested',
        metadata: metadata || {},
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to store credential' })
      };
    }

    // Return credential (without encrypted key)
    return {
      statusCode: 201,
      body: JSON.stringify({
        id: data.id,
        providerId: data.provider_id,
        environment: data.environment,
        keyHash: data.key_hash,
        isActive: data.is_active,
        createdAt: data.created_at,
        message: 'Credential created successfully'
      })
    };
  } catch (error) {
    console.error('Error creating credential:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
