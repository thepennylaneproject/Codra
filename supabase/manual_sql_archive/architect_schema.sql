-- ARCHITECT SCHEMA MIGRATION
-- ProjectContext Data Model for Codra's Architect System
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'other',
  primary_goal TEXT NOT NULL,
  secondary_goals TEXT[] DEFAULT '{}',
  target_users TEXT[] DEFAULT '{}',
  tech_stack JSONB DEFAULT '{}',
  constraints JSONB DEFAULT '{}',
  brand JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE projects IS 'Core project specifications for Architect system';
COMMENT ON COLUMN projects.domain IS 'Project type: saas, site, automation, content_engine, api, mobile, other';
COMMENT ON COLUMN projects.status IS 'Project status: draft, active, paused, completed, archived';
COMMENT ON COLUMN projects.tech_stack IS 'JSON: frontend[], backend[], infra[], aiProviders[]';
COMMENT ON COLUMN projects.constraints IS 'JSON: budgetLevel, timeline, complexityTolerance, maxMonthlyAICost, deadlineDate';
COMMENT ON COLUMN projects.brand IS 'JSON: voiceTags[], adjectives[], bannedWords[], toneNotes';

-- ============================================================================
-- WORKSTREAMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workstreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started',
  task_count INTEGER DEFAULT 0,
  completed_task_count INTEGER DEFAULT 0,
  context_hints TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workstreams IS 'High-level phases of work within a project';
COMMENT ON COLUMN workstreams.status IS 'not_started, in_progress, blocked, completed';
COMMENT ON COLUMN workstreams.context_hints IS 'Hints for AI when generating tasks';

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workstream_id UUID REFERENCES workstreams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0,
  depends_on UUID[] DEFAULT '{}',
  blocked_by UUID[] DEFAULT '{}',
  ai_context JSONB DEFAULT '{}',
  artifact_ids UUID[] DEFAULT '{}',
  assigned_to UUID,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE tasks IS 'Concrete deliverables within workstreams';
COMMENT ON COLUMN tasks.type IS 'design, component, copy, flow, icon, illustration, integration, research, other';
COMMENT ON COLUMN tasks.status IS 'backlog, ready, in_progress, in_review, completed, blocked';
COMMENT ON COLUMN tasks.priority IS 'low, medium, high, critical';
COMMENT ON COLUMN tasks.ai_context IS 'JSON: suggestedPrompts[], suggestedModels[], estimatedTokens, estimatedCost';

-- ============================================================================
-- TASK PROMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  suggested_model TEXT,
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  variables JSONB DEFAULT '[]',
  generation_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_prompts IS 'AI instructions for task execution';
COMMENT ON COLUMN task_prompts.variables IS 'JSON array: [{name, description, defaultValue, required}]';

-- ============================================================================
-- ARTIFACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  current_version_id UUID,
  version_count INTEGER DEFAULT 0,
  content_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

COMMENT ON TABLE artifacts IS 'Generated outputs (icons, components, copy, flows)';
COMMENT ON COLUMN artifacts.type IS 'icon, illustration, component, page, flow, prompt, copy, code, document';
COMMENT ON COLUMN artifacts.status IS 'draft, under_review, needs_revision, approved, archived';
COMMENT ON COLUMN artifacts.content_type IS 'text, code, image, json, svg';

-- ============================================================================
-- ARTIFACT VERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT,
  created_by TEXT NOT NULL DEFAULT 'user',
  prompt_used TEXT,
  model_used TEXT,
  user_feedback_tags TEXT[] DEFAULT '{}',
  user_feedback_note TEXT,
  diff_from_previous TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artifact_id, version_number)
);

COMMENT ON TABLE artifact_versions IS 'Version history for artifacts';
COMMENT ON COLUMN artifact_versions.created_by IS 'agent or user';
COMMENT ON COLUMN artifact_versions.content_hash IS 'For deduplication';

-- ============================================================================
-- NAME REGISTRY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS name_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'code',
  description TEXT,
  artifact_id UUID,
  task_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'user',
  UNIQUE(project_id, name, kind)
);

COMMENT ON TABLE name_registry IS 'Naming consistency and collision detection';
COMMENT ON COLUMN name_registry.kind IS 'component, file, route, db_table, feature, tier, flow, icon';
COMMENT ON COLUMN name_registry.scope IS 'code, product, marketing, internal';

-- ============================================================================
-- SUCCESS CRITERIA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS success_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  criterion TEXT NOT NULL,
  is_met BOOLEAN DEFAULT FALSE,
  evidence TEXT,
  checked_at TIMESTAMPTZ
);

COMMENT ON TABLE success_criteria IS 'Project success criteria tracking';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE name_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_criteria ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Projects: Users can only access their own
CREATE POLICY "Users can manage their own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- Workstreams: Access via project ownership
CREATE POLICY "Users can manage workstreams in their projects"
  ON workstreams FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Tasks: Access via project ownership
CREATE POLICY "Users can manage tasks in their projects"
  ON tasks FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Task Prompts: Access via project ownership
CREATE POLICY "Users can manage prompts in their projects"
  ON task_prompts FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Artifacts: Access via project ownership
CREATE POLICY "Users can manage artifacts in their projects"
  ON artifacts FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Artifact Versions: Access via artifact ownership
CREATE POLICY "Users can manage artifact versions in their projects"
  ON artifact_versions FOR ALL
  USING (artifact_id IN (
    SELECT id FROM artifacts WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  ));

-- Name Registry: Access via project ownership
CREATE POLICY "Users can manage names in their projects"
  ON name_registry FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Success Criteria: Access via project ownership
CREATE POLICY "Users can manage success criteria in their projects"
  ON success_criteria FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_workstreams_project ON workstreams(project_id);
CREATE INDEX IF NOT EXISTS idx_workstreams_status ON workstreams(status);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workstream ON tasks(workstream_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

CREATE INDEX IF NOT EXISTS idx_task_prompts_task ON task_prompts(task_id);
CREATE INDEX IF NOT EXISTS idx_task_prompts_project ON task_prompts(project_id);

CREATE INDEX IF NOT EXISTS idx_artifacts_project ON artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_task ON artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);

CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact ON artifact_versions(artifact_id);

CREATE INDEX IF NOT EXISTS idx_name_registry_project ON name_registry(project_id);
CREATE INDEX IF NOT EXISTS idx_name_registry_name ON name_registry(name);

CREATE INDEX IF NOT EXISTS idx_success_criteria_project ON success_criteria(project_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at 
  BEFORE UPDATE ON projects
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS workstreams_updated_at ON workstreams;
CREATE TRIGGER workstreams_updated_at 
  BEFORE UPDATE ON workstreams
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at 
  BEFORE UPDATE ON tasks
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS task_prompts_updated_at ON task_prompts;
CREATE TRIGGER task_prompts_updated_at 
  BEFORE UPDATE ON task_prompts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS artifacts_updated_at ON artifacts;
CREATE TRIGGER artifacts_updated_at 
  BEFORE UPDATE ON artifacts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();
