/**
 * SETTINGS PAGE
 * Smart Defaults System - Review and override page
 * No configuration before first Spread
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, CircleDollarSign, Palette, RotateCcw, Play, BookOpen } from 'lucide-react';
import { SettingRow } from './SettingRow';
import { SettingEditor } from './SettingEditor';
import { useAccountSettings } from '../../lib/smart-defaults/hooks/useAccountSettings';
import { SETTINGS_LABELS, SETTINGS_DESCRIPTIONS } from '../../domain/smart-defaults-types';
import type { QualityPriority, SpendingStrategy, AutonomyLevel, ThemePreference } from '../../domain/smart-defaults-types';
import { behaviorTracker } from '../../lib/smart-defaults/inference-engine';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth/AuthProvider';
import { FirstRunExperience } from '@/components/fre';

import { Heading, Text, Label } from '../../new/components';

type EditorType = 'qualityPriority' | 'autonomyLevel' | 'maxSteps' | 'riskTolerance' | 'dailyLimit' | 'strategy' | 'theme' | null;

export function SettingsPage() {
    const navigate = useNavigate();
    const {
        settings,
        updateAISettings,
        updateBudgetSettings,
        updateVisualSettings,
        resetToDefaults,
    } = useAccountSettings();

    const [editorOpen, setEditorOpen] = useState<EditorType>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showReplayTour, setShowReplayTour] = useState(false);
    const { refreshProfile } = useAuth();

    // Get current user ID for behavior tracking
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
            }
        });
    }, []);

    const handleSave = (type: EditorType, value: string) => {
        if (!type) return;

        // Track setting change for behavior learning
        if (userId) {
            behaviorTracker.track({
                userId,
                timestamp: new Date(),
                event: 'setting_changed',
                metadata: {
                    setting: type,
                    value,
                },
            });
        }

        switch (type) {
            case 'qualityPriority':
                updateAISettings({ qualityPriority: value as QualityPriority });
                break;
            case 'autonomyLevel':
                updateAISettings({ autonomyLevel: value as AutonomyLevel });
                break;
            case 'maxSteps':
                updateAISettings({ maxSteps: parseInt(value) });
                break;
            case 'riskTolerance':
                updateAISettings({ riskTolerance: parseInt(value) });
                break;
            case 'dailyLimit':
                updateBudgetSettings({ dailyLimit: parseInt(value) });
                break;
            case 'strategy':
                updateBudgetSettings({ strategy: value as SpendingStrategy });
                break;
            case 'theme':
                updateVisualSettings({ theme: value as ThemePreference });
                break;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--ui-bg)] text-text-primary font-sans selection:bg-[var(--brand-ink)]/10">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--ui-border)] bg-[var(--ui-bg)] px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>
                    <div>
                        <Heading size="lg" className="tracking-tight">Account Settings</Heading>
                        <Label variant="muted">Global defaults for every workspace</Label>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-12 px-8">
                {/* Scope */}
                <div className="mb-12 border-t border-[var(--ui-border)] pt-6 flex items-start justify-between gap-6">
                    <div>
                        <Heading size="lg" className="mb-3">Settings scope</Heading>
                        <Text variant="muted">
                            Account settings apply to every workspace. Project settings live inside a workspace and override these defaults.
                        </Text>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-text-primary border-b-2 border-text-primary">
                            Account
                        </span>
                        <button
                            onClick={() => navigate('/projects')}
                            className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-secondary hover:text-text-primary"
                        >
                            Project
                        </button>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Project Settings */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <Heading size="lg">Project Settings</Heading>
                                <Label variant="muted">Per‑workspace overrides</Label>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[var(--ui-border)] space-y-4">
                            <Text variant="muted">
                                Open a workspace to edit project‑level overrides (budget, autonomy, model choices).
                            </Text>
                            <button
                                onClick={() => navigate('/projects')}
                                className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-primary"
                            >
                                Open project registry
                            </button>
                        </div>
                    </section>
                    {/* AI Behavior */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <Zap size={20} />
                            </div>
                            <div>
                                <Heading size="lg">AI Behavior</Heading>
                                <Label variant="muted">How AI models work for you</Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SettingRow
                                label="Quality Priority"
                                value={SETTINGS_LABELS.qualityPriority[settings.ai.qualityPriority]}
                                description={SETTINGS_DESCRIPTIONS.qualityPriority}
                                onChange={() => setEditorOpen('qualityPriority')}
                            />
                            <SettingRow
                                label="Autonomy Level"
                                value={SETTINGS_LABELS.autonomyLevel[settings.ai.autonomyLevel]}
                                description={SETTINGS_DESCRIPTIONS.autonomyLevel}
                                onChange={() => setEditorOpen('autonomyLevel')}
                            />
                            <SettingRow
                                label="Max Steps"
                                value={settings.ai.maxSteps.toString()}
                                description={SETTINGS_DESCRIPTIONS.maxSteps}
                                onChange={() => setEditorOpen('maxSteps')}
                            />
                            <SettingRow
                                label="Risk Tolerance"
                                value={`${settings.ai.riskTolerance}/5`}
                                description={SETTINGS_DESCRIPTIONS.riskTolerance}
                                onChange={() => setEditorOpen('riskTolerance')}
                            />
                        </div>
                    </section>

                    {/* Budget */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <CircleDollarSign size={20} />
                            </div>
                            <div>
                                <Heading size="lg">Budget</Heading>
                                <Label variant="muted">Spending limits and strategy</Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SettingRow
                                label="Daily Limit"
                                value={`$${settings.budget.dailyLimit}`}
                                description={SETTINGS_DESCRIPTIONS.dailyLimit}
                                onChange={() => setEditorOpen('dailyLimit')}
                            />
                            <SettingRow
                                label="Strategy"
                                value={SETTINGS_LABELS.spendingStrategy[settings.budget.strategy]}
                                description={SETTINGS_DESCRIPTIONS.strategy}
                                onChange={() => setEditorOpen('strategy')}
                            />
                        </div>
                    </section>

                    {/* Visual */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <Palette size={20} />
                            </div>
                            <div>
                                <Heading size="lg">Visual</Heading>
                                <Label variant="muted">Interface preferences</Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SettingRow
                                label="Theme"
                                value={SETTINGS_LABELS.theme[settings.visual.theme]}
                                description={SETTINGS_DESCRIPTIONS.theme}
                                onChange={() => setEditorOpen('theme')}
                            />
                        </div>
                    </section>

                    {/* Onboarding */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 border border-[var(--ui-border)] flex items-center justify-center text-text-primary">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <Heading size="lg">Onboarding</Heading>
                                <Label variant="muted">Guided tour and help</Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="pt-4 border-t border-[var(--ui-border)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Text className="font-medium">Replay Welcome Tour</Text>
                                        <Label variant="muted">Watch the guided tour again to learn about Codra&apos;s features</Label>
                                    </div>
                                    <button
                                        onClick={() => setShowReplayTour(true)}
                                        className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-primary"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Play size={14} />
                                            Replay Tour
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Reset */}
                    <section className="pt-8 border-t border-[var(--ui-border)]">
                        <button
                            onClick={resetToDefaults}
                            className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-primary flex items-center gap-3"
                        >
                            <RotateCcw size={16} />
                            Reset All to Defaults
                        </button>
                    </section>
                </div>
            </main>

            {/* Editors */}
            <SettingEditor
                isOpen={editorOpen === 'qualityPriority'}
                onClose={() => setEditorOpen(null)}
                title="Quality Priority"
                description="Balance quality, speed, and cost for AI tasks"
                currentValue={settings.ai.qualityPriority}
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
                title="Autonomy Level"
                description="How much can AI do without your approval"
                currentValue={settings.ai.autonomyLevel}
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
                title="Max Steps"
                description="Maximum steps before pausing for approval"
                currentValue={settings.ai.maxSteps.toString()}
                type="number"
                min={1}
                max={100}
                options={[]}
                onSave={(value) => handleSave('maxSteps', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'riskTolerance'}
                onClose={() => setEditorOpen(null)}
                title="Risk Tolerance"
                description="How much risk you're comfortable with (1 = very cautious, 5 = aggressive)"
                currentValue={settings.ai.riskTolerance.toString()}
                type="range"
                min={1}
                max={5}
                options={[]}
                onSave={(value) => handleSave('riskTolerance', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'dailyLimit'}
                onClose={() => setEditorOpen(null)}
                title="Daily Budget Limit"
                description="Maximum daily spending on AI tasks"
                currentValue={settings.budget.dailyLimit.toString()}
                type="number"
                min={1}
                max={10000}
                options={[]}
                onSave={(value) => handleSave('dailyLimit', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'strategy'}
                onClose={() => setEditorOpen(null)}
                title="Spending Strategy"
                description="How to balance budget and quality"
                currentValue={settings.budget.strategy}
                options={[
                    { value: 'budget', label: 'Budget Mode', description: 'Use cheaper options where possible' },
                    { value: 'smart-balance', label: 'Smart Balance', description: 'Mix cheaper and premium when it matters' },
                    { value: 'performance', label: 'Performance Mode', description: 'Prioritize quality, even if it costs more' },
                ]}
                onSave={(value) => handleSave('strategy', value)}
            />

            <SettingEditor
                isOpen={editorOpen === 'theme'}
                onClose={() => setEditorOpen(null)}
                title="Theme"
                description="Interface color scheme"
                currentValue={settings.visual.theme}
                options={[
                    { value: 'dark', label: 'Dark', description: 'Dark color scheme' },
                    { value: 'light', label: 'Light', description: 'Light color scheme' },
                    { value: 'system', label: 'System', description: 'Follow system preference' },
                ]}
                onSave={(value) => handleSave('theme', value)}
            />

            {/* Footer */}
            <footer className="mt-12 py-12 border-t border-[var(--ui-border)] bg-[var(--ui-bg)] text-center">
                <Label variant="muted" className="text-xs font-mono text-zinc-400">
                    Codra Smart Defaults System
                </Label>
            </footer>

            {/* Replay Tour Modal */}
            {showReplayTour && (
                <FirstRunExperience
                    onComplete={() => {
                        setShowReplayTour(false);
                        refreshProfile();
                    }}
                    onSkip={() => setShowReplayTour(false)}
                />
            )}
        </div>
    );
}
