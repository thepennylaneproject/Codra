-- Migration: Add satisfaction_score to ai_runs
-- Description: Adds a 1-5 integer score to track user satisfaction with AI completions.

ALTER TABLE public.ai_runs 
ADD COLUMN satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5);

-- Index for approval rate queries (filtering by satisfaction_score)
CREATE INDEX idx_ai_runs_satisfaction ON public.ai_runs(model_id, task_type, satisfaction_score) 
WHERE satisfaction_score IS NOT NULL;

COMMENT ON COLUMN public.ai_runs.satisfaction_score IS 'Engagement/Quality metric: 1-5 stars. 4+ typically counts as "approved".';
