/**
 * SAMPLE PROJECT TEMPLATE
 * Pre-configured project for First-Run Experience onboarding.
 * Provides a quick-win experience with pre-populated context and simple tasks.
 */

import type { ProjectType } from '../onboarding-types';

export interface SampleProjectTemplate {
  name: string;
  type: ProjectType;
  summary: string;
  audience: string;
  context: {
    primaryAudience: string;
    role: string;
    creativeGoals: string[];
    aiFamiliarity: 'beginner' | 'intermediate' | 'advanced';
  };
  brand: {
    voiceGuidelines: string;
    personality: string[];
  };
  tasks: SampleTask[];
}

export interface SampleTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
}

export const SAMPLE_PROJECT: SampleProjectTemplate = {
  name: "My First Creative Project",
  type: "landing-page",
  summary: "A beautiful, modern landing page to showcase your work and attract visitors.",
  audience: "Creative professionals and small business owners",
  context: {
    primaryAudience: "Small business owners looking for an online presence",
    role: "Founder / Solo Creator",
    creativeGoals: ["design-website", "write-copy", "create-brand-identity"],
    aiFamiliarity: "beginner",
  },
  brand: {
    voiceGuidelines: "Friendly, professional, and approachable. Clear and concise language.",
    personality: ["Modern", "Clean", "Trustworthy"],
  },
  tasks: [
    {
      id: "task-hero-headline",
      title: "Write Hero Headline",
      description: "Create a compelling headline that captures attention and communicates your value proposition in under 10 words.",
      estimatedMinutes: 2,
    },
    {
      id: "task-brand-colors",
      title: "Define Brand Colors",
      description: "Choose 3-4 colors that represent your brand personality. Include a primary, secondary, and accent color.",
      estimatedMinutes: 3,
    },
    {
      id: "task-call-to-action",
      title: "Write Call-to-Action",
      description: "Craft an action-oriented button text that tells visitors exactly what to do next.",
      estimatedMinutes: 2,
    },
  ],
};

/**
 * Get estimated total time for all sample tasks
 */
export function getSampleProjectDuration(): number {
  return SAMPLE_PROJECT.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
}
