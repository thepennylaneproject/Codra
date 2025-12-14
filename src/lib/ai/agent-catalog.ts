/**
 * Agent Framework Catalog
 * Comprehensive catalog of agent frameworks available via AIMLAPI integrations
 * Source: https://docs.aimlapi.com/integrations/our-integration-list
 */

import { AgentFramework, TaskCategory } from './types-agent-selector';

/**
 * Complete catalog of agent frameworks from AIMLAPI
 * 18+ frameworks covering code assistance, autonomous workflows, and more
 */
export const AGENT_FRAMEWORKS: Record<string, AgentFramework> = {
    autogpt: {
        id: 'autogpt',
        name: 'AutoGPT',
        description: 'Autonomous platform with no-code visual interface for building AI agents',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS, TaskCategory.RESEARCH],
        recommendedModels: ['gpt-4o', 'gpt-4-turbo', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/autogpt',
        isIntegrationOnly: true,
        tags: ['autonomous', 'no-code', 'visual', 'planning']
    },

    cline: {
        id: 'cline',
        name: 'Cline',
        description: 'AI coding assistant with Plan/Act modes and terminal execution in VS Code',
        taskCategories: [TaskCategory.CODE_ASSISTANCE],
        recommendedModels: ['deepseek-coder', 'gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/cline',
        isIntegrationOnly: true,
        tags: ['vscode', 'coding', 'terminal', 'mcp']
    },

    cursor: {
        id: 'cursor',
        name: 'Cursor',
        description: 'Advanced AI-powered IDE with intelligent code completion',
        taskCategories: [TaskCategory.CODE_ASSISTANCE],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/cursor',
        isIntegrationOnly: true,
        tags: ['ide', 'coding', 'completion', 'editing']
    },

    agno: {
        id: 'agno',
        name: 'Agno',
        description: 'Lightweight library for building agents with tools, memory, and reasoning',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS, TaskCategory.CODE_ASSISTANCE],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro'],
        docsUrl: 'https://docs.aimlapi.com/integrations/agno',
        isIntegrationOnly: true,
        tags: ['agents', 'tools', 'memory', 'lightweight']
    },

    aider: {
        id: 'aider',
        name: 'Aider',
        description: 'Command-line pair programming tool with auto-commit and collaborative editing',
        taskCategories: [TaskCategory.CODE_ASSISTANCE],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet', 'deepseek-coder'],
        docsUrl: 'https://docs.aimlapi.com/integrations/aider',
        isIntegrationOnly: true,
        tags: ['cli', 'coding', 'git', 'pair-programming']
    },

    continue: {
        id: 'continue',
        name: 'Continue.dev',
        description: 'Open-source IDE extension for custom AI code assistants',
        taskCategories: [TaskCategory.CODE_ASSISTANCE],
        recommendedModels: ['gpt-4o', 'deepseek-coder', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/continue.dev',
        isIntegrationOnly: true,
        tags: ['ide', 'extension', 'customizable', 'rules']
    },

    elizaos: {
        id: 'elizaos',
        name: 'ElizaOS',
        description: 'Multi-agent simulation framework for autonomous AI agents',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/elizaos',
        isIntegrationOnly: true,
        tags: ['multi-agent', 'simulation', 'typescript', 'personas']
    },

    gptresearcher: {
        id: 'gptresearcher',
        name: 'GPT Researcher',
        description: 'Autonomous research agent for web scraping and aggregation',
        taskCategories: [TaskCategory.RESEARCH, TaskCategory.DATA_ANALYSIS],
        recommendedModels: ['gpt-4o', 'gpt-4-turbo'],
        docsUrl: 'https://docs.aimlapi.com/integrations/gpt-researcher-gptr',
        isIntegrationOnly: true,
        tags: ['research', 'web-scraping', 'autonomous', 'aggregation']
    },

    kilocode: {
        id: 'kilocode',
        name: 'Kilo Code',
        description: 'AI coding assistant with customizable modes and MCP integration',
        taskCategories: [TaskCategory.CODE_ASSISTANCE],
        recommendedModels: ['gpt-4o', 'deepseek-coder', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/kilo-code',
        isIntegrationOnly: true,
        tags: ['vscode', 'coding', 'modes', 'mcp', 'customizable']
    },

    langflow: {
        id: 'langflow',
        name: 'Langflow',
        description: 'Visual framework for building multi-agent and RAG applications',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS, TaskCategory.DATA_ANALYSIS],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro'],
        docsUrl: 'https://docs.aimlapi.com/integrations/langflow',
        isIntegrationOnly: true,
        tags: ['visual', 'rag', 'multi-agent', 'python', 'no-code']
    },

    litellm: {
        id: 'litellm',
        name: 'LiteLLM',
        description: 'Unified API for multiple LLM providers with easy switching',
        taskCategories: [TaskCategory.GENERAL_PURPOSE],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro'],
        docsUrl: 'https://docs.aimlapi.com/integrations/litellm',
        isIntegrationOnly: true,
        tags: ['python', 'unified-api', 'multi-provider', 'sdk']
    },

    make: {
        id: 'make',
        name: 'Make',
        description: 'Enterprise automation platform with AI agents and webhooks',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS, TaskCategory.DATA_ANALYSIS],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/make',
        isIntegrationOnly: true,
        tags: ['automation', 'enterprise', 'workflows', 'webhooks']
    },

    marvin: {
        id: 'marvin',
        name: 'Marvin',
        description: 'Python framework for agentic AI workflows with structured outputs',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS, TaskCategory.DATA_ANALYSIS],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/marvin',
        isIntegrationOnly: true,
        tags: ['python', 'workflows', 'structured', 'pydantic']
    },

    n8n: {
        id: 'n8n',
        name: 'n8n',
        description: 'Open-source workflow automation tool for service integration',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS, TaskCategory.DATA_ANALYSIS],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/n8n',
        isIntegrationOnly: true,
        tags: ['automation', 'open-source', 'workflows', 'integration']
    },

    roocode: {
        id: 'roocode',
        name: 'Roo Code',
        description: 'Autonomous AI programming agent working inside your editor',
        taskCategories: [TaskCategory.CODE_ASSISTANCE],
        recommendedModels: ['gpt-4o', 'deepseek-coder', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/roo-code',
        isIntegrationOnly: true,
        tags: ['vscode', 'autonomous', 'coding', 'editor']
    },

    sillytavern: {
        id: 'sillytavern',
        name: 'SillyTavern',
        description: 'Local UI for text generation LLMs and image generation',
        taskCategories: [TaskCategory.CONTENT_GENERATION, TaskCategory.GENERAL_PURPOSE],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/sillytavern',
        isIntegrationOnly: true,
        tags: ['ui', 'local', 'text-generation', 'creative']
    },

    toolhouse: {
        id: 'toolhouse',
        name: 'Toolhouse',
        description: 'Backend-as-a-Service for building and managing AI agents',
        taskCategories: [TaskCategory.AUTONOMOUS_WORKFLOWS],
        recommendedModels: ['gpt-4o', 'claude-3-5-sonnet'],
        docsUrl: 'https://docs.aimlapi.com/integrations/toolhouse',
        isIntegrationOnly: true,
        tags: ['baas', 'agents', 'production', 'management']
    }
};

/**
 * Get agent frameworks filtered by task category
 */
export function getAgentFrameworksByTask(taskCategory: TaskCategory): AgentFramework[] {
    return Object.values(AGENT_FRAMEWORKS)
        .filter(agent => agent.taskCategories.includes(taskCategory))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get agent framework by ID
 */
export function getAgentFramework(id: string): AgentFramework | undefined {
    return AGENT_FRAMEWORKS[id];
}

/**
 * Get all agent frameworks
 */
export function getAllAgentFrameworks(): AgentFramework[] {
    return Object.values(AGENT_FRAMEWORKS)
        .sort((a, b) => a.name.localeCompare(b.name));
}
