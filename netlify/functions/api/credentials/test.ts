/**
 * /api/credentials/:id/test - Test an API credential
 * 
 * Makes a test request to the provider's API to validate the credential
 * Updates test status in database
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
 * Provider test configurations
 */
const PROVIDER_TESTS: Record<string, any> = {
  aimlapi: {
    endpoint: 'https://api.aimlapi.com/models',
    method: 'GET',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/user/balance',
    method: 'GET',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    method: 'POST',
    authPrefix: 'key',
    testPayload: {
      contents: [
        {
          parts: [{ text: 'test' }]
        }
      ]
    }
  },
  deepai: {
    endpoint: 'https://api.deepai.org/api/text2img',
    method: 'POST',
    authHeader: 'api-key',
    formData: true
  }
};

/**
 * Decrypt API key (server-side)
 */
function decryptApiKey(encryptedKey: string, encryptionKeyHex: string): string {
  try {
    const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
    const combined = Buffer.from(encryptedKey, 'base64');

    // Extract components
    const iv = combined.slice(0, 12); // 96 bits
    const authTag = combined.slice(12, 28); // 128 bits
    const ciphertext = combined.slice(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

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
 * Test credential by making API request
 */
async function testCredentialWithProvider(
  providerId: string,
  apiKey: string
): Promise<{ success: boolean; message: string; responseTime: number }> {
  const config = PROVIDER_TESTS[providerId];

  if (!config) {
    return {
      success: false,
      message: `Unknown provider: ${providerId}`,
      responseTime: 0
    };
  }

  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add auth header
    if (config.authHeader && config.authPrefix) {
      headers[config.authHeader] = `${config.authPrefix} ${apiKey}`;
    } else if (config.authHeader) {
      headers[config.authHeader] = apiKey;
    }

    const init: RequestInit = {
      method: config.method,
      headers
    };

    if (config.method === 'POST' && config.testPayload) {
      init.body = JSON.stringify(config.testPayload);
    }

    const response = await fetch(config.endpoint, init);
    const responseTime = Date.now() - startTime;

    if (response.ok || response.status === 401) {
      // 401 might mean key is wrong, but server responded
      // Success = server is reachable
      return {
        success: response.ok,
        message: response.ok
          ? `Connection successful (${response.status})`
          : 'Invalid API key',
        responseTime
      };
    } else {
      return {
        success: false,
        message: `Provider returned ${response.status}`,
        responseTime
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      message: `Request failed: ${error}`,
      responseTime
    };
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const credentialId = event.path.split('/')[3]; // Extract from path

    if (!credentialId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Credential ID required' })
      };
    }

    // Get credential from database
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

    // Derive encryption key and decrypt
    const encryptionKey = await deriveUserEncryptionKey(credential.user_id);
    const decryptedKey = decryptApiKey(credential.encrypted_key, encryptionKey);

    // Test with provider
    const testResult = await testCredentialWithProvider(
      credential.provider_id,
      decryptedKey
    );

    // Update test status in database
    await supabase
      .from('api_credentials')
      .update({
        test_status: testResult.success ? 'success' : 'failed',
        test_error_message: testResult.success ? null : testResult.message,
        last_tested_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', credentialId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: testResult.success,
        message: testResult.message,
        provider: credential.provider_id,
        testedAt: new Date(),
        responseTime: testResult.responseTime
      })
    };
  } catch (error) {
    console.error('Error testing credential:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
