import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    PERSONALITY_OPTIONS,
    VISUAL_AUDIENCE_OPTIONS,
    VISUAL_STYLE_OPTIONS,
    COLOR_DIRECTION_OPTIONS,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/Button';

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-24">
            {/* Progress */}
            <OnboardingProgress currentStep="visual" />

            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-coral)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">Aesthetic Alignment</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[var(--color-ink)] leading-none">
                    {stepMeta.title.split(' ')[0]} <br />
                    <span className="italic font-serif font-light text-[var(--color-brand-coral)]">{stepMeta.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-[var(--color-ink-light)] font-medium italic font-serif max-w-lg leading-relaxed">
                    "{stepMeta.description}"
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-16">

                {/* Mood Plate 1: Personality */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-coral)] mb-2">
                            Mood Plate 01
                        </label>
                        <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Product Personality <span className="text-[var(--color-ink-muted)] text-xs lowercase font-serif italic font-medium">(select 3)</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PERSONALITY_OPTIONS.map(option => {
                            const isSelected = visualDirection.personality.includes(option.id);
                            const isDisabled = !isSelected && visualDirection.personality.length >= 3;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleArray(
                                        visualDirection.personality,
                                        option.id,
                                        3,
                                        (arr) => updateVisualDirection({ personality: arr })
                                    )}
                                    disabled={isDisabled}
                                    className={`p-6 text-left border rounded-[20px] transition-all duration-500 ${isSelected
                                        ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/5 text-[var(--color-ink-muted)] cursor-not-allowed opacity-20'
                                            : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-black text-[10px] uppercase tracking-widest ${isSelected ? 'text-[var(--color-brand-coral)]' : 'text-[var(--color-ink)]'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} strokeWidth={4} className="text-[var(--color-brand-coral)]" />}
                                    </div>
                                    <p className="text-[11px] text-[var(--color-ink-muted)] font-medium leading-relaxed">{option.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 2: Aesthetic Style */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-ink-muted)] mb-2">
                            Mood Plate 02
                        </label>
                        <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Aesthetic Style <span className="text-[var(--color-ink-muted)] text-xs lowercase font-serif italic font-medium">(pick 3)</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {VISUAL_STYLE_OPTIONS.map(option => {
                            const isSelected = visualDirection.visualStyles.includes(option.id);
                            const isDisabled = !isSelected && visualDirection.visualStyles.length >= 3;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleArray(
                                        visualDirection.visualStyles,
                                        option.id,
                                        3,
                                        (arr) => updateVisualDirection({ visualStyles: arr })
                                    )}
                                    disabled={isDisabled}
                                    className={`p-5 text-left border rounded-xl transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)]/5 shadow-md'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/5 text-[var(--color-ink-muted)] cursor-not-allowed opacity-50'
                                            : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-light)]'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} className="text-[var(--color-ink)]" />}
                                    </div>
                                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{option.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 3: Target Audience */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-ink-muted)] mb-2">
                            Mood Plate 03
                        </label>
                        <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Visual Audience</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {VISUAL_AUDIENCE_OPTIONS.map(option => {
                            const isSelected = visualDirection.visualAudience.includes(option.id);
                            return (
                                <button
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
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 4: Color Tone */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-ink-muted)] mb-2">
                            Mood Plate 04
                        </label>
                        <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Color Directions <span className="text-[var(--color-ink-muted)] text-xs lowercase font-serif italic font-medium">(pick 3)</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {COLOR_DIRECTION_OPTIONS.map(option => {
                            const isSelected = visualDirection.colorDirections.includes(option.id);
                            const isDisabled = !isSelected && visualDirection.colorDirections.length >= 3;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleArray(
                                        visualDirection.colorDirections,
                                        option.id,
                                        3,
                                        (arr) => updateVisualDirection({ colorDirections: arr })
                                    )}
                                    disabled={isDisabled}
                                    className={`p-5 text-left border rounded-xl transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)]/5 shadow-md'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/5 text-[var(--color-ink-muted)] cursor-not-allowed opacity-50'
                                            : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-light)]'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} className="text-[var(--color-ink)]" />}
                                    </div>
                                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{option.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-loose max-w-sm mx-auto">
                        8 secondary visual questions collapsed.<br/>
                        Advanced layout and typography controls are now accessible via the <b>Production Panel</b> after launch.
                    </p>
                </div>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--color-ink)]/5">
                <Button
                    variant="ghost"
                    onClick={() => setStep('budget')}
                    leftIcon={<ArrowLeft size={16} strokeWidth={3} />}
                    className="text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                    Framework
                </Button>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-medium italic font-serif text-[var(--color-ink-muted)]">
                        {stepMeta.helperText}
                    </span>
                    <Button
                        variant="primary"
                        onClick={() => setStep('generating')}
                        disabled={!canProceed}
                        rightIcon={<ArrowRight size={16} strokeWidth={3} />}
                        className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95"
                    >
                        Initiate Build
                    </Button>
                </div>
            </div>
        </div>
    );
};
