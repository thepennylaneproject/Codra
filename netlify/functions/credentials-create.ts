/**
 * Netlify Function: /api/credentials/create
 * Server-side encryption for API keys
 * Never exposes plaintext keys to frontend
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { deriveUserEncryptionKey, encryptApiKey } from '../../src/lib/api/encryption';

// Initialize Supabase (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

interface CreateCredentialRequest {
  provider: string;
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  options?: {
    name?: string;
    isDefault?: boolean;
    monthlyLimit?: number;
    dailyLimit?: number;
  };
}

export const handler: Handler = async (event) => {
  // Only allow POST
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

    // Verify the JWT token with Supabase
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

    const userId = user.id;

    // Parse request body
    const body = JSON.parse(event.body || '{}') as CreateCredentialRequest;
    const { provider, apiKey, environment, options } = body;

    // Validate input
    if (!provider || !apiKey || !environment) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: provider, apiKey, environment',
        }),
      };
    }

    if (!['development', 'staging', 'production'].includes(environment)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid environment' }),
      };
    }

    // Derive encryption key from user ID + app secret
    const appSecret = process.env.CODRA_APP_SECRET || process.env.ENCRYPTION_APP_SECRET;
    if (!appSecret) {
      throw new Error('Missing encryption app secret (CODRA_APP_SECRET or ENCRYPTION_APP_SECRET)');
    }
    const encryptionKey = await deriveUserEncryptionKey(userId, appSecret);

    // Encrypt the API key
    const encryptedKey = await encryptApiKey(apiKey, encryptionKey);

    // Generate masked key (last 4 characters)
    const maskedKey = `...${apiKey.slice(-4)}`;

    // Store in database
    const { data, error } = await supabase
      .from('api_credentials')
      .insert({
        user_id: userId,
        provider,
        environment,
        name: options?.name,
        is_default: options?.isDefault || false,
        is_active: true,
        encrypted_key: encryptedKey, // Store as JSONB
        masked_key: maskedKey,
        monthly_limit: options?.monthlyLimit,
        daily_limit: options?.dailyLimit,
      })
      .select(
        'id, provider, environment, name, is_default, is_active, masked_key, created_at, updated_at'
      )
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create credential' }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        credential: data,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error in credentials-create:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
