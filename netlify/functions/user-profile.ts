// ============================================================
// CODRA USER PROFILE - Netlify Function
// netlify/functions/user-profile.ts
// Get and update user profile with service role access
// ============================================================

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate env vars
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

// Create Supabase admin client
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
  'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
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

// Extract and verify JWT from Authorization header
async function verifyAuth(event: HandlerEvent): Promise<{ userId: string } | null> {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the JWT and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('JWT verification failed:', error);
      return null;
    }

    return { userId: user.id };
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
}

// ============================================================
// GET Profile
// ============================================================
async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return response(404, { error: 'Profile not found' });
  }

  // Transform snake_case to camelCase
  const profile = {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    company: data.company,
    jobTitle: data.job_title,
    timezone: data.timezone,
    preferences: data.preferences,
    plan: data.plan,
    planStartedAt: data.plan_started_at,
    planExpiresAt: data.plan_expires_at,
    onboardingCompleted: data.onboarding_completed,
    lastActiveAt: data.last_active_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return response(200, { data: profile });
}

// ============================================================
// UPDATE Profile
// ============================================================
async function updateProfile(userId: string, updates: Record<string, unknown>) {
  // Transform camelCase to snake_case
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.company !== undefined) dbUpdates.company = updates.company;
  if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
  if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
  if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;

  // Handle preferences merge
  if (updates.preferences) {
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();
    
    dbUpdates.preferences = {
      ...(currentProfile?.preferences || {}),
      ...(updates.preferences as object),
    };
  }

  // Validate updates
  if (Object.keys(dbUpdates).length === 0) {
    return response(400, { error: 'No valid fields to update' });
  }

  // Update profile
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return response(500, { error: 'Failed to update profile' });
  }

  // Transform response
  const profile = {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    company: data.company,
    jobTitle: data.job_title,
    timezone: data.timezone,
    preferences: data.preferences,
    plan: data.plan,
    planStartedAt: data.plan_started_at,
    planExpiresAt: data.plan_expires_at,
    onboardingCompleted: data.onboarding_completed,
    lastActiveAt: data.last_active_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return response(200, { data: profile });
}

// ============================================================
// DELETE Account (soft delete + schedule hard delete)
// ============================================================
async function deleteAccount(userId: string) {
  // First, anonymize the profile
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name: '[Deleted User]',
      display_name: null,
      avatar_url: null,
      company: null,
      job_title: null,
      preferences: {},
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error anonymizing profile:', updateError);
    return response(500, { error: 'Failed to delete account' });
  }

  // Delete the auth user (this cascades to profile via FK)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error('Error deleting auth user:', deleteError);
    return response(500, { error: 'Failed to delete account completely' });
  }

  return response(200, { success: true, message: 'Account deleted successfully' });
}

// ============================================================
// Main Handler
// ============================================================
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // Verify authentication
  const auth = await verifyAuth(event);
  if (!auth) {
    return response(401, { error: 'Unauthorized' });
  }

  const { userId } = auth;

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getProfile(userId);

      case 'PUT':
      case 'PATCH': {
        if (!event.body) {
          return response(400, { error: 'Request body required' });
        }
        const updates = JSON.parse(event.body);
        return await updateProfile(userId, updates);
      }

      case 'DELETE':
        return await deleteAccount(userId);

      default:
        return response(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
