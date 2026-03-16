-- ============================================================
-- Phase 1 Migration: Schedule Usage Reset Cron Job
-- Fixes: ARCH-005
-- ============================================================

-- ============================================================
-- 1. CREATE PG_CRON EXTENSION (if not exists)
-- ============================================================

-- This requires superuser privileges and may need to be run via Supabase dashboard
-- or by Supabase support. Comment out if pg_cron is not available.

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 2. FIX EXISTING RESET FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS public.reset_monthly_usage();
DROP FUNCTION IF EXISTS public.reset_daily_usage();

-- Fix reset_monthly_usage to run for all credentials on their reset day
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    -- Reset monthly usage for credentials where today matches their reset day
    UPDATE public.api_credentials
    SET 
        current_month_usage = 0,
        updated_at = NOW()
    WHERE 
        EXTRACT(DAY FROM NOW()) = usage_reset_day
        AND current_month_usage > 0;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE 'Reset monthly usage for % credentials', rows_updated;
    
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily usage reset (runs every day at midnight UTC)
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.api_credentials
    SET 
        current_day_usage = 0,
        updated_at = NOW()
    WHERE current_day_usage > 0;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE 'Reset daily usage for % credentials', rows_updated;
    
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. SCHEDULE CRON JOBS (if pg_cron available)
-- ============================================================

-- Uncomment these lines if pg_cron extension is enabled
-- Note: These may need to be set up via Supabase dashboard or support ticket

-- Reset daily usage every day at midnight UTC
-- SELECT cron.schedule(
--     'reset-daily-usage',
--     '0 0 * * *',
--     'SELECT public.reset_daily_usage();'
-- );

-- Reset monthly usage every day at 1 AM UTC (checks reset_day internally)
-- SELECT cron.schedule(
--     'reset-monthly-usage', 
--     '0 1 * * *',
--     'SELECT public.reset_monthly_usage();'
-- );

-- ============================================================
-- 4. ALTERNATIVE: Event Trigger Approach (if no pg_cron)
-- ============================================================

-- If pg_cron is not available, create a table to track last reset
CREATE TABLE IF NOT EXISTS public.usage_reset_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reset_type TEXT NOT NULL, -- 'daily' or 'monthly'
    last_reset_date DATE NOT NULL,
    credentials_affected INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(reset_type, last_reset_date)
);

-- Function to check and run resets (called by external cron or API endpoint)
CREATE OR REPLACE FUNCTION public.run_usage_resets()
RETURNS JSONB AS $$
DECLARE
    today DATE := CURRENT_DATE;
    daily_count INTEGER := 0;
    monthly_count INTEGER := 0;
    daily_already_run BOOLEAN;
    monthly_already_run BOOLEAN;
BEGIN
    -- Check if daily reset already ran today
    SELECT EXISTS(
        SELECT 1 FROM public.usage_reset_log 
        WHERE reset_type = 'daily' AND last_reset_date = today
    ) INTO daily_already_run;
    
    -- Run daily reset if not yet run
    IF NOT daily_already_run THEN
        daily_count := public.reset_daily_usage();
        
        INSERT INTO public.usage_reset_log (reset_type, last_reset_date, credentials_affected)
        VALUES ('daily', today, daily_count)
        ON CONFLICT (reset_type, last_reset_date) DO NOTHING;
    END IF;
    
    -- Check if monthly reset already ran today
    SELECT EXISTS(
        SELECT 1 FROM public.usage_reset_log 
        WHERE reset_type = 'monthly' AND last_reset_date = today
    ) INTO monthly_already_run;
    
    -- Run monthly reset if not yet run
    IF NOT monthly_already_run THEN
        monthly_count := public.reset_monthly_usage();
        
        -- Only log if we actually reset something
        IF monthly_count > 0 THEN
            INSERT INTO public.usage_reset_log (reset_type, last_reset_date, credentials_affected)
            VALUES ('monthly', today, monthly_count)
            ON CONFLICT (reset_type, last_reset_date) DO NOTHING;
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'daily_reset', NOT daily_already_run,
        'daily_count', daily_count,
        'monthly_reset', NOT monthly_already_run,
        'monthly_count', monthly_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. SETUP INSTRUCTIONS
-- ============================================================

COMMENT ON FUNCTION public.run_usage_resets IS 'Run daily and monthly usage resets. Call this from external cron (GitHub Actions, Netlify scheduled function, etc.)';

-- To set up external cron:
-- 1. Create Netlify scheduled function that calls this RPC
-- 2. Or use GitHub Actions with schedule trigger
-- 3. Or use any external cron service to hit edge function that calls this

-- Example Netlify function (create netlify/functions/scheduled-usage-reset.ts):
-- export const handler = async () => {
--   const { data } = await supabase.rpc('run_usage_resets');
--   return { statusCode: 200, body: JSON.stringify(data) };
-- };
-- Then configure: https://docs.netlify.com/functions/scheduled-functions/
