/**
 * /api/credentials/:id/rotate - Rotate an API credential
 * 
 * Replaces the encrypted key with a new one
 * Keeps the same credential ID and metadata
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
 * Derive encryption key
 */
async function deriveUserEncryptionKey(userId: string): Promise<string> {
  const salt = userId;
  const iterations = 100000;
  const keyLength = 32;

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
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

  return combined.toString('base64');
}

/**
 * Compute SHA-256 hash for display
 */
function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex')
    .slice(0, 16) + '...';
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const credentialId = event.path.split('/')[3];

    if (!credentialId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Credential ID required' })
      };
    }

    const { newApiKey } = JSON.parse(event.body || '{}');

    if (!newApiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'newApiKey is required' })
      };
    }

    // Get current credential
    const { data: credential, error: fetchError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('id', credentialId)
      .single();

    if (fetchError || !credential) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Credential not found' })
      };
    }

    // Store old hash for response
    const oldKeyHash = credential.key_hash;

    // Encrypt new key
    const encryptionKey = await deriveUserEncryptionKey(credential.user_id);
    const encryptedKey = encryptApiKey(newApiKey, encryptionKey);
    const newKeyHash = hashApiKey(newApiKey);

    // Update credential
    const { error: updateError } = await supabase
      .from('api_credentials')
      .update({
        encrypted_key: encryptedKey,
        key_hash: newKeyHash,
        test_status: 'untested',
        test_error_message: null,
        updated_at: new Date()
      })
      .eq('id', credentialId);

    if (updateError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to rotate credential' })
      };
    }

    // Log rotation event (for audit trail)
    const { error: auditError } = await supabase.from('audit_logs').insert({
      user_id: credential.user_id,
      credential_id: credentialId,
      action: 'rotate_credential',
      details: {
        provider_id: credential.provider_id,
        environment: credential.environment
      },
      timestamp: new Date()
    });

    if (auditError) {
      console.log('Audit log error:', auditError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: credentialId,
        providerId: credential.provider_id,
        oldKeyHash,
        newKeyHash,
        rotatedAt: new Date(),
        message: 'Credential rotated successfully. Please test the new key.'
      })
    };
  } catch (error) {
    console.error('Error rotating credential:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
