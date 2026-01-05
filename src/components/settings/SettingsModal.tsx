import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ScopeSelector, type SettingsScope } from './ScopeSelector';
import { AIPreferences, type AIPreferencesValue } from './AIPreferences';
import { BudgetSection } from './BudgetSection';
import { useToast } from '@/new/components/Toast';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useProjectSettings } from '@/lib/smart-defaults/hooks/useProjectSettings';
import { useFlowStore } from '@/lib/store/useFlowStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  taskId?: string;
  defaultScope?: SettingsScope;
  sessionSpend?: number;
  todaySpend?: number;
}

interface SettingsFormState extends AIPreferencesValue {
  dailyLimit: number;
}

const SCOPE_LABELS: Record<SettingsScope, string> = {
  task: 'This Task',
  project: 'This Project',
  global: 'All Projects',
};

export function SettingsModal({
  isOpen,
  onClose,
  projectId,
  taskId,
  defaultScope,
  sessionSpend,
  todaySpend,
}: SettingsModalProps) {
  const toast = useToast();
  const [scope, setScope] = useState<SettingsScope>(defaultScope || (taskId ? 'task' : 'project'));

  const {
    aiDefaults,
    budgetDefaults,
    modelDefaults,
    updateAIDefaults,
    updateBudgetDefaults,
    updateModelDefaults,
  } = useSettingsStore();

  const { getProjectSettings, updateProjectSettings } = useProjectSettings();
  const taskSettings = useFlowStore((state) => (taskId ? state.taskSettings[taskId] : undefined));
  const setTaskSettings = useFlowStore((state) => state.setTaskSettings);

  const projectSettings = projectId ? getProjectSettings(projectId) : undefined;

  const defaultFormState = useMemo<SettingsFormState>(() => ({
    modelId: modelDefaults.modelId,
    providerId: modelDefaults.providerId,
    qualityPriority: aiDefaults.qualityPriority,
    smartMode: aiDefaults.smartMode,
    dailyLimit: budgetDefaults.dailyBudgetLimit,
  }), [aiDefaults, budgetDefaults, modelDefaults]);

  const [formState, setFormState] = useState<SettingsFormState>(defaultFormState);

  useEffect(() => {
    if (!isOpen) return;
    setScope(defaultScope || (taskId ? 'task' : 'project'));
  }, [defaultScope, isOpen, taskId]);

  useEffect(() => {
    if (!isOpen) return;
    if (scope === 'task' && taskSettings) {
      setFormState({
        modelId: taskSettings.model?.modelId || modelDefaults.modelId,
        providerId: taskSettings.model?.providerId || modelDefaults.providerId,
        qualityPriority: taskSettings.ai.qualityPriority ?? aiDefaults.qualityPriority,
        smartMode: taskSettings.ai.smartMode ?? aiDefaults.smartMode,
        dailyLimit: taskSettings.budget.dailyBudgetLimit ?? budgetDefaults.dailyBudgetLimit,
      });
      return;
    }
    if (scope === 'project' && projectSettings) {
      setFormState({
        modelId: projectSettings.modelId || modelDefaults.modelId,
        providerId: projectSettings.providerId || modelDefaults.providerId,
        qualityPriority: projectSettings.qualityPriority ?? aiDefaults.qualityPriority,
        smartMode: projectSettings.smartMode ?? aiDefaults.smartMode,
        dailyLimit: projectSettings.dailyBudget ?? budgetDefaults.dailyBudgetLimit,
      });
      return;
    }
    setFormState(defaultFormState);
  }, [
    scope,
    taskSettings,
    projectSettings,
    aiDefaults,
    budgetDefaults,
    modelDefaults,
    defaultFormState,
    isOpen,
  ]);

  const updateForm = (updates: Partial<SettingsFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    const scopeLabel = SCOPE_LABELS[scope];

    if (scope === 'task') {
      if (!taskId) {
        toast.warning('No task is active to save task settings.');
        return;
      }
      setTaskSettings(taskId, {
        model: { modelId: formState.modelId, providerId: formState.providerId },
        ai: {
          qualityPriority: formState.qualityPriority,
          smartMode: formState.smartMode,
        },
        budget: {
          dailyBudgetLimit: formState.dailyLimit,
        },
      });
    }

    if (scope === 'project') {
      if (!projectId) {
        toast.warning('No project is active to save project settings.');
        return;
      }
      updateProjectSettings(projectId, {
        qualityPriority: formState.qualityPriority ?? undefined,
        dailyBudget: formState.dailyLimit,
        modelId: formState.modelId,
        providerId: formState.providerId,
        smartMode: formState.smartMode,
      });
    }

    if (scope === 'global') {
      updateAIDefaults({
        qualityPriority: formState.qualityPriority,
        smartMode: formState.smartMode,
      });
      updateBudgetDefaults({ dailyBudgetLimit: formState.dailyLimit });
      updateModelDefaults({ modelId: formState.modelId, providerId: formState.providerId });
    }

    localStorage.setItem('codra-settings-changed', 'true'); // Track for onboarding checklist
    toast.success(`Settings saved to ${scopeLabel}.`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-zinc-950/30"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          className="w-full max-w-3xl rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Settings</h2>
              <p className="text-xs text-text-soft mt-1">Choose a scope to control where changes apply.</p>
            </div>
            <div className="flex items-center gap-3">
              <ScopeSelector value={scope} onChange={setScope} />
              <Button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={16} className="text-zinc-500" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <SectionHeader title="AI Preferences" meta="Model selection and quality priorities." className="mt-0" />
              <AIPreferences
                value={{
                  modelId: formState.modelId,
                  providerId: formState.providerId,
                  qualityPriority: formState.qualityPriority,
                  smartMode: formState.smartMode,
                }}
                onChange={updateForm}
              />
            </section>

            <section>
              <SectionHeader title="Budget & Spending" meta="Adjust daily limits and review usage." />
              <BudgetSection
                dailyLimit={formState.dailyLimit}
                onChange={(updates) => updateForm({ dailyLimit: updates.dailyLimit })}
                sessionSpend={sessionSpend}
                todaySpend={todaySpend}
              />
            </section>

            <section>
              <SectionHeader title="Integrations" meta="Connected tools for this workspace." />
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-text-soft">
                Connect GitHub, deploy targets, and design tools from the Integrations panel.
              </div>
            </section>
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-white">
            <p className="text-xs text-text-soft">Saving to {SCOPE_LABELS[scope]}.</p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose} className="text-sm font-semibold">
                Cancel
              </Button>
              <Button onClick={handleSave} className="px-4 py-2 text-sm font-semibold">
                Save to {SCOPE_LABELS[scope]}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
