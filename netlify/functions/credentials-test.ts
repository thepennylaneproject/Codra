/**
 * Netlify Function: /api/credentials/test
 * Test if an API credential is valid
 * Decrypts key server-side, never exposes it
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { deriveUserEncryptionKey, decryptApiKey } from '../../src/lib/api/encryption';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

// Provider test endpoints (minimal)
const PROVIDER_TESTS: Record<string, (key: string) => Promise<boolean>> = {
  aimlapi: async (key: string) => {
    try {
      const response = await fetch('https://api.aimlapi.com/models', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });
      return response.ok || response.status === 401; // 401 means auth issue (bad key), but we tried
    } catch {
      return false;
    }
  },

  openai: async (key: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });
      return response.ok || response.status === 401;
    } catch {
      return false;
    }
  },

  anthropic: async (key: string) => {
    try {
      const response = await fetch(
        'https://api.anthropic.com/v1/models',
        {
          headers: {
            'x-api-key': key,
          },
        }
      );
      return response.ok || response.status === 401;
    } catch {
      return false;
    }
  },

  gemini: async (key: string) => {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models?key=' +
        key,
        {
          method: 'GET',
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  deepseek: async (key: string) => {
    try {
      const response = await fetch('https://api.deepseek.com/models', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });
      return response.ok || response.status === 401;
    } catch {
      return false;
    }
  },

  deepai: async (key: string) => {
    try {
      // DeepAI requires POST with api-key header
      const response = await fetch(
        'https://api.deepai.org/api/ascii-art-generator',
        {
          method: 'POST',
          headers: {
            'api-key': key,
          },
          body: 'text=test',
        }
      );
      // 400 means key is valid but request was malformed
      // 401 means key is invalid
      return response.status !== 401;
    } catch {
      return false;
    }
  },
};

interface TestRequest {
  credentialId: string;
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

    const body = JSON.parse(event.body || '{}') as TestRequest;
    const { credentialId } = body;

    if (!credentialId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing credentialId' }),
      };
    }

    // Fetch credential (with RLS, only user's own credentials)
    const { data: credential, error: fetchError } = await supabase
      .from('api_credentials')
      .select('id, provider, encrypted_key')
      .eq('id', credentialId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !credential) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Credential not found' }),
      };
    }

    // Decrypt the API key
    const appSecret = process.env.CODRA_APP_SECRET || process.env.ENCRYPTION_APP_SECRET;
    if (!appSecret) {
      throw new Error('Missing encryption app secret (CODRA_APP_SECRET or ENCRYPTION_APP_SECRET)');
    }
    const encryptionKey = await deriveUserEncryptionKey(user.id, appSecret);

    let decryptedKey: string;
    try {
      decryptedKey = await decryptApiKey(
        credential.encrypted_key as string,
        encryptionKey
      );
    } catch (error) {
      console.error('Decryption failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to decrypt credential',
        }),
      };
    }

    // Test the credential with the provider
    const testFn = PROVIDER_TESTS[credential.provider];
    if (!testFn) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `No test available for provider: ${credential.provider}`,
        }),
      };
    }

    const startTime = Date.now();
    const success = await testFn(decryptedKey);
    const latency = Date.now() - startTime;

    // Never log or return the actual key
    return {
      statusCode: 200,
      body: JSON.stringify({
        success,
        provider: credential.provider,
        message: success
          ? `${credential.provider} credential is valid`
          : `${credential.provider} credential failed validation`,
        latency,
        timestamp: new Date().toISOString(),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error in credentials-test:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
