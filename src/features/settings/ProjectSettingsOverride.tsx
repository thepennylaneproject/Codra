/**
 * PROJECT SETTINGS OVERRIDE
 * Allows overriding account defaults for specific projects
 */

import { useState } from 'react';
import { Settings, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingRow } from './SettingRow';
import { SettingEditor } from './SettingEditor';
import { useAccountSettings } from '../../lib/smart-defaults/hooks/useAccountSettings';
import { useProjectSettings } from '../../lib/smart-defaults/hooks/useProjectSettings';
import { useEffectiveSettings } from '../../lib/smart-defaults/hooks/useEffectiveSettings';
import { SETTINGS_LABELS } from '../../domain/smart-defaults-types';
import type { QualityPriority, AutonomyLevel } from '../../domain/smart-defaults-types';

interface ProjectSettingsOverrideProps {
    projectId: string;
    projectName: string;
}

type EditorType = 'qualityPriority' | 'autonomyLevel' | 'maxSteps' | 'riskTolerance' | 'dailyBudget' | null;

export function ProjectSettingsOverride({ projectId, projectName }: ProjectSettingsOverrideProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState<EditorType>(null);

    const { settings: accountSettings } = useAccountSettings();
    const { updateProjectSettings, clearProjectSettings, getProjectSettings } = useProjectSettings();
    const effectiveSettings = useEffectiveSettings(projectId);

    const projectSettings = getProjectSettings(projectId);

    const handleSave = (type: EditorType, value: string) => {
        if (!type) return;

        const updates: Record<string, any> = {};

        switch (type) {
            case 'qualityPriority':
                updates.qualityPriority = value as QualityPriority;
                break;
            case 'autonomyLevel':
                updates.autonomyLevel = value as AutonomyLevel;
                break;
            case 'maxSteps':
                updates.maxSteps = parseInt(value);
                break;
            case 'riskTolerance':
                updates.riskTolerance = parseInt(value);
                break;
            case 'dailyBudget':
                updates.dailyBudget = parseInt(value);
                break;
        }

        updateProjectSettings(projectId, updates);
    };

    const handleReset = () => {
        clearProjectSettings(projectId);
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-zinc-100 rounded-xl transition-colors group relative"
                title="Project Settings"
            >
                <Settings size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                {effectiveSettings.hasOverrides && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF4D4D] rounded-full border-2 border-white" />
                )}
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-50"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 400 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 400 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#FFFAF0] shadow-2xl z-50 overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-[#FFFAF0] border-b border-[#1A1A1A]/5 p-8 z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-black uppercase tracking-tight">
                                            Project Settings
                                        </h2>
                                        <p className="text-sm text-zinc-600 mt-1">{projectName}</p>
                                        {effectiveSettings.hasOverrides && (
                                            <p className="text-[10px] text-[#FF4D4D] mt-2 font-mono uppercase tracking-widest">
                                                {effectiveSettings.overrideCount} override{effectiveSettings.overrideCount !== 1 ? 's' : ''} active
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                {/* Info */}
                                <div className="p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl">
                                    <p className="text-sm text-zinc-600 leading-relaxed">
                                        Override account defaults for this project. Unset values will use your account defaults.
                                    </p>
                                </div>

                                {/* AI Settings */}
                                <section>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">
                                        AI Behavior
                                    </h3>
                                    <div className="space-y-3">
                                        <SettingRow
                                            label="Quality Priority"
                                            value={SETTINGS_LABELS.qualityPriority[effectiveSettings.ai.qualityPriority]}
                                            onChange={() => setEditorOpen('qualityPriority')}
                                            isOverride={projectSettings?.qualityPriority !== undefined}
                                        />
                                        <SettingRow
                                            label="Autonomy Level"
                                            value={SETTINGS_LABELS.autonomyLevel[effectiveSettings.ai.autonomyLevel]}
                                            onChange={() => setEditorOpen('autonomyLevel')}
                                            isOverride={projectSettings?.autonomyLevel !== undefined}
                                        />
                                        <SettingRow
                                            label="Max Steps"
                                            value={effectiveSettings.ai.maxSteps.toString()}
                                            onChange={() => setEditorOpen('maxSteps')}
                                            isOverride={projectSettings?.maxSteps !== undefined}
                                        />
                                        <SettingRow
                                            label="Risk Tolerance"
                                            value={`${effectiveSettings.ai.riskTolerance}/5`}
                                            onChange={() => setEditorOpen('riskTolerance')}
                                            isOverride={projectSettings?.riskTolerance !== undefined}
                                        />
                                    </div>
                                </section>

                                {/* Budget Settings */}
                                <section>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">
                                        Budget
                                    </h3>
                                    <div className="space-y-3">
                                        <SettingRow
                                            label="Daily Budget"
                                            value={`$${effectiveSettings.budget.dailyLimit}`}
                                            onChange={() => setEditorOpen('dailyBudget')}
                                            isOverride={projectSettings?.dailyBudget !== undefined}
                                        />
                                    </div>
                                </section>

                                {/* Reset */}
                                {effectiveSettings.hasOverrides && (
                                    <button
                                        onClick={handleReset}
                                        className="w-full p-6 bg-zinc-50 hover:bg-zinc-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-600 transition-all flex items-center justify-center gap-3"
                                    >
                                        <RotateCcw size={16} />
                                        Reset to Account Defaults
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Editors */}
            <SettingEditor
                isOpen={editorOpen === 'qualityPriority'}
                onClose={() => setEditorOpen(null)}
                title="Quality Priority (Project Override)"
                currentValue={projectSettings?.qualityPriority || accountSettings.ai.qualityPriority}
                options={[
                    { value: 'quality', label: 'Quality First', description: 'Best results, regardless of time or cost' },
                    { value: 'balanced', label: 'Balanced', description: 'Good quality with reasonable speed and cost' },
                    { value: 'fast', label: 'Speed First', description: 'Fast responses, quality can be good enough' },
                    { value: 'cheap', label: 'Budget First', description: 'Minimize spending, results can be basic' },
                ]}
                onSave={(value) => handleSave('qualityPriority', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'autonomyLevel'}
                onClose={() => setEditorOpen(null)}
                title="Autonomy Level (Project Override)"
                currentValue={projectSettings?.autonomyLevel || accountSettings.ai.autonomyLevel}
                options={[
                    { value: 'full-auto', label: 'Full Auto', description: 'Make and save changes automatically' },
                    { value: 'apply-with-approval', label: 'Apply with Approval', description: 'Make changes, you review before saving' },
                    { value: 'always-ask', label: 'Always Ask', description: 'Show options, you apply them' },
                ]}
                onSave={(value) => handleSave('autonomyLevel', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'maxSteps'}
                onClose={() => setEditorOpen(null)}
                title="Max Steps (Project Override)"
                currentValue={(projectSettings?.maxSteps || accountSettings.ai.maxSteps).toString()}
                type="number"
                min={1}
                max={100}
                options={[]}
                onSave={(value) => handleSave('maxSteps', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'riskTolerance'}
                onClose={() => setEditorOpen(null)}
                title="Risk Tolerance (Project Override)"
                currentValue={(projectSettings?.riskTolerance || accountSettings.ai.riskTolerance).toString()}
                type="range"
                min={1}
                max={5}
                options={[]}
                onSave={(value) => handleSave('riskTolerance', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'dailyBudget'}
                onClose={() => setEditorOpen(null)}
                title="Daily Budget (Project Override)"
                currentValue={(projectSettings?.dailyBudget || accountSettings.budget.dailyLimit).toString()}
                type="number"
                min={1}
                max={10000}
                options={[]}
                onSave={(value) => handleSave('dailyBudget', value)}
            />
        </>
    );
}
