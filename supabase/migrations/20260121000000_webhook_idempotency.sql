-- ============================================================
-- Phase 1 Migration: Webhook Idempotency & Subscriptions
-- Fixes: ARCH-001, ARCH-002, ARCH-003, ARCH-004
-- ============================================================

-- ============================================================
-- 1. WEBHOOK EVENTS (Idempotency Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY, -- Stripe event.id
    type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    payload JSONB, -- Optional: store full event for debugging
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.webhook_events(created_at DESC);

-- Auto-cleanup old events (keep 30 days)
COMMENT ON TABLE public.webhook_events IS 'Stripe webhook event deduplication. Events older than 30 days should be pruned.';

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================

-- Create subscription_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Stripe identifiers
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    
    -- Subscription details
    status subscription_status NOT NULL DEFAULT 'incomplete',
    plan_id TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'team', 'enterprise'
    price_id TEXT, -- Stripe price ID
    
    -- Billing cycle
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one subscription per user
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Updated timestamp trigger
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Webhook events: service role only
CREATE POLICY "Service role can manage webhook events"
    ON public.webhook_events FOR ALL
    USING (auth.role() = 'service_role');

-- Subscriptions: users can view own
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================
-- 4. MIGRATE EXISTING DATA
-- ============================================================

-- If profiles table has plan column, migrate to subscriptions
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Only migrate if subscriptions table is empty
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions LIMIT 1) THEN
        -- Create subscription record for each user with non-free plan
        FOR profile_record IN 
            SELECT id, plan 
            FROM public.profiles 
            WHERE plan IS NOT NULL AND plan != 'free'
        LOOP
            INSERT INTO public.subscriptions (user_id, status, plan_id)
            VALUES (
                profile_record.id,
                'active', -- Assume existing paid users are active
                profile_record.plan
            )
            ON CONFLICT (user_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Migrated % subscriptions from profiles', (SELECT COUNT(*) FROM public.subscriptions);
    END IF;
END $$;

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Function to check if webhook already processed
CREATE OR REPLACE FUNCTION public.is_webhook_processed(event_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.webhook_events WHERE id = event_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark webhook as processed
CREATE OR REPLACE FUNCTION public.mark_webhook_processed(event_id TEXT, event_type TEXT, event_payload JSONB DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.webhook_events (id, type, payload)
    VALUES (event_id, event_type, event_payload)
    ON CONFLICT (id) DO NOTHING;
    
    -- Return true if this invocation created the row
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_webhook_processed IS 'Check if Stripe webhook event was already processed';
COMMENT ON FUNCTION public.mark_webhook_processed IS 'Mark webhook as processed, returns true if first time';
