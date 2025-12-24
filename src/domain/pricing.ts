/**
 * CODRA PRICING DOMAIN
 * Defines the tiered service levels and limits for the platform
 */

export type PricingTier = 'free' | 'starter' | 'pro' | 'agency';

export interface PricingPlan {
  id: PricingTier;
  name: string;
  tagline: string;
  price: number; // USD per month
  yearlyPrice?: number; // USD per year (discounted)
  features: string[];
  limits: {
    projects: number | 'unlimited';
    tasksPerMonth: number | 'unlimited';
    storage: string; // e.g., "10 MB", "1 GB"
    models: string[]; // Available model IDs
    teamSeats?: number;
  };
  cta: string;
  highlighted?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Precision intake for solo exploration',
    price: 0,
    features: [
      '1 active project',
      '25 AI completions / month',
      'Standard model access',
      'Community support',
      'Watermarked exports',
    ],
    limits: {
      projects: 1,
      tasksPerMonth: 25,
      storage: '10 MB',
      models: ['gpt-4o-mini', 'gemini-1.5-flash'],
    },
    cta: 'Start Exploration',
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For the focused creative professional',
    price: 29,
    yearlyPrice: 290, // ~17% discount
    features: [
      '5 active projects',
      '500 AI completions / month',
      'Premium model access (GPT-4o, Claude)',
      'Priority email support',
      'Clean PDF exports',
      'Basic template access',
    ],
    limits: {
      projects: 5,
      tasksPerMonth: 500,
      storage: '1 GB',
      models: ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4o-mini', 'gemini-1.5-pro'],
    },
    cta: 'Select Starter',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'The full editorial studio experience',
    price: 99,
    yearlyPrice: 990,
    features: [
      'Unlimited projects',
      '2,000 AI completions / month',
      'All high-reasoning models',
      'Direct Slack channel support',
      'Advanced JSON/Figma exports',
      'Custom project templates',
      '3 team seats included',
    ],
    limits: {
      projects: 'unlimited',
      tasksPerMonth: 2000,
      storage: '10 GB',
      models: ['*'], // All models
      teamSeats: 3,
    },
    cta: 'Join Pro',
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'High-throughput production for teams',
    price: 299,
    yearlyPrice: 2990,
    features: [
      'Everything in Pro',
      'Unlimited AI completions',
      'White-label workspace access',
      'Client-facing approvals flow',
      '10 team seats included',
      'Custom model fine-tuning',
    ],
    limits: {
      projects: 'unlimited',
      tasksPerMonth: 'unlimited',
      storage: '100 GB',
      models: ['*'],
      teamSeats: 10,
    },
    cta: 'Inquire for Agency',
  },
];
