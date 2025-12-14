-- PHASE 6: Model Benchmarking Panel
-- Database Schema & Migrations

-- ============================================================================
-- TABLE: benchmarks
-- Stores benchmark configurations and results
-- ============================================================================
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')), -- text or image benchmark
  
  -- Configuration
  models JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of model IDs
  parameters JSONB DEFAULT '{}'::jsonb, -- temperature, maxTokens, etc.
  iterations INTEGER DEFAULT 1 CHECK (iterations >= 1 AND iterations <= 5),
  
  -- Status & Results
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'running', 'completed', 'failed')),
  progress JSONB DEFAULT '{"current": 0, "total": 0}'::jsonb,
  
  -- Results
  results JSONB DEFAULT '[]'::jsonb, -- Array of BenchmarkResult
  summary JSONB, -- {avgLatency, totalCost, winner, etc.}
  
  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_results_structure CHECK (
    jsonb_typeof(results) = 'array' AND 
    (jsonb_array_length(results) = 0 OR jsonb_typeof(results -> 0) = 'object')
  )
);

-- Indexes for common queries
CREATE INDEX idx_benchmarks_user_id ON benchmarks(user_id);
CREATE INDEX idx_benchmarks_workspace_id ON benchmarks(workspace_id);
CREATE INDEX idx_benchmarks_status ON benchmarks(status);
CREATE INDEX idx_benchmarks_created_at ON benchmarks(created_at DESC);
CREATE INDEX idx_benchmarks_is_favorite ON benchmarks(is_favorite) WHERE is_favorite = TRUE;

-- ============================================================================
-- TABLE: benchmark_jobs
-- Tracks individual benchmark jobs for async processing
-- ============================================================================
CREATE TABLE IF NOT EXISTS benchmark_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id UUID NOT NULL REFERENCES benchmarks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job configuration
  job_index INTEGER NOT NULL, -- Which model in the benchmark (0-indexed)
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  
  -- aimlapi batch processing
  batch_request_id TEXT, -- aimlapi batch request ID
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  
  -- Results
  output TEXT, -- Raw completion/image result
  latency_ms INTEGER,
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT max_retries CHECK (retry_count <= 3)
);

-- Indexes
CREATE INDEX idx_benchmark_jobs_benchmark_id ON benchmark_jobs(benchmark_id);
CREATE INDEX idx_benchmark_jobs_user_id ON benchmark_jobs(user_id);
CREATE INDEX idx_benchmark_jobs_status ON benchmark_jobs(status);
CREATE INDEX idx_benchmark_jobs_batch_request_id ON benchmark_jobs(batch_request_id);

-- ============================================================================
-- TABLE: benchmark_history
-- Stores previous versions of benchmark runs for comparison
-- ============================================================================
CREATE TABLE IF NOT EXISTS benchmark_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id UUID NOT NULL REFERENCES benchmarks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Snapshot of previous run
  snapshot JSONB NOT NULL, -- Full benchmark result at this point in time
  
  -- Metadata
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_version_per_benchmark UNIQUE (benchmark_id, version_number)
);

-- Indexes
CREATE INDEX idx_benchmark_history_benchmark_id ON benchmark_history(benchmark_id);
CREATE INDEX idx_benchmark_history_user_id ON benchmark_history(user_id);

-- ============================================================================
-- TABLE: benchmark_favorites
-- Denormalized view for quick access to favorite results
-- ============================================================================
CREATE TABLE IF NOT EXISTS benchmark_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  benchmark_id UUID NOT NULL REFERENCES benchmarks(id) ON DELETE CASCADE,
  
  -- Why it's a favorite
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_benchmark_favorite UNIQUE (user_id, benchmark_id)
);

-- Index
CREATE INDEX idx_benchmark_favorites_user_id ON benchmark_favorites(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_favorites ENABLE ROW LEVEL SECURITY;

-- Benchmarks: Users can only see their own benchmarks
CREATE POLICY "Users can view their own benchmarks" ON benchmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own benchmarks" ON benchmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own benchmarks" ON benchmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own benchmarks" ON benchmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Benchmark Jobs: Users can only see their own benchmark jobs
CREATE POLICY "Users can view their own benchmark jobs" ON benchmark_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own benchmark jobs" ON benchmark_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own benchmark jobs" ON benchmark_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Benchmark History: Users can only see their own history
CREATE POLICY "Users can view their own benchmark history" ON benchmark_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own benchmark history" ON benchmark_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites: Users can only manage their own favorites
CREATE POLICY "Users can manage their own favorites" ON benchmark_favorites
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for benchmarks updated_at
CREATE TRIGGER update_benchmarks_updated_at BEFORE UPDATE
  ON benchmarks FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for benchmark_jobs updated_at
CREATE TRIGGER update_benchmark_jobs_updated_at BEFORE UPDATE
  ON benchmark_jobs FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate benchmark summary statistics
CREATE OR REPLACE FUNCTION calculate_benchmark_summary(benchmark_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_results JSONB;
  v_summary JSONB;
BEGIN
  SELECT results INTO v_results FROM benchmarks WHERE id = benchmark_id;
  
  IF v_results IS NULL OR jsonb_array_length(v_results) = 0 THEN
    RETURN '{"status": "no_results"}'::jsonb;
  END IF;
  
  -- Build summary from results
  SELECT jsonb_build_object(
    'totalResults', jsonb_array_length(v_results),
    'totalCost', (SELECT SUM(CAST((r->>'cost' AS DECIMAL))) FROM jsonb_array_elements(v_results) AS r),
    'avgLatency', (SELECT AVG(CAST((r->>'latency' AS INTEGER))) FROM jsonb_array_elements(v_results) AS r),
    'minLatency', (SELECT MIN(CAST((r->>'latency' AS INTEGER))) FROM jsonb_array_elements(v_results) AS r),
    'maxLatency', (SELECT MAX(CAST((r->>'latency' AS INTEGER))) FROM jsonb_array_elements(v_results) AS r),
    'winner', (SELECT (r->>'model') FROM jsonb_array_elements(v_results) AS r ORDER BY CAST((r->>'cost' AS DECIMAL)) LIMIT 1)
  ) INTO v_summary;
  
  RETURN v_summary;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SAMPLE DATA (optional, for testing)
-- ============================================================================

-- Uncomment to insert test benchmark
/*
INSERT INTO benchmarks (user_id, name, description, prompt, type, models)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Code Generation Comparison',
  'Compare different models for code generation tasks',
  'Write a TypeScript function that validates email addresses',
  'text',
  '[{"id": "gpt-4o", "provider": "openai"}, {"id": "claude-3.5-sonnet", "provider": "anthropic"}, {"id": "deepseek-chat", "provider": "deepseek"}]'::jsonb
);
*/
