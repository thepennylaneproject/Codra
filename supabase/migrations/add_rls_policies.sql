/**
 * Add / Fix Missing RLS Policies
 *
 * Addresses LYRA finding f-missing-rls-tables-01
 * Fixes PLP-47: Missing RLS Policies on API Credentials and Settings Tables
 *
 * Tables covered:
 *   - app_settings      (workspace-scoped global settings)
 *   - provider_settings (workspace-scoped provider configuration)
 *   - model_settings    (workspace-scoped model configuration)
 *   - project_briefing_state (per-user/per-project onboarding state)
 *   - credential_usage  (usage tracking – service-role write only)
 *   - usage_alerts      (quota alerts    – service-role write only)
 *
 * This migration is idempotent (DROP IF EXISTS before every CREATE).
 */

-- ============================================================
-- 1. APP_SETTINGS
-- Replace the unconstrained ALL policy with proper per-workspace
-- INSERT / UPDATE / DELETE policies scoped to the workspace owner.
-- ============================================================

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Remove the overly-permissive ALL policy (no role restriction → any
-- authenticated user could mutate global settings).
DROP POLICY IF EXISTS "Service role can manage app settings" ON public.app_settings;

-- Re-create the SELECT policy scoped to workspace owners
DROP POLICY IF EXISTS "Users can view app settings" ON public.app_settings;
CREATE POLICY "Users can view app settings"
    ON public.app_settings FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Workspace owners can create settings for their own workspace
DROP POLICY IF EXISTS "Workspace owners can insert app settings" ON public.app_settings;
CREATE POLICY "Workspace owners can insert app settings"
    ON public.app_settings FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Workspace owners can update their own workspace settings
DROP POLICY IF EXISTS "Workspace owners can update app settings" ON public.app_settings;
CREATE POLICY "Workspace owners can update app settings"
    ON public.app_settings FOR UPDATE
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Workspace owners can delete their own workspace settings
DROP POLICY IF EXISTS "Workspace owners can delete app settings" ON public.app_settings;
CREATE POLICY "Workspace owners can delete app settings"
    ON public.app_settings FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Service role retains unrestricted access (used by admin endpoints)
DROP POLICY IF EXISTS "Service role can manage app settings" ON public.app_settings;
CREATE POLICY "Service role can manage app settings"
    ON public.app_settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 2. PROVIDER_SETTINGS
-- ============================================================

ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage provider settings" ON public.provider_settings;

DROP POLICY IF EXISTS "Users can view provider settings" ON public.provider_settings;
CREATE POLICY "Users can view provider settings"
    ON public.provider_settings FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workspace owners can insert provider settings" ON public.provider_settings;
CREATE POLICY "Workspace owners can insert provider settings"
    ON public.provider_settings FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workspace owners can update provider settings" ON public.provider_settings;
CREATE POLICY "Workspace owners can update provider settings"
    ON public.provider_settings FOR UPDATE
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workspace owners can delete provider settings" ON public.provider_settings;
CREATE POLICY "Workspace owners can delete provider settings"
    ON public.provider_settings FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role can manage provider settings" ON public.provider_settings;
CREATE POLICY "Service role can manage provider settings"
    ON public.provider_settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 3. MODEL_SETTINGS
-- ============================================================

ALTER TABLE public.model_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage model settings" ON public.model_settings;

DROP POLICY IF EXISTS "Users can view model settings" ON public.model_settings;
CREATE POLICY "Users can view model settings"
    ON public.model_settings FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workspace owners can insert model settings" ON public.model_settings;
CREATE POLICY "Workspace owners can insert model settings"
    ON public.model_settings FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workspace owners can update model settings" ON public.model_settings;
CREATE POLICY "Workspace owners can update model settings"
    ON public.model_settings FOR UPDATE
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workspace owners can delete model settings" ON public.model_settings;
CREATE POLICY "Workspace owners can delete model settings"
    ON public.model_settings FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role can manage model settings" ON public.model_settings;
CREATE POLICY "Service role can manage model settings"
    ON public.model_settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 4. PROJECT_BRIEFING_STATE
-- Add the previously missing DELETE policy so users can clean up
-- their own briefing state records.
-- ============================================================

ALTER TABLE public.project_briefing_state ENABLE ROW LEVEL SECURITY;

-- Idempotently re-create existing policies
DROP POLICY IF EXISTS "Users can read own briefing state" ON public.project_briefing_state;
CREATE POLICY "Users can read own briefing state"
    ON public.project_briefing_state FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own briefing state" ON public.project_briefing_state;
CREATE POLICY "Users can insert own briefing state"
    ON public.project_briefing_state FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own briefing state" ON public.project_briefing_state;
CREATE POLICY "Users can update own briefing state"
    ON public.project_briefing_state FOR UPDATE
    USING (auth.uid() = user_id);

-- New: allow users to delete their own briefing state
DROP POLICY IF EXISTS "Users can delete own briefing state" ON public.project_briefing_state;
CREATE POLICY "Users can delete own briefing state"
    ON public.project_briefing_state FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 5. CREDENTIAL_USAGE
-- Restrict INSERT and UPDATE to service_role only.
-- Netlify Functions use the service-role key, which bypasses RLS
-- entirely, so these policies protect against accidental writes
-- from regular authenticated users.
-- ============================================================

ALTER TABLE public.credential_usage ENABLE ROW LEVEL SECURITY;

-- Replace the unconstrained Netlify-Function policies with
-- explicit service_role-scoped versions.
DROP POLICY IF EXISTS "Netlify Functions can record usage" ON public.credential_usage;
CREATE POLICY "Netlify Functions can record usage"
    ON public.credential_usage FOR INSERT
    TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Netlify Functions can update usage" ON public.credential_usage;
CREATE POLICY "Netlify Functions can update usage"
    ON public.credential_usage FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 6. USAGE_ALERTS
-- Restrict INSERT to service_role only.
-- ============================================================

ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Netlify Functions can create alerts" ON public.usage_alerts;
CREATE POLICY "Netlify Functions can create alerts"
    ON public.usage_alerts FOR INSERT
    TO service_role
    WITH CHECK (true);
