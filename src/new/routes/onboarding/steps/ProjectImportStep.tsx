import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    IMPORT_PROJECT_TYPE_OPTIONS,
    IMPORT_PROJECT_STAGE_OPTIONS,
    IMPORT_GOAL_OPTIONS,
    IMPORT_SOURCE_OPTIONS,
    IMPORT_PAIN_POINT_OPTIONS,
    IMPORT_OFF_LIMITS_OPTIONS,
    AI_DISAGREEMENT_OPTIONS,
    ImportProjectType,
    ImportProjectStage,
    ImportGoal,
    ImportSourceOfTruth,
    ImportPainPoint,
    ImportOffLimitsArea,
    AIDisagreementBehavior,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ProjectImportStep = () => {
    const {
        profile,
        updateImportData,
        setStep,
    } = useOnboardingStore();
    const state = useOnboardingStore();

    const { importData } = profile;
    const stepMeta = STEP_METADATA['import'];
    const canProceed = canProceedFromStep('import', state);

    // Toggle helpers for multi-select
    const toggleGoal = (goal: ImportGoal) => {
        const current = importData.importGoals;
        if (current.includes(goal)) {
            updateImportData({ importGoals: current.filter(g => g !== goal) });
        } else if (current.length < 3) {
            updateImportData({ importGoals: [...current, goal] });
        }
    };

    const togglePainPoint = (point: ImportPainPoint) => {
        const current = importData.painPoints;
        if (current.includes(point)) {
            updateImportData({ painPoints: current.filter(p => p !== point) });
        } else if (current.length < 3) {
            updateImportData({ painPoints: [...current, point] });
        }
    };

    const toggleOffLimits = (area: ImportOffLimitsArea) => {
        const current = importData.offLimitsAreas;
        // "none" is exclusive
        if (area === 'none') {
            updateImportData({ offLimitsAreas: ['none'] });
            return;
        }
        // Remove "none" if selecting something else
        const filtered = current.filter(a => a !== 'none');
        if (current.includes(area)) {
            updateImportData({ offLimitsAreas: filtered.filter(a => a !== area) });
        } else if (filtered.length < 3) {
            updateImportData({ offLimitsAreas: [...filtered, area] });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-12">
            {/* Progress */}
            <OnboardingProgress currentStep="import" />

            {/* Header */}
            <header className="space-y-3">
                <h1 className="text-xl md:text-xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stepMeta.title}
                </h1>
                <p className="text-base text-zinc-500 font-normal max-w-lg">
                    {stepMeta.description}
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-12">

                {/* Q1: Project Type */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        What are you importing?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {IMPORT_PROJECT_TYPE_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => updateImportData({ projectType: option.id as ImportProjectType })}
                                className={`p-4 text-left border rounded-sm transition-all duration-200 ${importData.projectType === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                    {importData.projectType === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Q2: Project Summary */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        In a sentence or two, what is this project about?
                    </label>
                    <textarea
                        value={importData.projectSummary}
                        onChange={(e) => updateImportData({ projectSummary: e.target.value })}
                        placeholder="e.g., Job-search platform for mid-career professionals..."
                        className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 text-base font-normal focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all resize-none min-h-[100px] placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                        maxLength={300}
                    />
                    <p className="text-xs text-zinc-400 text-right">{importData.projectSummary.length}/300</p>
                </section>

                {/* Q3: Project Stage */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">What stage is this project at?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {IMPORT_PROJECT_STAGE_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => updateImportData({ projectStage: option.id as ImportProjectStage })}
                                className={`p-4 text-left border rounded-sm transition-all duration-200 ${importData.projectStage === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                    {importData.projectStage === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs text-zinc-500">{option.description}</p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Q4: Import Goals (multi-select, max 3) */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        Why are you bringing this into Codra? <span className="text-zinc-300">(pick up to 3)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {IMPORT_GOAL_OPTIONS.map(option => {
                            const isSelected = importData.importGoals.includes(option.id);
                            const isDisabled = !isSelected && importData.importGoals.length >= 3;
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => toggleGoal(option.id)}
                                    disabled={isDisabled}
                                    className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                        : isDisabled
                                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                                            : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
                                        }`}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>
                </section>

                {/* Q5: Caution Level (1-5 slider) */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        How cautious should the AI be with your existing work?
                    </label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-400 w-24">Big changes OK</span>
                        <div className="flex-1 flex gap-2">
                            {[1, 2, 3, 4, 5].map(level => (
                                <Button
                                    key={level}
                                    onClick={() => updateImportData({ cautionLevel: level as 1 | 2 | 3 | 4 | 5 })}
                                    className={`flex-1 h-12 rounded-sm transition-all duration-200 flex flex-col items-center justify-center ${importData.cautionLevel === level
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500'
                                        }`}
                                >
                                    <span className="font-medium">{level}</span>
                                </Button>
                            ))}
                        </div>
                        <span className="text-xs text-zinc-400 w-24 text-right">Advise only</span>
                    </div>
                    <p className="text-xs text-zinc-400 text-center">
                        {importData.cautionLevel <= 2
                            ? 'Feel free to make significant changes'
                            : importData.cautionLevel === 3
                                ? 'Small improvements, keep structure the same'
                                : 'Very conservative, mostly analyze and suggest'
                        }
                    </p>
                </section>

                {/* Q6: Off-Limits Areas */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        Which parts are off-limits for edits?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {IMPORT_OFF_LIMITS_OPTIONS.map(option => {
                            const isSelected = importData.offLimitsAreas.includes(option.id);
                            const isDisabled = !isSelected && importData.offLimitsAreas.length >= 3 && option.id !== 'none';
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => toggleOffLimits(option.id)}
                                    disabled={isDisabled}
                                    className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                        : isDisabled
                                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                                            : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
                                        }`}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>
                </section>

                {/* Q7: Source of Truth */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        Where does the source of truth live?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {IMPORT_SOURCE_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => updateImportData({ sourceOfTruth: option.id as ImportSourceOfTruth })}
                                className={`p-4 text-left border rounded-sm transition-all duration-200 ${importData.sourceOfTruth === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                    {importData.sourceOfTruth === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Q8: Pain Points */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        What&apos;s bothering you most about the project? <span className="text-zinc-300">(pick up to 3)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {IMPORT_PAIN_POINT_OPTIONS.map(option => {
                            const isSelected = importData.painPoints.includes(option.id);
                            const isDisabled = !isSelected && importData.painPoints.length >= 3;
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => togglePainPoint(option.id)}
                                    disabled={isDisabled}
                                    className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                        : isDisabled
                                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                                            : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
                                        }`}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>
                </section>

                {/* Q9: AI Disagreement Behavior */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        When the AI disagrees with your direction, what should it do?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {AI_DISAGREEMENT_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => updateImportData({ aiDisagreementBehavior: option.id as AIDisagreementBehavior })}
                                className={`p-4 text-left border rounded-sm transition-all duration-200 ${importData.aiDisagreementBehavior === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                    {importData.aiDisagreementBehavior === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs text-zinc-500">{option.description}</p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Q10: Do Not Break */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        What is the single most important thing the AI must NOT break?
                    </label>
                    <textarea
                        value={importData.doNotBreak}
                        onChange={(e) => updateImportData({ doNotBreak: e.target.value })}
                        placeholder="e.g., The main navigation flow must stay exactly as designed..."
                        className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 text-base font-normal focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all resize-none min-h-[80px] placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                        maxLength={200}
                    />
                    <p className="text-xs text-zinc-400 text-right">{importData.doNotBreak.length}/200</p>
                </section>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-900">
                <Button
                    onClick={() => setStep('mode')}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Open previous step
                </Button>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-400">
                        {stepMeta.helperText}
                    </span>
                    <Button
                        onClick={() => setStep('generating')}
                        disabled={!canProceed}
                        className="flex items-center gap-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
                    >
                        Continue
                        <ArrowRight size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
