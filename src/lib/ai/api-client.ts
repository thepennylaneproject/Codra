/**
 * AI API Client
 * Calls Netlify Functions for AI completions instead of direct provider calls
 * Handles authentication, streaming, and error handling
 */

import { supabase } from '../supabase';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from './types';

// Type alias for compatibility
export type StreamChunk = AIStreamChunk;

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in.');
  }
  return session.access_token;
}

export async function complete(request: AICompletionRequest): Promise<AICompletionResponse> {
  const token = await getAuthToken();

  const response = await fetch('/api/ai/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export async function* streamComplete(
  request: AICompletionRequest
): AsyncGenerator<StreamChunk> {
  const token = await getAuthToken();

  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Stream request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(line.slice(6));
          yield chunk;
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}
