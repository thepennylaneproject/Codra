import { ProjectType, CreativeGoal } from './onboarding-types';
import { ProductionDeskId } from './types';

export interface ProjectBlueprint {
    id: string;
    name: string;
    description: string;
    type: ProjectType;
    goals: CreativeGoal[];
    desks: ProductionDeskId[];
    category: 'Marketing' | 'Branding' | 'Product' | 'Strategy';
    previewImage?: string;
    difficulty: 'Entry' | 'Intermediate' | 'Advanced';
}

export const PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
    {
        id: 'product-launch-kit',
        name: 'Product Launch Kit',
        description: 'A comprehensive branding and marketing system for new product rollouts.',
        type: 'marketing-site',
        goals: ['brand-identity', 'marketing-campaign', 'social-content'],
        desks: ['art-design', 'writing', 'marketing'],
        category: 'Marketing',
        difficulty: 'Intermediate'
    },
    {
        id: 'pitch-deck-studio',
        name: 'Pitch Deck Studio',
        description: 'Focused investor materials and executive summaries for pre-seed and seed rounds.',
        type: 'other',
        goals: ['pitch-deck', 'print-materials'],
        desks: ['writing', 'art-design'],
        category: 'Strategy',
        difficulty: 'Entry'
    },
    {
        id: 'saas-brand-system',
        name: 'SaaS Brand System',
        description: 'Scalable visual identity and core UI components for software products.',
        type: 'web-app',
        goals: ['brand-identity', 'website-app'],
        desks: ['art-design', 'engineering'],
        category: 'Branding',
        difficulty: 'Advanced'
    },
    {
        id: 'ecommerce-campaign',
        name: 'E-commerce Campaign',
        description: 'Social-first ad creatives and landing page optimization for retail brands.',
        type: 'marketing-site',
        goals: ['social-content', 'marketing-campaign'],
        desks: ['art-design', 'writing'],
        category: 'Marketing',
        difficulty: 'Intermediate'
    },
    {
        id: 'corporate-narrative',
        name: 'Corporate Narrative',
        description: 'Whitepapers, case studies, and leadership positioning for B2B enterprises.',
        type: 'other',
        goals: ['print-materials', 'pitch-deck'],
        desks: ['writing', 'marketing'],
        category: 'Strategy',
        difficulty: 'Intermediate'
    }
];
