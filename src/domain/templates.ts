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
    
    // Pre-filled content for faster starts
    defaultBrief?: {
        audience: string;
        goals: string[];
        boundaries: string[];
    };
    
    // Suggested moodboard seeds
    moodboardSeeds?: string[];
    
    // Pre-generated task suggestions
    starterTasks?: string[];
}

export const PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
    {
        id: 'portfolio-site',
        name: 'Portfolio Website',
        description: 'Personal showcase for creatives, developers, and designers.',
        type: 'landing-page',
        goals: ['website-app', 'brand-identity'],
        desks: ['art-design', 'engineering', 'writing'],
        category: 'Product',
        difficulty: 'Entry',
        defaultBrief: {
            audience: 'Potential employers and clients',
            goals: ['Showcase work', 'Generate leads', 'Establish credibility'],
            boundaries: ['Keep it professional', 'Mobile-first design']
        },
        starterTasks: ['Design hero section', 'Write project descriptions', 'Create responsive layout']
    },
    {
        id: 'landing-page',
        name: 'Landing Page Builder',
        description: 'High-conversion single page for product launches or lead gen.',
        type: 'marketing-site',
        goals: ['marketing-campaign', 'website-app'],
        desks: ['art-design', 'writing', 'engineering'],
        category: 'Marketing',
        difficulty: 'Entry',
        defaultBrief: {
            audience: 'Target customers ready to convert',
            goals: ['Drive signups', 'Communicate value prop', 'Build trust'],
            boundaries: ['Fast load times', 'Clear CTA hierarchy']
        },
        starterTasks: ['Write headline copy', 'Design above-the-fold', 'Create social proof section']
    },
    {
        id: 'brand-refresh',
        name: 'Brand Refresh Kit',
        description: 'Modernize an existing brand with updated visuals and messaging.',
        type: 'other',
        goals: ['brand-identity', 'print-materials'],
        desks: ['art-design', 'writing'],
        category: 'Branding',
        difficulty: 'Intermediate',
        defaultBrief: {
            audience: 'Existing customers and new markets',
            goals: ['Update visual identity', 'Maintain brand recognition', 'Expand appeal'],
            boundaries: ['Respect brand heritage', 'Phased rollout']
        },
        starterTasks: ['Audit current brand assets', 'Design new color palette', 'Update typography']
    },
    {
        id: 'product-launch-kit',
        name: 'Product Launch Kit',
        description: 'A comprehensive branding and marketing system for new product rollouts.',
        type: 'marketing-site',
        goals: ['brand-identity', 'marketing-campaign', 'social-content'],
        desks: ['art-design', 'writing', 'marketing'],
        category: 'Marketing',
        difficulty: 'Intermediate',
        defaultBrief: {
            audience: 'Early adopters and target market',
            goals: ['Generate buzz', 'Drive pre-orders', 'Establish positioning'],
            boundaries: ['Launch timeline constraints', 'Budget-conscious']
        }
    },
    {
        id: 'pitch-deck-studio',
        name: 'Pitch Deck Studio',
        description: 'Focused investor materials and executive summaries for pre-seed and seed rounds.',
        type: 'other',
        goals: ['pitch-deck', 'print-materials'],
        desks: ['writing', 'art-design'],
        category: 'Strategy',
        difficulty: 'Entry',
        defaultBrief: {
            audience: 'Investors and advisors',
            goals: ['Secure funding', 'Tell compelling story', 'Demonstrate traction'],
            boundaries: ['10-15 slides max', 'Data-driven claims']
        }
    },
    {
        id: 'saas-brand-system',
        name: 'SaaS Brand System',
        description: 'Scalable visual identity and core UI components for software products.',
        type: 'web-app',
        goals: ['brand-identity', 'website-app'],
        desks: ['art-design', 'engineering'],
        category: 'Branding',
        difficulty: 'Advanced',
        defaultBrief: {
            audience: 'Business users and developers',
            goals: ['Create cohesive design system', 'Enable rapid development', 'Establish premium feel'],
            boundaries: ['Accessibility compliance', 'Cross-platform consistency']
        }
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
