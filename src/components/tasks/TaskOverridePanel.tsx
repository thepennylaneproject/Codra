/**
 * TASK OVERRIDE PANEL
 * Modal/panel UI for adjusting task-specific settings
 */

import { useState } from 'react';
import type { TaskOverrideSettings, QualityPriority } from '../../domain/smart-defaults-types';
import { SETTINGS_LABELS } from '../../domain/smart-defaults-types';

interface TaskOverridePanelProps {
    taskType: string;
    currentSettings: TaskOverrideSettings;
    onApply: (overrides: TaskOverrideSettings, persistent: boolean) => void;
    onCancel: () => void;
}

export function TaskOverridePanel({
    taskType,
    currentSettings,
    onApply,
    onCancel,
}: TaskOverridePanelProps) {
    const [qualityPriority, setQualityPriority] = useState<QualityPriority | undefined>(
        currentSettings.qualityPriority
    );
    const [maxSteps, setMaxSteps] = useState<number | undefined>(currentSettings.maxSteps);
    const [modelOverride, setModelOverride] = useState<string | undefined>(
        currentSettings.modelOverride
    );
    const [rememberForSimilar, setRememberForSimilar] = useState(false);

    const handleApply = () => {
        const overrides: TaskOverrideSettings = {
            ...(qualityPriority && { qualityPriority }),
            ...(maxSteps !== undefined && { maxSteps }),
            ...(modelOverride && { modelOverride }),
        };
        onApply(overrides, rememberForSimilar);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--color-border-subtle)]">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Adjust Task Settings
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        Override settings for this {taskType} task
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Quality Priority */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Quality Priority
                        </label>
                        <select
                            value={qualityPriority || ''}
                            onChange={(e) =>
                                setQualityPriority(
                                    e.target.value ? (e.target.value as QualityPriority) : undefined
                                )
                            }
                            className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        >
                            <option value="">Use default</option>
                            <option value="quality">{SETTINGS_LABELS.qualityPriority.quality}</option>
                            <option value="balanced">{SETTINGS_LABELS.qualityPriority.balanced}</option>
                            <option value="fast">{SETTINGS_LABELS.qualityPriority.fast}</option>
                            <option value="cheap">{SETTINGS_LABELS.qualityPriority.cheap}</option>
                        </select>
                    </div>

                    {/* Max Steps */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Max Steps
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={maxSteps || ''}
                            onChange={(e) =>
                                setMaxSteps(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                            placeholder="Use default"
                            className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        />
                    </div>

                    {/* Model Override */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Model Override
                        </label>
                        <select
                            value={modelOverride || ''}
                            onChange={(e) => setModelOverride(e.target.value || undefined)}
                            className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        >
                            <option value="">Use default</option>
                            <option value="claude-haiku">Claude Haiku (Fast)</option>
                            <option value="claude-sonnet">Claude Sonnet (Balanced)</option>
                            <option value="claude-opus">Claude Opus (Quality)</option>
                            <option value="gpt-4">GPT-4 (Premium)</option>
                        </select>
                    </div>

                    {/* Remember for similar tasks */}
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="remember-similar"
                            checked={rememberForSimilar}
                            onChange={(e) => setRememberForSimilar(e.target.checked)}
                            className="w-4 h-4 text-[var(--color-accent)] bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                        />
                        <label
                            htmlFor="remember-similar"
                            className="text-sm text-[var(--color-text-secondary)] cursor-pointer"
                        >
                            Remember for similar {taskType} tasks
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-opacity"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
