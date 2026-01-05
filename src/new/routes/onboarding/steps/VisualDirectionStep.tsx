import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    PERSONALITY_OPTIONS,
    VISUAL_AUDIENCE_OPTIONS,
    VISUAL_STYLE_OPTIONS,
    COLOR_DIRECTION_OPTIONS,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const VisualDirectionStep = () => {
    const {
        profile,
        updateVisualDirection,
        setStep,
    } = useOnboardingStore();
    const state = useOnboardingStore();

    const { visualDirection } = profile;
    const stepMeta = STEP_METADATA.visual;
    const canProceed = canProceedFromStep('visual', state);

    // Multi-select toggle helpers (max 3)
    const toggleArray = <T extends string>(
        current: T[],
        value: T,
        maxItems: number,
        update: (arr: T[]) => void
    ) => {
        if (current.includes(value)) {
            update(current.filter(v => v !== value));
        } else if (current.length < maxItems) {
            update([...current, value]);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-12">
            {/* Progress */}
            <OnboardingProgress currentStep="visual" />

            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <span className="text-xs font-semibold text-text-soft">Aesthetic Alignment</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tighter text-text-primary leading-none">
                    {stepMeta.title.split(' ')[0]} <br />
                    <span className="italic font-serif font-normal text-zinc-500">{stepMeta.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-text-secondary font-medium italic font-serif max-w-lg leading-relaxed">
                    &quot;{stepMeta.description}&quot;
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-12">

                {/* Mood Plate 1: Personality */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-2">Mood Plate 01</label>
                        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Product Personality <span className="text-text-soft text-xs lowercase font-serif italic font-medium">(select 3)</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PERSONALITY_OPTIONS.map(option => {
                            const isSelected = visualDirection.personality.includes(option.id);
                            const isDisabled = !isSelected && visualDirection.personality.length >= 3;
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => toggleArray(
                                        visualDirection.personality,
                                        option.id,
                                        3,
                                        (arr) => updateVisualDirection({ personality: arr })
                                    )}
                                    disabled={isDisabled}
                                    className={`p-6 text-left border rounded-[20px] transition-all duration-500 ${isSelected
                                        ? 'border-zinc-400 bg-zinc-200/40 shadow-2xl shadow-zinc-500/10'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/5 text-text-soft cursor-not-allowed opacity-20'
                                            : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-semibold ${isSelected ? 'text-zinc-500' : 'text-text-primary'}`}>
                                            {option.label}
                                        </span>
                                        {isSelected && <Check size={14} strokeWidth={4} className="text-zinc-500" />}
                                    </div>
                                    <p className="text-xs text-text-soft font-medium leading-relaxed">{option.description}</p>
                                </Button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 2: Aesthetic Style */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-text-soft mb-2">Mood Plate 02</label>
                        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Aesthetic Style <span className="text-text-soft text-xs lowercase font-serif italic font-medium">(pick 3)</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {VISUAL_STYLE_OPTIONS.map(option => {
                            const isSelected = visualDirection.visualStyles.includes(option.id);
                            const isDisabled = !isSelected && visualDirection.visualStyles.length >= 3;
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => toggleArray(
                                        visualDirection.visualStyles,
                                        option.id,
                                        3,
                                        (arr) => updateVisualDirection({ visualStyles: arr })
                                    )}
                                    disabled={isDisabled}
                                    className={`p-4 text-left border rounded-xl transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)]/5 shadow-md'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/5 text-text-soft cursor-not-allowed opacity-50'
                                            : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} className="text-text-primary" />}
                                    </div>
                                    <p className="text-xs text-text-soft leading-relaxed">{option.description}</p>
                                </Button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 3: Target Audience */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-text-soft mb-2">Audience Focus</label>
                        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Visual Audience</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {VISUAL_AUDIENCE_OPTIONS.map(option => {
                            const isSelected = visualDirection.visualAudience.includes(option.id);
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            updateVisualDirection({
                                                visualAudience: visualDirection.visualAudience.filter(v => v !== option.id)
                                            });
                                        } else {
                                            updateVisualDirection({
                                                visualAudience: [...visualDirection.visualAudience, option.id]
                                            });
                                        }
                                    }}
                                    className={`px-6 py-3 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-lg'
                                        : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 4: Color Tone */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-text-soft mb-2">Color Tone</label>
                        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                            Color Directions <span className="text-text-soft text-xs lowercase font-serif italic font-medium">(pick 3)</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {COLOR_DIRECTION_OPTIONS.map(option => {
                            const isSelected = visualDirection.colorDirections.includes(option.id);
                            const isDisabled = !isSelected && visualDirection.colorDirections.length >= 3;
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => toggleArray(
                                        visualDirection.colorDirections,
                                        option.id,
                                        3,
                                        (arr) => updateVisualDirection({ colorDirections: arr })
                                    )}
                                    disabled={isDisabled}
                                    className={`p-4 text-left border rounded-xl transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)]/5 shadow-md'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/5 text-text-soft cursor-not-allowed opacity-50'
                                            : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} className="text-text-primary" />}
                                    </div>
                                    <p className="text-xs text-text-soft leading-relaxed">{option.description}</p>
                                </Button>
                            );
                        })}
                    </div>
                </section>

                <div className="text-center pt-8">
                    <p className="text-xs text-zinc-400 leading-loose max-w-sm mx-auto">
                        8 secondary visual questions are now accessible via the <b>Production Panel</b> after launch.
                    </p>
                </div>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--color-ink)]/5">
                <Button
                    variant="ghost"
                    onClick={() => setStep('budget')}
                    leftIcon={<ArrowLeft size={16} strokeWidth={3} />}
                    className="text-xs font-semibold text-text-soft hover:text-text-primary transition-colors"
                >
                    Framework
                </Button>
                <span className="text-xs font-medium italic font-serif text-text-soft">
                    {stepMeta.helperText}
                </span>
                <Button
                    variant="primary"
                    onClick={() => setStep('generating')}
                    disabled={!canProceed}
                    rightIcon={<ArrowRight size={16} strokeWidth={3} />}
                    className="px-8 py-4 text-xs font-semibold shadow-2xl active:scale-95"
                >
                    Initiate Build
                </Button>
            </div>
        </div>
    );
};
