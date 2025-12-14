// ============================================================
// CODRA AUTH CALLBACK - Netlify Function
// netlify/functions/auth-callback.ts
// OAuth callback handler for Supabase Auth
// ============================================================

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Response helper
const response = (statusCode: number, body: object) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders,
  },
  body: JSON.stringify(body),
});

// Redirect helper
const redirect = (url: string) => ({
  statusCode: 302,
  headers: {
    Location: url,
    ...corsHeaders,
  },
  body: '',
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // Only accept GET (OAuth redirects)
  if (event.httpMethod !== 'GET') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const params = event.queryStringParameters || {};

    // Get the code from OAuth provider
    const code = params.code;
    const errorParam = params.error;
    const errorDescription = params.error_description;

    // Handle OAuth errors
    if (errorParam) {
      console.error('OAuth error:', errorParam, errorDescription);
      const errorUrl = new URL('/login', process.env.URL || 'http://localhost:4444');
      errorUrl.searchParams.set('error', errorParam);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      return redirect(errorUrl.toString());
    }

    // No code provided
    if (!code) {
      console.error('No code provided in callback');
      const errorUrl = new URL('/login', process.env.URL || 'http://localhost:4444');
      errorUrl.searchParams.set('error', 'missing_code');
      return redirect(errorUrl.toString());
    }

    // Exchange the code for a session
    // Note: Supabase handles this automatically via the client library,
    // but we can verify/log here if needed

    // The actual token exchange happens on the frontend via Supabase JS
    // This endpoint primarily handles:
    // 1. Logging the callback for debugging
    // 2. Redirecting to the appropriate page
    // 3. Handling any server-side processing needed

    // Log successful callback
    console.log('OAuth callback received, redirecting to app');

    // Get the intended redirect (stored in state or default)
    const returnTo = params.returnTo || '/';

    // Build the redirect URL with the code (for frontend to exchange)
    const appUrl = new URL('/auth/callback', process.env.URL || 'http://localhost:4444');
    appUrl.searchParams.set('code', code);
    if (params.returnTo) {
      appUrl.searchParams.set('returnTo', params.returnTo);
    }

    return redirect(appUrl.toString());

  } catch (error) {
    console.error('Auth callback error:', error);
    const errorUrl = new URL('/login', process.env.URL || 'http://localhost:4444');
    errorUrl.searchParams.set('error', 'server_error');
    return redirect(errorUrl.toString());
  }
};
