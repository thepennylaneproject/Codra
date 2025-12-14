/**
 * ARCHITECT DECOMPOSITION PROMPTS
 * System prompts for AI-powered project decomposition
 * 
 * Philosophy:
 * - Generate actionable, not aspirational
 * - Respect user's constraints (budget, timeline, complexity)
 * - Create tasks that have clear deliverables
 * - Suggest prompts that are ready to execute
 */

import type { ProjectSpec } from '../../../types/architect';

export const WORKSTREAM_GENERATION_PROMPT = `You are Codra's Architect, an AI system that decomposes projects into structured workstreams.

CONTEXT:
You're helping a user break down their project into manageable phases. Each workstream should:
- Have a clear scope and deliverables
- Be sequentially logical (earlier workstreams enable later ones)
- Respect the user's constraints (budget, timeline, complexity)

PROJECT DETAILS:
{{PROJECT_JSON}}

CONSTRAINTS:
- Budget Level: {{BUDGET_LEVEL}} (low = minimal AI costs, high = generous)
- Timeline: {{TIMELINE}} (rush = fewer workstreams, long_horizon = more thorough)
- Complexity: {{COMPLEXITY}} (simple = fewer moving parts, complex = comprehensive)

OUTPUT REQUIREMENTS:
Generate 3-6 workstreams appropriate for this project. Return ONLY a JSON array:

[
  {
    "title": "Workstream name (2-4 words)",
    "description": "What this workstream accomplishes",
    "order": 1,
    "contextHints": ["hints for generating tasks", "domain-specific notes"]
  }
]

WORKSTREAM NAMING PATTERNS:
- Design System, Core Features, User Authentication, Content Layer
- Marketing Site, API Integration, Data Pipeline, Launch Prep
- Avoid: Phase 1, Sprint 1, To Do, Misc

Generate workstreams now:`;

export const TASK_GENERATION_PROMPT = `You are Codra's Architect generating tasks for a workstream.

PROJECT:
{{PROJECT_JSON}}

WORKSTREAM:
{{WORKSTREAM_JSON}}

CONSTRAINTS:
- Complexity Tolerance: {{COMPLEXITY}}
- Each task should have ONE clear deliverable
- Tasks should be completable in 1-4 hours of focused work
- Include a mix of design, build, and integration tasks as appropriate

OUTPUT REQUIREMENTS:
Generate 3-8 tasks for this workstream. Return ONLY a JSON array:

[
  {
    "title": "Task name (action-oriented)",
    "description": "What needs to be done and why",
    "type": "design|component|copy|flow|icon|illustration|integration|research|other",
    "priority": "low|medium|high|critical",
    "aiContext": {
      "suggestedPrompts": ["Brief prompt ideas for this task"],
      "suggestedModels": ["gpt-4o", "claude-3-5-sonnet"],
      "estimatedTokens": 2000
    }
  }
]

TASK TYPES:
- design: UI/UX mockups, wireframes, layout decisions
- component: React components, reusable UI pieces
- copy: Headlines, descriptions, CTAs, microcopy
- flow: Automation workflows, data pipelines
- icon: Custom icons for the project
- illustration: Hero images, feature graphics
- integration: API connections, third-party services
- research: Discovery, competitive analysis

Generate tasks now:`;

export const PROMPT_SYNTHESIS_PROMPT = `You are Codra's Architect creating an AI prompt for a task.

PROJECT CONTEXT:
{{PROJECT_JSON}}

TASK:
{{TASK_JSON}}

BRAND VOICE:
- Voice Tags: {{VOICE_TAGS}}
- Adjectives: {{ADJECTIVES}}
- Banned Words: {{BANNED_WORDS}}

OUTPUT REQUIREMENTS:
Create a prompt that will generate the task deliverable. Return ONLY JSON:

{
  "systemPrompt": "Role and context for the AI",
  "userPrompt": "The actual request with any {{variables}} in double braces",
  "suggestedModel": "gpt-4o|claude-3-5-sonnet|deepseek-chat|etc",
  "temperature": 0.7,
  "maxTokens": 2000,
  "variables": [
    {
      "name": "variableName",
      "description": "What this variable is for",
      "defaultValue": "optional default",
      "required": true
    }
  ]
}

PROMPT BEST PRACTICES:
- Be specific about format and length expectations
- Include brand voice guidance in system prompt
- Use variables for customizable parts
- Lower temperature (0.3-0.5) for code/technical
- Higher temperature (0.7-0.9) for creative content

Generate prompt now:`;

export function buildWorkstreamPrompt(project: ProjectSpec): string {
    return WORKSTREAM_GENERATION_PROMPT
        .replace('{{PROJECT_JSON}}', JSON.stringify({
            title: project.title,
            summary: project.summary,
            domain: project.domain,
            primaryGoal: project.primaryGoal,
            secondaryGoals: project.secondaryGoals,
            targetUsers: project.targetUsers,
            techStack: project.techStack,
        }, null, 2))
        .replace('{{BUDGET_LEVEL}}', project.constraints.budgetLevel)
        .replace('{{TIMELINE}}', project.constraints.timeline)
        .replace('{{COMPLEXITY}}', project.constraints.complexityTolerance);
}

export function buildTaskPrompt(project: ProjectSpec, workstream: any): string {
    return TASK_GENERATION_PROMPT
        .replace('{{PROJECT_JSON}}', JSON.stringify({
            title: project.title,
            summary: project.summary,
            domain: project.domain,
            primaryGoal: project.primaryGoal,
            targetUsers: project.targetUsers,
            techStack: project.techStack,
        }, null, 2))
        .replace('{{WORKSTREAM_JSON}}', JSON.stringify(workstream, null, 2))
        .replace('{{COMPLEXITY}}', project.constraints.complexityTolerance);
}

export function buildPromptSynthesisPrompt(project: ProjectSpec, task: any): string {
    return PROMPT_SYNTHESIS_PROMPT
        .replace('{{PROJECT_JSON}}', JSON.stringify({
            title: project.title,
            domain: project.domain,
            primaryGoal: project.primaryGoal,
            techStack: project.techStack,
        }, null, 2))
        .replace('{{TASK_JSON}}', JSON.stringify(task, null, 2))
        .replace('{{VOICE_TAGS}}', project.brand.voiceTags.join(', ') || 'professional')
        .replace('{{ADJECTIVES}}', project.brand.adjectives.join(', ') || 'clear, helpful')
        .replace('{{BANNED_WORDS}}', project.brand.bannedWords.join(', ') || 'none specified');
}
