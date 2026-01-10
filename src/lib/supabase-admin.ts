/**
 * Supabase Admin Client
 * Uses the Service Role Key to bypass RLS.
 * ONLY for use in server-side scripts and Netlify Functions.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    // If not found, don't throw yet, as this might be imported in contexts where it's not needed
    // But provide a way to check
}

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

/**
 * Get the admin client, throwing if variables are missing.
 */
export function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL. Admin client could not be initialized.');
    }
    return supabaseAdmin;
}
