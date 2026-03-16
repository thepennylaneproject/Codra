-- Phase 5: Image Generation Schema
-- Run in Supabase SQL Editor

-- Table: image_generation_jobs
-- Tracks all image generation requests and their statu                           IOs
CREATE TABLE IF NOT EXISTS image_generation_jobs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Request parameters
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  width INTEGER,
  height INTEGER,
  steps INTEGER,
  seed INTEGER,
  style TEXT,
  guidance NUMERIC,
  
  -- Results
  image_url TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  generation_time INTEGER,
  revised_prompt TEXT,
  
  -- Retry tracking
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_code TEXT,
  error_message TEXT,
  
  -- Webhook
  webhook_url TEXT,
  webhook_delivered BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_by_user_id UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_image_jobs_user_id ON image_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_image_jobs_workspace_id ON image_generation_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_image_jobs_status ON image_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_image_jobs_created_at ON image_generation_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_jobs_user_created ON image_generation_jobs(user_id, created_at DESC);

-- Table: image_models
-- Cache of available models and their capabilities
CREATE TABLE IF NOT EXISTS image_models (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('text2img', 'img2img', 'upscale', 'style-transfer')),
  
  -- Capabilities
  supports_negative_prompt BOOLEAN DEFAULT false,
  supports_seed BOOLEAN DEFAULT false,
  supports_steps BOOLEAN DEFAULT false,
  supports_guidance BOOLEAN DEFAULT false,
  supports_style BOOLEAN DEFAULT false,
  
  -- Dimensions
  min_width INTEGER DEFAULT 512,
  max_width INTEGER DEFAULT 1792,
  min_height INTEGER DEFAULT 512,
  max_height INTEGER DEFAULT 1792,
  recommended_width INTEGER DEFAULT 1024,
  recommended_height INTEGER DEFAULT 1024,
  
  -- Performance and cost
  avg_generation_time INTEGER,
  cost_per_generation NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(provider, model_name)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_image_models_provider ON image_models(provider);
CREATE INDEX IF NOT EXISTS idx_image_models_active ON image_models(active);

-- Table: image_generation_results
-- Store generated image metadata (alternative to joining with jobs)
CREATE TABLE IF NOT EXISTS image_generation_results (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES image_generation_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  image_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  seed INTEGER,
  revised_prompt TEXT,
  
  -- Metadata for searching/filtering
  prompt_embedding VECTOR(1536), -- For semantic search (requires pgvector extension)
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_results_job_id ON image_generation_results(job_id);
CREATE INDEX IF NOT EXISTS idx_image_results_user_id ON image_generation_results(user_id);
CREATE INDEX IF NOT EXISTS idx_image_results_created_at ON image_generation_results(created_at DESC);

-- RLS Policies

-- Enable RLS
ALTER TABLE image_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generation_results ENABLE ROW LEVEL SECURITY;

-- image_generation_jobs policies
CREATE POLICY "Users can view their own jobs"
  ON image_generation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON image_generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON image_generation_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON image_generation_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- image_models policies (public read-only)
CREATE POLICY "Models are readable by everyone"
  ON image_models FOR SELECT
  USING (true);

-- image_generation_results policies
CREATE POLICY "Users can view their own results"
  ON image_generation_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
  ON image_generation_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert default models
INSERT INTO image_models (id, provider, model_name, display_name, description, category, supports_negative_prompt, supports_seed, supports_steps, supports_guidance, supports_style, recommended_width, recommended_height, avg_generation_time, cost_per_generation, tier)
VALUES
  ('dall-e-3', 'aimlapi', 'dall-e-3', 'DALL-E 3', 'Advanced text-to-image generation with improved realism', 'text2img', false, true, false, false, false, 1024, 1024, 8000, 0.020, 'pro'),
  ('flux-pro', 'aimlapi', 'flux-pro', 'Flux Pro', 'High-quality diffusion model with fast generation', 'text2img', true, true, true, true, true, 1024, 1024, 15000, 0.014, 'pro'),
  ('stable-diffusion-xl', 'aimlapi', 'stable-diffusion-xl', 'Stable Diffusion XL', 'Open-source SDXL with excellent quality', 'text2img', true, true, true, true, false, 1024, 1024, 6000, 0.004, 'basic'),
  ('stable-diffusion-3', 'aimlapi', 'stable-diffusion-3', 'Stable Diffusion 3', 'Latest SDXL with improved text handling', 'text2img', true, true, true, true, false, 1024, 1024, 10000, 0.006, 'basic'),
  ('text2img', 'deepai', 'text2img', 'DeepAI Text2Img', 'Fast, affordable text-to-image generation', 'text2img', true, false, false, false, false, 512, 512, 5000, 0.002, 'free'),
  ('deepdream', 'deepai', 'deepdream', 'Deep Dream', 'Artistic dream-like image generation', 'text2img', false, false, false, false, true, 512, 512, 4000, 0.003, 'free');

-- Update trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_image_generation_jobs_updated_at
  BEFORE UPDATE ON image_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_models_updated_at
  BEFORE UPDATE ON image_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for generated images
-- Note: Run this in Supabase Storage settings or use the Storage API
-- CREATE STORAGE BUCKET "generated-images" WITH (PUBLIC = true, FILE_SIZE_LIMIT = 10485760);

-- RLS for storage bucket
-- INSERT INTO storage.buckets (id, name, public, owner) 
-- VALUES ('generated-images', 'generated-images', true, NULL);

-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Public read access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'generated-images');

-- CREATE POLICY "Authenticated users can upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can delete their own uploads" ON storage.objects
--   FOR DELETE USING (bucket_id = 'generated-images' AND owner = auth.uid());
