/**
 * Task Category Data
 * Display information for task categories
 */

import { TaskCategory, TaskCategoryInfo } from '../../lib/ai/types-agent-selector';

/**
 * Task category display information with icons and colors
 */
export const TASK_CATEGORIES: TaskCategoryInfo[] = [
    {
        id: TaskCategory.CODE_ASSISTANCE,
        name: 'Code Assistance',
        description: 'Code completion, debugging, and refactoring',
        icon: '💻',
        color: '#00D9D9' // brand-teal
    },
    {
        id: TaskCategory.AUTONOMOUS_WORKFLOWS,
        name: 'Autonomous Workflows',
        description: 'Complex multi-step planning and execution',
        icon: '🤖',
        color: '#D81159' // brand-magenta
    },
    {
        id: TaskCategory.CONTENT_GENERATION,
        name: 'Content Generation',
        description: 'Writing, documentation, and creative tasks',
        icon: '✍️',
        color: '#F4D03F' // brand-gold
    },
    {
        id: TaskCategory.DATA_ANALYSIS,
        name: 'Data Analysis',
        description: 'Processing, summarizing, and extracting insights',
        icon: '📊',
        color: '#10B981' // state-success
    },
    {
        id: TaskCategory.RESEARCH,
        name: 'Research & Learning',
        description: 'Web research and knowledge synthesis',
        icon: '🔬',
        color: '#00D9D9' // brand-teal
    },
    {
        id: TaskCategory.GENERAL_PURPOSE,
        name: 'General Purpose',
        description: 'Flexible raw model access for any task',
        icon: '⚡',
        color: '#A8B0BB' // text-muted
    }
];

/**
 * Get task category info by ID
 */
export function getTaskCategoryInfo(id: TaskCategory): TaskCategoryInfo | undefined {
    return TASK_CATEGORIES.find(cat => cat.id === id);
}
