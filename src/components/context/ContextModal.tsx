import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Edit3, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ContextForm } from './ContextForm';
import { RevisionSelector } from './RevisionSelector';
import { useContextRevisions } from '@/hooks/useContextRevisions';
import { validateProjectContext, type ProjectContextFormState } from '@/lib/validation/projectBrief';
import { useToast } from '@/new/components/Toast';
import type { ProjectContext } from '@/domain/types';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

function toFormState(data?: Partial<ProjectContext>): ProjectContextFormState {
  return {
    audience: {
      primary: data?.audience?.primary || '',
      context: data?.audience?.context
        ? {
            segment: data.audience.context.segment,
            sophistication: data.audience.context.sophistication,
          }
        : undefined,
    },
    brand: {
      voiceGuidelines: data?.brand?.voiceGuidelines || '',
      colors: data?.brand?.colors
        ? {
            primary: data.brand.colors.primary || '',
            secondary: data.brand.colors.secondary || '',
            accent: data.brand.colors.accent || '',
          }
        : undefined,
    },
    success: {
      definitionOfDone: data?.success?.definitionOfDone || [],
    },
    guardrails: {
      mustAvoid: data?.guardrails?.mustAvoid || [],
      competitors: data?.guardrails?.competitors || [],
    },
  };
}

function mergeFormIntoContext(form: ProjectContextFormState, base?: Partial<ProjectContext>): Partial<ProjectContext> {
  const allowedSegments = ['B2C', 'B2B', 'D2C'] as const;
  const allowedSophistication = ['novice', 'intermediate', 'expert'] as const;

  const audienceContext = form.audience.context
    ? {
        segment: allowedSegments.includes(form.audience.context.segment as any)
          ? (form.audience.context.segment as (typeof allowedSegments)[number])
          : undefined,
        sophistication: allowedSophistication.includes(form.audience.context.sophistication as any)
          ? (form.audience.context.sophistication as (typeof allowedSophistication)[number])
          : undefined,
      }
    : undefined;

  const brandColors = form.brand.colors
    ? {
        primary: form.brand.colors.primary || '',
        secondary: form.brand.colors.secondary || '',
        accent: form.brand.colors.accent || '',
      }
    : undefined;

  return {
    ...base,
    audience: {
      primary: form.audience.primary,
      context: audienceContext,
    },
    brand: {
      ...form.brand,
      colors: brandColors,
    },
    success: form.success,
    guardrails: form.guardrails,
  };
}

function runCoherenceCheck(form: ProjectContextFormState) {
  const warnings: string[] = [];
  if (form.audience.primary.trim().length < 3) warnings.push('Audience is very short.');
  if (!form.brand.voiceGuidelines?.trim()) warnings.push('Brand voice guidelines are missing.');
  if ((form.success.definitionOfDone || []).length === 0) warnings.push('No success criteria provided.');
  if ((form.guardrails.mustAvoid || []).length === 0) warnings.push('Guardrails are empty.');
  return warnings;
}

export function ContextModal({ isOpen, onClose, projectId }: ContextModalProps) {
  const toast = useToast();
  const {
    revisions,
    currentRevisionId,
    currentRevision,
    setCurrentRevisionId,
    saveDraft,
    approveRevision,
    restoreRevision,
  } = useContextRevisions(projectId);

  const [formState, setFormState] = useState<ProjectContextFormState>(toFormState());
  const [initialState, setInitialState] = useState<ProjectContextFormState>(toFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const next = toFormState(currentRevision?.data);
    setFormState(next);
    setInitialState(next);
    setErrors({});
    setWarnings([]);
    setHasChecked(false);
  }, [isOpen, currentRevision]);

  const isDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(initialState),
    [formState, initialState]
  );
  const isValid = useMemo(() => validateProjectContext(formState).isValid, [formState]);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    const interval = window.setInterval(() => {
      if (isDirty) {
        const merged = mergeFormIntoContext(formState, currentRevision?.data);
        saveDraft(merged, 'Auto-saved draft');
        setInitialState(formState);
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [isOpen, isDirty, formState, currentRevision, saveDraft, projectId]);

  const handleSaveDraft = () => {
    const merged = mergeFormIntoContext(formState, currentRevision?.data);
    saveDraft(merged, 'Draft update');
    setInitialState(formState);
    toast.success('Draft saved.');
  };

  const handleApprove = () => {
    const validation = validateProjectContext(formState);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Resolve the highlighted context fields.');
      return;
    }
    const merged = mergeFormIntoContext(formState, currentRevision?.data);
    approveRevision(merged, 'Approved context');
    setInitialState(formState);
    setErrors({});
    toast.success('Context approved.');
    onClose();
  };

  const handleRevisionSelect = (revisionId: string) => {
    if (revisionId === currentRevisionId) return;
    const restored = restoreRevision(revisionId);
    if (restored) {
      setCurrentRevisionId(restored.id);
      setFormState(toFormState(restored.data));
      setInitialState(toFormState(restored.data));
    }
  };

  const handleCoherenceCheck = () => {
    setWarnings(runCoherenceCheck(formState));
    setHasChecked(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          className="w-full max-w-3xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Edit3 size={16} className="text-zinc-500" />
                Edit Project Context
              </h2>
              <p className="text-xs text-text-soft mt-1">
                {isDirty ? 'Unsaved changes' : 'All changes saved'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RevisionSelector
                revisions={revisions}
                currentId={currentRevisionId}
                onSelect={handleRevisionSelect}
              />
              <Button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={16} className="text-zinc-500" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <ContextForm value={formState} onChange={setFormState} errors={errors} />

            <section>
              <SectionHeader title="Coherence check" meta="Quick scan for contradictions or gaps." />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCoherenceCheck}
                className="flex items-center gap-2"
              >
                <CheckCircle size={12} />
                Run coherence check
              </Button>
              {hasChecked && warnings.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-amber-600">
                  {warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              )}
              {hasChecked && warnings.length === 0 && (
                <p className="mt-2 text-xs text-text-soft">No warnings yet.</p>
              )}
            </section>
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-white">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={handleApprove} disabled={!isValid}>
                Approve
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
