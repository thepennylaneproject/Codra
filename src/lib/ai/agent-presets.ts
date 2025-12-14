/**
 * Agent Presets
 * Curated combinations of tasks, agents, and models for common use cases
 */

import { AgentPreset, TaskCategory, CostTier, LatencyTier } from './types-agent-selector';

/**
 * Recommended presets for quick selection
 * Each preset represents a battle-tested combination
 */
export const AGENT_PRESETS: AgentPreset[] = [
    // CODE ASSISTANCE presets
    {
        id: 'fast-code-completion',
        name: 'Fast Code Completion',
        description: 'Lightning-fast suggestions for coding tasks',
        taskCategory: TaskCategory.CODE_ASSISTANCE,
        modelId: 'deepseek-coder',
        reasoning: 'DeepSeek Coder is optimized for speed and code understanding, perfect for inline completions',
        estimatedCostTier: CostTier.LOW,
        estimatedLatencyTier: LatencyTier.FAST,
        icon: '⚡'
    },
    {
        id: 'premium-code-assistant',
        name: 'Premium Code Assistant',
        description: 'Highest quality code generation and debugging',
        taskCategory: TaskCategory.CODE_ASSISTANCE,
        agentFramework: 'cline',
        modelId: 'gpt-4o',
        reasoning: 'Cline + GPT-4o provides advanced reasoning for complex coding tasks with Plan/Act modes',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '🎯'
    },
    {
        id: 'cursor-claude',
        name: 'Cursor + Claude',
        description: 'Intelligent IDE with long-context analysis',
        taskCategory: TaskCategory.CODE_ASSISTANCE,
        agentFramework: 'cursor',
        modelId: 'claude-3-5-sonnet',
        reasoning: 'Cursor paired with Claude 3.5 Sonnet for detailed code analysis and refactoring',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '🔍'
    },

    // AUTONOMOUS WORKFLOWS presets
    {
        id: 'autonomous-planner',
        name: 'Autonomous Planning Agent',
        description: 'Multi-step complex task execution with memory',
        taskCategory: TaskCategory.AUTONOMOUS_WORKFLOWS,
        agentFramework: 'autogpt',
        modelId: 'gpt-4o',
        reasoning: 'AutoGPT + GPT-4o provides robust autonomous planning with visual interface',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '🤖'
    },
    {
        id: 'workflow-automation',
        name: 'Workflow Automation',
        description: 'Enterprise-grade automation and orchestration',
        taskCategory: TaskCategory.AUTONOMOUS_WORKFLOWS,
        agentFramework: 'n8n',
        modelId: 'claude-3-5-sonnet',
        reasoning: 'n8n workflow automation with Claude for complex decision-making',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '🔄'
    },
    {
        id: 'multi-agent-system',
        name: 'Multi-Agent System',
        description: 'Coordinated AI agents for complex simulations',
        taskCategory: TaskCategory.AUTONOMOUS_WORKFLOWS,
        agentFramework: 'elizaos',
        modelId: 'gpt-4o',
        reasoning: 'ElizaOS framework for multi-agent coordination with GPT-4o intelligence',
        estimatedCostTier: CostTier.HIGH,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '👥'
    },

    // RESEARCH presets
    {
        id: 'web-researcher',
        name: 'Web Research Agent',
        description: 'Autonomous web scraping and aggregation',
        taskCategory: TaskCategory.RESEARCH,
        agentFramework: 'gptresearcher',
        modelId: 'gpt-4o',
        reasoning: 'GPT Researcher autonomously gathers and synthesizes information from 20+ sources',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.SLOW,
        icon: '🔬'
    },
    {
        id: 'fast-research',
        name: 'Fast Research & Analysis',
        description: 'Quick information gathering and synthesis',
        taskCategory: TaskCategory.RESEARCH,
        modelId: 'gemini-pro',
        reasoning: 'Gemini Pro with Google Search integration for rapid research',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.FAST,
        icon: '🚀'
    },

    // CONTENT GENERATION presets
    {
        id: 'creative-writer',
        name: 'Creative Writing',
        description: 'Nuanced, long-form content generation',
        taskCategory: TaskCategory.CONTENT_GENERATION,
        modelId: 'claude-3-5-sonnet',
        reasoning: 'Claude excels at nuanced, detailed writing with 200K context window',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '✍️'
    },
    {
        id: 'quick-content',
        name: 'Quick Content Generation',
        description: 'Fast summaries and simple content',
        taskCategory: TaskCategory.CONTENT_GENERATION,
        modelId: 'gpt-3.5-turbo',
        reasoning: 'GPT-3.5 Turbo offers fast, cost-effective content for simple tasks',
        estimatedCostTier: CostTier.LOW,
        estimatedLatencyTier: LatencyTier.FAST,
        icon: '⚡'
    },

    // DATA ANALYSIS presets
    {
        id: 'data-analyst',
        name: 'Data Analysis',
        description: 'Complex data processing and insights',
        taskCategory: TaskCategory.DATA_ANALYSIS,
        agentFramework: 'langflow',
        modelId: 'claude-3-5-sonnet',
        reasoning: 'Langflow + Claude for visual data pipelines and detailed analysis',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '📊'
    },
    {
        id: 'structured-extraction',
        name: 'Structured Data Extraction',
        description: 'Extract structured data with type safety',
        taskCategory: TaskCategory.DATA_ANALYSIS,
        agentFramework: 'marvin',
        modelId: 'gpt-4o',
        reasoning: 'Marvin framework for type-safe structured outputs with Pydantic',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '📋'
    },

    // GENERAL PURPOSE presets
    {
        id: 'balanced-assistant',
        name: 'Balanced Assistant',
        description: 'Good balance of quality and cost',
        taskCategory: TaskCategory.GENERAL_PURPOSE,
        modelId: 'gpt-4o',
        reasoning: 'GPT-4o is versatile and handles most tasks well',
        estimatedCostTier: CostTier.MEDIUM,
        estimatedLatencyTier: LatencyTier.MEDIUM,
        icon: '⚖️'
    },
    {
        id: 'budget-friendly',
        name: 'Budget-Friendly',
        description: 'Cost-effective for high-volume tasks',
        taskCategory: TaskCategory.GENERAL_PURPOSE,
        modelId: 'gpt-3.5-turbo',
        reasoning: 'GPT-3.5 Turbo offers the best price-performance for simple tasks',
        estimatedCostTier: CostTier.LOW,
        estimatedLatencyTier: LatencyTier.FAST,
        icon: '💰'
    }
];

/**
 * Get presets for a specific task category
 */
export function getPresetsForTask(taskCategory: TaskCategory): AgentPreset[] {
    return AGENT_PRESETS.filter(preset => preset.taskCategory === taskCategory);
}

/**
 * Get preset by ID
 */
export function getPreset(id: string): AgentPreset | undefined {
    return AGENT_PRESETS.find(preset => preset.id === id);
}

/**
 * Get all presets
 */
export function getAllPresets(): AgentPreset[] {
    return AGENT_PRESETS;
}

/**
 * Get recommended preset for a task category
 * Returns the most balanced preset (medium cost, medium latency)
 */
export function getRecommendedPreset(taskCategory: TaskCategory): AgentPreset | undefined {
    const presets = getPresetsForTask(taskCategory);

    // Prefer medium cost/latency presets
    const balanced = presets.find(
        p => p.estimatedCostTier === CostTier.MEDIUM && p.estimatedLatencyTier === LatencyTier.MEDIUM
    );

    return balanced || presets[0];
}
