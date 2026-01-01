/**
 * ANALYTICS EVENT TYPES
 * Centralized registry of all tracking events to ensure type safety.
 */

export type AnalyticsEvent = 
  | OnboardingEvent 
  | FlowEvent 
  | DeskEvent
  | MarketingEvent
  | MonetizationEvent
  | BlueprintEvent
  | CatchAllEvent;

// ONBOARDING EVENTS
export type OnboardingEvent = 
  | { name: 'onboarding_step_viewed'; properties: OnboardingStepProperties }
  | { name: 'onboarding_step_completed'; properties: OnboardingStepCompletionProperties }
  | { name: 'onboarding_step_skipped'; properties: OnboardingStepProperties }
  | { name: 'onboarding_completed'; properties: OnboardingSessionProperties }
  | { name: 'first_spread_generated'; properties: GenerationProperties };

export interface OnboardingStepProperties {
  step: number;
  stepName: string;
}

export interface OnboardingStepCompletionProperties extends OnboardingStepProperties {
  durationMs: number;
  projectType?: string;
  hasDescription?: boolean;
  fileCount?: number;
  fileTypes?: string[];
}

export interface OnboardingSessionProperties {
  totalSteps: number;
  totalDurationMs: number;
}

export interface GenerationProperties {
  spreadId: string;
  durationFromStartMs: number;
  projectType: string;
}

// CORE FLOW EVENTS
export type FlowEvent = 
  | { name: 'flow_task_began'; properties: TaskProperties }
  | { name: 'flow_task_completed'; properties: TaskCompletionProperties }
  | { name: 'flow_task_failed'; properties: TaskErrorProperties }
  | { name: 'flow_export_began'; properties: ExportProperties }
  | { name: 'flow_export_completed'; properties: ExportCompletionProperties }
  | { name: 'flow_export_failed'; properties: ExportErrorProperties }
  | { name: 'flow_task_overrides_applied'; properties: { taskId: string, taskType: string, deskId: string, remember: boolean } }
  | { name: 'flow_task_rerun_triggered'; properties: { taskId: string, taskType: string, deskId: string } };

export interface TaskProperties {
  taskId: string;
  taskType: string;
  deskId: string;
}

export interface TaskCompletionProperties extends TaskProperties {
  durationMs: number;
  modelUsed: string;
  cost: number;
}

export interface TaskErrorProperties extends TaskProperties {
  error: string;
  durationMs: number;
}

export interface ExportProperties {
  outputId: string;
  outputType: string;
}

export interface ExportCompletionProperties extends ExportProperties {
  format: string;
  durationMs: number;
  isDefaultFormat: boolean;
}

export interface ExportErrorProperties extends ExportProperties {
  format: string;
  error: string;
}

// DESK EVENTS
export type DeskEvent = 
  | { name: 'desk_switched'; properties: DeskSwitchProperties };

export interface DeskSwitchProperties {
  fromDesk: string;
  toDesk: string;
  method: 'click' | 'keyboard';
}

// MARKETING & TEARSHEET EVENTS
export type MarketingEvent =
  | { name: 'tearsheet_export_pdf'; properties: { projectId: string } }
  | { name: 'tearsheet_share_link'; properties: { projectId: string } }
  | { name: 'project_context_validation_failed'; properties: { projectId: string, errors: string[] } }
  | { name: 'pricing_page_viewed'; properties?: Record<string, unknown> };

// MONETIZATION EVENTS
export type MonetizationEvent =
  | { name: 'plan_cta_clicked'; properties: { planId: string, billingCycle: string } };

// BLUEPRINT EVENTS
export type BlueprintEvent =
  | { name: 'blueprint_selected'; properties: { blueprintId: string } };

// CATCH-ALL FOR UNTYPED OR LEGACY EVENTS
export type CatchAllEvent = {
  name: string;
  properties?: Record<string, any>;
};
