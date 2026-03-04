-- ============================================================
-- Phase 2 Migration: Enforce Project Limits via Trigger
-- Fixes: Pattern 6, ARCH-013, ARCH-004
-- ============================================================

-- ============================================================
-- 1. TIER LIMITS TABLE (Pattern 6)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tier_limits (
    tier TEXT PRIMARY KEY,
    project_limit INTEGER NOT NULL,
    max_tokens_per_request INTEGER DEFAULT 4000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populate limits
INSERT INTO public.tier_limits (tier, project_limit, max_tokens_per_request)
VALUES 
    ('free', 1, 2000),
    ('pro', 10, 8000),
    ('team', 2147483647, 32000) -- Use max int for "unlimited"/Infinity
ON CONFLICT (tier) DO UPDATE 
SET project_limit = EXCLUDED.project_limit;

-- RLS: Readable by everyone (public reference), only writable by admin
ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Limits are readable by verified users"
    ON public.tier_limits FOR SELECT
    USING (auth.role() = 'authenticated');
    
CREATE POLICY "Service role manages limits"
    ON public.tier_limits FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================
-- 2. LIMIT CHECK FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_project_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_tier TEXT := 'free';
    limit_val INTEGER := 1;
    current_count INTEGER;
    sub_record RECORD;
    profile_record RECORD;
BEGIN
    -- 1. Determine User Tier
    -- Check active subscription first
    SELECT status, plan_id INTO sub_record
    FROM public.subscriptions
    WHERE user_id = NEW.user_id;
    
    IF FOUND AND sub_record.status IN ('active', 'trialing') THEN
        -- Map plan_id to tier
        IF sub_record.plan_id IN ('pro', 'starter') THEN
            user_tier := 'pro';
        ELSIF sub_record.plan_id IN ('team', 'enterprise', 'agency') THEN
            user_tier := 'team';
        END IF;
    ELSE
        -- Fallback to profile plan if no active subscription
        SELECT plan INTO profile_record
        FROM public.profiles
        WHERE id = NEW.user_id;
        
        IF FOUND THEN
            IF profile_record.plan IN ('pro', 'starter') THEN
                user_tier := 'pro';
            ELSIF profile_record.plan IN ('team', 'enterprise', 'agency') THEN
                user_tier := 'team';
            END IF;
        END IF;
    END IF;
    
    -- 2. Get Limit for Tier
    SELECT project_limit INTO limit_val
    FROM public.tier_limits
    WHERE tier = user_tier;
    
    -- Default to free limit if tier not found
    IF limit_val IS NULL THEN
        limit_val := 1;
    END IF;
    
    -- 3. Count Active Projects (excluding the one being inserted)
    SELECT COUNT(*) INTO current_count
    FROM public.projects
    WHERE user_id = NEW.user_id 
    AND status = 'active'; -- Only count active projects
    
    -- 4. Enforce Limit
    -- If current count reaches or exceeds limit, block new insert
    -- Note: team limit is max int, so unlikely to hit
    IF current_count >= limit_val THEN
        RAISE EXCEPTION 'Project limit reached for tier % (%/%)', user_tier, current_count, limit_val
            USING ERRCODE = 'P0001'; -- Custom error code
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. APPLY TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS enforce_project_limit ON public.projects;

CREATE TRIGGER enforce_project_limit
    BEFORE INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.check_project_limit();

COMMENT ON FUNCTION public.check_project_limit IS 'Enforces project limits based on user tier from subscriptions or profile';
