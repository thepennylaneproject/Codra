/**
 * Netlify Function: /api/credentials/rotate
 * Rotate an API key (replace with new one)
 * Encrypts new key server-side
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { deriveUserEncryptionKey, encryptApiKey } from '../../src/lib/api/encryption';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface RotateRequest {
  credentialId: string;
  newApiKey: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify authorization
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const body = JSON.parse(event.body || '{}') as RotateRequest;
    const { credentialId, newApiKey } = body;

    if (!credentialId || !newApiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: credentialId, newApiKey',
        }),
      };
    }

    // Verify credential belongs to user
    const { data: credential, error: fetchError } = await supabase
      .from('api_credentials')
      .select('id, provider, is_default')
      .eq('id', credentialId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !credential) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Credential not found' }),
      };
    }

    // Encrypt the new API key
    const appSecret = process.env.CODRA_APP_SECRET!;
    const encryptionKey = await deriveUserEncryptionKey(user.id, appSecret);
    const encryptedKey = await encryptApiKey(newApiKey, encryptionKey);

    // Generate masked key
    const maskedKey = `...${newApiKey.slice(-4)}`;

    // Update in database
    const { data, error } = await supabase
      .from('api_credentials')
      .update({
        encrypted_key: encryptedKey,
        masked_key: maskedKey,
        updated_at: new Date(),
      })
      .eq('id', credentialId)
      .select(
        'id, provider, environment, name, is_default, is_active, masked_key, created_at, updated_at'
      )
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to rotate key' }),
      };
    }

    // Log the rotation event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      credential_id: credentialId,
      action: 'key_rotated',
      details: {
        provider: credential.provider,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        credential: data,
        message: 'Key rotated successfully',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error in credentials-rotate:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
