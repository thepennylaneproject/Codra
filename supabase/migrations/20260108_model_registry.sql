-- Living Model Registry Schema
-- Migration: 20260108_model_registry.sql
-- Creates core tables for dynamic model discovery, health tracking, and eval scores

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES (with IF NOT EXISTS guards)
-- ============================================================================

-- Model status in the registry
DO $$ BEGIN
    CREATE TYPE model_status AS ENUM ('active', 'candidate', 'deprecated', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Event types for audit logging
DO $$ BEGIN
    CREATE TYPE model_registry_event_type AS ENUM (
        'discovered',
        'missing',
        'promoted',
        'demoted',
        'disabled',
        'changed_capabilities'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- MODEL REGISTRY
-- Canonical store of all discovered models
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    model_key TEXT NOT NULL,
    display_name TEXT,
    status model_status NOT NULL DEFAULT 'candidate',
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    capabilities_json JSONB DEFAULT '{}',
    meta_json JSONB DEFAULT '{}',
    registry_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint on provider + model_key
    CONSTRAINT unique_provider_model UNIQUE (provider, model_key)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_model_registry_provider ON model_registry(provider);
CREATE INDEX IF NOT EXISTS idx_model_registry_status ON model_registry(status);
CREATE INDEX IF NOT EXISTS idx_model_registry_version ON model_registry(registry_version);
CREATE INDEX IF NOT EXISTS idx_model_registry_last_seen ON model_registry(last_seen_at);

-- ============================================================================
-- MODEL HEALTH
-- Time-windowed operational metrics (latency, errors)
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    model_key TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    median_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key to registry (optional - model might be deleted)
    CONSTRAINT fk_model_health_registry 
        FOREIGN KEY (provider, model_key) 
        REFERENCES model_registry(provider, model_key) 
        ON DELETE CASCADE
);

-- Indexes for health queries
CREATE INDEX IF NOT EXISTS idx_model_health_provider_model ON model_health(provider, model_key);
CREATE INDEX IF NOT EXISTS idx_model_health_window ON model_health(window_start, window_end);

-- ============================================================================
-- MODEL SCORES
-- Codra-evaluated performance scores per eval run
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    model_key TEXT NOT NULL,
    run_id TEXT NOT NULL,
    ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suite_version TEXT NOT NULL,
    coding_edit_score REAL,
    tool_use_score REAL,
    retrieval_score REAL,
    json_validity_score REAL,
    overall_score REAL,
    details_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key to registry
    CONSTRAINT fk_model_scores_registry 
        FOREIGN KEY (provider, model_key) 
        REFERENCES model_registry(provider, model_key) 
        ON DELETE CASCADE
);

-- Indexes for score queries
CREATE INDEX IF NOT EXISTS idx_model_scores_provider_model ON model_scores(provider, model_key);
CREATE INDEX IF NOT EXISTS idx_model_scores_run_id ON model_scores(run_id);
CREATE INDEX IF NOT EXISTS idx_model_scores_ran_at ON model_scores(ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_scores_overall ON model_scores(overall_score DESC);

-- ============================================================================
-- MODEL REGISTRY EVENTS
-- Audit log of all registry changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_registry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_version INTEGER NOT NULL,
    event_type model_registry_event_type NOT NULL,
    provider TEXT NOT NULL,
    model_key TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event queries
CREATE INDEX IF NOT EXISTS idx_model_registry_events_version ON model_registry_events(registry_version);
CREATE INDEX IF NOT EXISTS idx_model_registry_events_type ON model_registry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_model_registry_events_provider_model ON model_registry_events(provider, model_key);
CREATE INDEX IF NOT EXISTS idx_model_registry_events_at ON model_registry_events(at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for model_registry updated_at
DROP TRIGGER IF EXISTS update_model_registry_updated_at ON model_registry;
CREATE TRIGGER update_model_registry_updated_at
    BEFORE UPDATE ON model_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_registry_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all model data
DROP POLICY IF EXISTS "Allow authenticated read on model_registry" ON model_registry;
CREATE POLICY "Allow authenticated read on model_registry" 
    ON model_registry FOR SELECT 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on model_health" ON model_health;
CREATE POLICY "Allow authenticated read on model_health" 
    ON model_health FOR SELECT 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on model_scores" ON model_scores;
CREATE POLICY "Allow authenticated read on model_scores" 
    ON model_scores FOR SELECT 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on model_registry_events" ON model_registry_events;
CREATE POLICY "Allow authenticated read on model_registry_events" 
    ON model_registry_events FOR SELECT 
    TO authenticated 
    USING (true);

-- Service role can do everything
DROP POLICY IF EXISTS "Allow service role full access on model_registry" ON model_registry;
CREATE POLICY "Allow service role full access on model_registry" 
    ON model_registry FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access on model_health" ON model_health;
CREATE POLICY "Allow service role full access on model_health" 
    ON model_health FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access on model_scores" ON model_scores;
CREATE POLICY "Allow service role full access on model_scores" 
    ON model_scores FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access on model_registry_events" ON model_registry_events;
CREATE POLICY "Allow service role full access on model_registry_events" 
    ON model_registry_events FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE model_registry IS 'Canonical store of all discovered AI models across providers';
COMMENT ON TABLE model_health IS 'Time-windowed operational metrics for model health monitoring';
COMMENT ON TABLE model_scores IS 'Codra-evaluated performance scores from eval runs';
COMMENT ON TABLE model_registry_events IS 'Audit log of all registry state changes';

COMMENT ON COLUMN model_registry.status IS 'active=production ready, candidate=newly discovered, deprecated=missing from provider, disabled=manually turned off';
COMMENT ON COLUMN model_registry.capabilities_json IS 'Structured capabilities: {tools: bool, vision: bool, json_mode: bool, streaming: bool, max_context: number}';
COMMENT ON COLUMN model_registry.meta_json IS 'Raw provider metadata for debugging';
COMMENT ON COLUMN model_registry.registry_version IS 'Version when this model was last updated';
