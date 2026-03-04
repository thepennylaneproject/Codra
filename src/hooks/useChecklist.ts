import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'codra-checklist-progress';
const DISMISSED_KEY = 'codra-checklist-dismissed';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  action?: () => void;
}

interface ChecklistProgress {
  createProject: boolean;
  addContext: boolean;
  runGeneration: boolean;
  exportArtifact: boolean;
  tryStudio: boolean;
  adjustSettings: boolean;
}

const DEFAULT_PROGRESS: ChecklistProgress = {
  createProject: false,
  addContext: false,
  runGeneration: false,
  exportArtifact: false,
  tryStudio: false,
  adjustSettings: false,
};

export function useChecklist(projectId?: string) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ChecklistProgress>(DEFAULT_PROGRESS);
  const [dismissed, setDismissed] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress({ ...DEFAULT_PROGRESS, ...JSON.parse(stored) });
      }

      const dismissedStored = localStorage.getItem(DISMISSED_KEY);
      if (dismissedStored === 'true') {
        setDismissed(true);
      }
    } catch (err) {
      console.error('Failed to load checklist progress:', err);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.error('Failed to save checklist progress:', err);
    }
  }, [progress]);

  // Auto-detect project creation
  useEffect(() => {
    if (progress.createProject) return;

    try {
      const projectsData = localStorage.getItem('codra-project-store');
      if (projectsData) {
        const parsed = JSON.parse(projectsData);
        const projectCount = parsed?.state?.projects?.length || 0;
        if (projectCount > 0) {
          setProgress(prev => ({ ...prev, createProject: true }));
        }
      }
    } catch (err) {
      console.error('Failed to check project creation:', err);
    }
  }, [progress.createProject]);

  // Auto-detect context updates
  useEffect(() => {
    if (progress.addContext || !projectId) return;

    const checkContextUpdate = () => {
      try {
        const contextKey = `codra:context:${projectId}`;
        const contextData = localStorage.getItem(contextKey);
        if (contextData) {
          const parsed = JSON.parse(contextData);
          // Check if context has meaningful data (not just default empty values)
          if (parsed?.audience?.primary || parsed?.brand || parsed?.success) {
            setProgress(prev => ({ ...prev, addContext: true }));
          }
        }
      } catch (err) {
        console.error('Failed to check context update:', err);
      }
    };

    checkContextUpdate();
    const interval = setInterval(checkContextUpdate, 2000);
    return () => clearInterval(interval);
  }, [progress.addContext, projectId]);

  // Auto-detect generation completion
  useEffect(() => {
    if (progress.runGeneration) return;

    const checkGeneration = () => {
      try {
        // Check if any task has been completed
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('codra:task-queue:') || key.startsWith('codra:taskQueue:')) {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              const hasCompletedTask = parsed?.tasks?.some((t: any) => t.status === 'complete');
              if (hasCompletedTask) {
                setProgress(prev => ({ ...prev, runGeneration: true }));
                return;
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to check generation completion:', err);
      }
    };

    checkGeneration();
    const interval = setInterval(checkGeneration, 2000);
    return () => clearInterval(interval);
  }, [progress.runGeneration]);

  // Auto-detect export completion
  useEffect(() => {
    if (progress.exportArtifact) return;

    const checkExport = () => {
      const exported = localStorage.getItem('codra-export-completed');
      if (exported === 'true') {
        setProgress(prev => ({ ...prev, exportArtifact: true }));
      }
    };

    checkExport();
    const interval = setInterval(checkExport, 2000);
    return () => clearInterval(interval);
  }, [progress.exportArtifact]);

  // Auto-detect studio mode usage
  useEffect(() => {
    if (progress.tryStudio) return;

    const checkStudio = () => {
      try {
        const flowStore = localStorage.getItem('codra-flow-store');
        if (flowStore) {
          const parsed = JSON.parse(flowStore);
          if (parsed?.state?.studioEnabled === true) {
            setProgress(prev => ({ ...prev, tryStudio: true }));
          }
        }
      } catch (err) {
        console.error('Failed to check studio mode:', err);
      }
    };

    checkStudio();
    const interval = setInterval(checkStudio, 2000);
    return () => clearInterval(interval);
  }, [progress.tryStudio]);

  // Auto-detect settings changes
  useEffect(() => {
    if (progress.adjustSettings) return;

    const checkSettings = () => {
      const settingsChanged = localStorage.getItem('codra-settings-changed');
      if (settingsChanged === 'true') {
        setProgress(prev => ({ ...prev, adjustSettings: true }));
      }
    };

    checkSettings();
    const interval = setInterval(checkSettings, 2000);
    return () => clearInterval(interval);
  }, [progress.adjustSettings]);

  const items: ChecklistItem[] = [
    {
      id: 'createProject',
      title: 'Create project',
      completed: progress.createProject,
      action: () => navigate('/new'),
    },
    {
      id: 'addContext',
      title: 'Add project context',
      completed: progress.addContext,
      action: projectId ? () => {
        // Trigger context modal if on workspace page
        const event = new CustomEvent('codra:open-context-modal');
        window.dispatchEvent(event);
      } : undefined,
    },
    {
      id: 'runGeneration',
      title: 'Run your first generation',
      completed: progress.runGeneration,
    },
    {
      id: 'exportArtifact',
      title: 'Export an artifact',
      completed: progress.exportArtifact,
    },
    {
      id: 'tryStudio',
      title: 'Switch to Studio workspace',
      completed: progress.tryStudio,
    },
    {
      id: 'adjustSettings',
      title: 'Adjust your settings',
      completed: progress.adjustSettings,
      action: () => navigate('/settings'),
    },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const allComplete = completedCount === items.length;

  const dismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  }, []);

  const show = useCallback(() => {
    setDismissed(false);
    localStorage.removeItem(DISMISSED_KEY);
  }, []);

  return {
    items,
    completedCount,
    allComplete,
    dismissed,
    dismiss,
    show,
  };
}
