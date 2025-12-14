/**
 * Netlify Edge Function: Auth Handler
 * Handles authentication-related operations at the edge
 * Location: netlify/edge-functions/auth.ts
 */

import { Context } from 'https://edge.netlify.com';

/**
 * Helper to get Supabase credentials from environment
 */
function getSupabaseConfig() {
    return {
        url: Deno.env.get('VITE_SUPABASE_URL'),
        anonKey: Deno.env.get('VITE_SUPABASE_ANON_KEY'),
        serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    };
}

/**
 * OAuth callback handler
 * Handles redirects from OAuth providers
 */
async function handleOAuthCallback(request: Request, context: Context) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            return new Response(
                JSON.stringify({
                    error: 'OAuth error',
                    message: error
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!code) {
            return new Response(
                JSON.stringify({ error: 'No authorization code received' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Redirect to frontend with code for client-side exchange
        const redirectUrl = new URL('/', url.origin);
        redirectUrl.searchParams.set('code', code);
        redirectUrl.searchParams.set('type', 'oauth');

        return new Response(null, {
            status: 302,
            headers: {
                Location: redirectUrl.toString()
            }
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'OAuth callback failed', message: String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Password reset handler
 */
async function handlePasswordReset(request: Request, context: Context) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');

        if (!token || type !== 'recovery') {
            return new Response(
                JSON.stringify({ error: 'Invalid password reset token' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Redirect to password reset page
        const resetUrl = new URL('/auth/reset-password', url.origin);
        resetUrl.searchParams.set('token', token);

        return new Response(null, {
            status: 302,
            headers: {
                Location: resetUrl.toString()
            }
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Password reset failed', message: String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Email confirmation handler
 */
async function handleEmailConfirmation(request: Request, context: Context) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');

        if (!token || type !== 'email') {
            return new Response(
                JSON.stringify({ error: 'Invalid email confirmation token' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Redirect to confirmation page
        const confirmUrl = new URL('/auth/confirm-email', url.origin);
        confirmUrl.searchParams.set('token', token);

        return new Response(null, {
            status: 302,
            headers: {
                Location: confirmUrl.toString()
            }
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Email confirmation failed', message: String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(request: Request, context: Context) {
    return new Response(
        JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString()
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

/**
 * Main handler
 */
export default async (request: Request, context: Context) => {
    // Only handle GET requests
    if (request.method !== 'GET') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Route to appropriate handler
    if (pathname === '/.netlify/edge-functions/auth/callback') {
        return handleOAuthCallback(request, context);
    } else if (pathname === '/.netlify/edge-functions/auth/reset') {
        return handlePasswordReset(request, context);
    } else if (pathname === '/.netlify/edge-functions/auth/confirm') {
        return handleEmailConfirmation(request, context);
    } else if (pathname === '/.netlify/edge-functions/auth/health') {
        return handleHealthCheck(request, context);
    } else {
        return new Response(
            JSON.stringify({ error: 'Not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
    }
};