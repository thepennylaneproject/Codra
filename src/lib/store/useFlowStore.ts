/**
 * FLOW STORE
 * Zustand store for managing the editorial flow state.
 * Handles active desk, active section, and layout preferences.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ProjectToolId } from '../../domain/types';
import type { AIPreferencesData } from '../../domain/types';
import type { BudgetPreferencesData } from '../../domain/onboarding-types';

import { SmartRouterResult, SmartRouterQuality } from '../ai/router/smart-router';

interface LayoutState {
    leftDockVisible: boolean;
    leftDockWidth: number;
    rightDockVisible: boolean;
    rightDockWidth: number;
    showActivityStrip: boolean;
}

interface RoutingPreferences {
    quality: SmartRouterQuality;
    maxCostPerTask: number | null;
    allowedProviders: string[];
}

interface InteractionEvent {
    id: string;
    timestamp: string;
    type: 'desk_switch' | 'section_focus' | 'prompt_sent' | 'artifact_created' | 'routing_change';
    metadata: Record<string, any>;
}

interface TaskScopedSettings {
    ai: Partial<AIPreferencesData>;
    budget: Partial<BudgetPreferencesData>;
    model?: {
        modelId: string;
        providerId: string;
    };
}

interface FlowState {
    // Current Context
    activeDeskId: ProjectToolId | null;
    activeSectionId: string | null;
    studioEnabled: boolean;

    // UI Layout
    layout: LayoutState;

    // Routing
    routingPreferences: RoutingPreferences;
    lastRoutingDecision: SmartRouterResult | null;
    sessionCost: number;

    // Task Settings
    taskSettings: Record<string, TaskScopedSettings>;

    // History
    history: InteractionEvent[];

    // Actions
    setActiveDesk: (deskId: ProjectToolId | null) => void;
    setActiveSection: (sectionId: string | null) => void;
    setStudioEnabled: (enabled: boolean) => void;

    updateLayout: (updates: Partial<LayoutState>) => void;
    toggleDock: (side: 'left' | 'right') => void;

    updateRoutingPreferences: (updates: Partial<RoutingPreferences>) => void;
    setLastRoutingDecision: (decision: SmartRouterResult | null) => void;
    addToSessionCost: (amount: number) => void;

    setTaskSettings: (taskId: string, updates: Partial<TaskScopedSettings>) => void;

    pushHistory: (event: Omit<InteractionEvent, 'id' | 'timestamp'>) => void;
    clearHistory: () => void;

    reset: () => void;
}

const DEFAULT_LAYOUT: LayoutState = {
    leftDockVisible: true,
    leftDockWidth: 320,
    rightDockVisible: false,
    rightDockWidth: 400,
    showActivityStrip: true,
};

const DEFAULT_ROUTING: RoutingPreferences = {
    quality: 'balanced',
    maxCostPerTask: null,
    allowedProviders: [],
};

export const useFlowStore = create<FlowState>()(
    persist(
        immer((set) => ({
            // Initial State
            activeDeskId: null,
            activeSectionId: null,
            studioEnabled: false,
            layout: { ...DEFAULT_LAYOUT },
            routingPreferences: { ...DEFAULT_ROUTING },
            lastRoutingDecision: null,
            sessionCost: 0,
            taskSettings: {},
            history: [],

            // Context Actions
            setActiveDesk: (deskId) => {
                set((state) => {
                    state.activeDeskId = deskId;
                    if (deskId) {
                        state.history.push({
                            id: crypto.randomUUID(),
                            timestamp: new Date().toISOString(),
                            type: 'desk_switch',
                            metadata: { deskId },
                        });
                    }
                });
            },

            setActiveSection: (sectionId) => {
                set((state) => {
                    state.activeSectionId = sectionId;
                    if (sectionId) {
                        state.history.push({
                            id: crypto.randomUUID(),
                            timestamp: new Date().toISOString(),
                            type: 'section_focus',
                            metadata: { sectionId },
                        });
                    }
                });
            },

            setStudioEnabled: (enabled) => {
                set((state) => {
                    state.studioEnabled = enabled;
                });
            },

            // Layout Actions
            updateLayout: (updates) => {
                set((state) => {
                    state.layout = { ...state.layout, ...updates };
                });
            },

            toggleDock: (side) => {
                set((state) => {
                    if (side === 'left') {
                        state.layout.leftDockVisible = !state.layout.leftDockVisible;
                    } else {
                        state.layout.rightDockVisible = !state.layout.rightDockVisible;
                    }
                });
            },

            // Routing Actions
            updateRoutingPreferences: (updates) => {
                set((state) => {
                    state.routingPreferences = { ...state.routingPreferences, ...updates };
                    state.history.push({
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        type: 'routing_change',
                        metadata: { updates },
                    });
                });
            },

            setLastRoutingDecision: (decision) => {
                set((state) => {
                    state.lastRoutingDecision = decision;
                });
            },

            addToSessionCost: (amount) => {
                set((state) => {
                    state.sessionCost += amount;
                });
            },

            setTaskSettings: (taskId, updates) => {
                set((state) => {
                    const existing = state.taskSettings[taskId] || { ai: {}, budget: {} };
                    state.taskSettings[taskId] = {
                        ...existing,
                        ...updates,
                        ai: { ...existing.ai, ...(updates.ai || {}) },
                        budget: { ...existing.budget, ...(updates.budget || {}) },
                        model: updates.model ?? existing.model,
                    };
                });
            },

            // History Actions
            pushHistory: (event) => {
                set((state) => {
                    state.history.push({
                        ...event,
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                    });
                    // Keep history to last 50 events
                    if (state.history.length > 50) {
                        state.history.shift();
                    }
                });
            },

            clearHistory: () => {
                set((state) => {
                    state.history = [];
                });
            },

            reset: () => {
                set((state) => {
                    state.activeDeskId = null;
                    state.activeSectionId = null;
                    state.studioEnabled = false;
                    state.layout = { ...DEFAULT_LAYOUT };
                    state.routingPreferences = { ...DEFAULT_ROUTING };
                    state.lastRoutingDecision = null;
                    state.sessionCost = 0;
                    state.history = [];
                });
            },
        })),
        {
            name: 'codra-flow-store',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
