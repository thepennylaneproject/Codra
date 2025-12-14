/**
 * Admin Auth Helper
 * 
 * Middleware to check if user is an admin based on ADMIN_EMAILS env var.
 * Returns user info if admin, throws error if not.
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface AdminUser {
    id: string;
    email: string;
}

/**
 * Check if the current user is an admin
 * @param event - Netlify function event
 * @returns Admin user info if authorized
 * @throws Error if unauthorized
 */
export async function requireAdmin(event: HandlerEvent): Promise<AdminUser> {
    // Extract auth token from header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        throw new Error('Invalid or expired token');
    }

    // Check if user email is in ADMIN_EMAILS list
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

    if (!adminEmails.includes(user.email || '')) {
        throw new Error('Unauthorized: Admin access required');
    }

    return {
        id: user.id,
        email: user.email || '',
    };
}

/**
 * Check if the current user is an admin (non-throwing version)
 * @param event - Netlify function event
 * @returns true if admin, false otherwise
 */
export async function isAdmin(event: HandlerEvent): Promise<boolean> {
    try {
        await requireAdmin(event);
        return true;
    } catch {
        return false;
    }
}
