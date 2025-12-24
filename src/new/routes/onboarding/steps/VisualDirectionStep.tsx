import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    PERSONALITY_OPTIONS,
    VISUAL_AUDIENCE_OPTIONS,
    VISUAL_STYLE_OPTIONS,
    COLOR_DIRECTION_OPTIONS,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

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
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8A8A]">Aesthetic Alignment</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[#1A1A1A] leading-none">
                    {stepMeta.title.split(' ')[0]} <br />
                    <span className="italic font-serif font-light text-[#FF4D4D]">{stepMeta.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-[#5A5A5A] font-medium italic font-serif max-w-lg leading-relaxed">
                    "{stepMeta.description}"
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-16">

                {/* Mood Plate 1: Personality */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4D4D] mb-2">
                            Mood Plate 01
                        </label>
                        <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Product Personality <span className="text-[#8A8A8A] text-xs lowercase font-serif italic font-medium">(select 3)</span></h2>
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
                                        ? 'border-[#FF4D4D] bg-[#FF4D4D]/5 shadow-2xl shadow-[#FF4D4D]/10'
                                        : isDisabled
                                            ? 'border-[#1A1A1A]/5 text-[#8A8A8A] cursor-not-allowed opacity-20'
                                            : 'border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-black text-[10px] uppercase tracking-widest ${isSelected ? 'text-[#FF4D4D]' : 'text-[#1A1A1A]'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} strokeWidth={4} className="text-[#FF4D4D]" />}
                                    </div>
                                    <p className="text-[11px] text-[#8A8A8A] font-medium leading-relaxed">{option.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 2: Aesthetic Style */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                            Mood Plate 02
                        </label>
                        <h2 className="text-xl font-light">Aesthetic Style <span className="text-zinc-400 text-sm">(pick 3)</span></h2>
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
                                    className={`p-5 text-left border rounded-sm transition-all duration-200 ${isSelected
                                        ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900 shadow-md'
                                        : isDisabled
                                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed opacity-50'
                                            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} className="text-zinc-900 dark:text-zinc-100" />}
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{option.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Mood Plate 3: Target Audience */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                            Mood Plate 03
                        </label>
                        <h2 className="text-xl font-light">Visual Audience</h2>
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
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-lg'
                                        : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
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
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                            Mood Plate 04
                        </label>
                        <h2 className="text-xl font-light">Color Directions <span className="text-zinc-400 text-sm">(pick 3)</span></h2>
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
                                    className={`p-5 text-left border rounded-sm transition-all duration-200 ${isSelected
                                        ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900 shadow-md'
                                        : isDisabled
                                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed opacity-50'
                                            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>{option.label}</span>
                                        {isSelected && <Check size={14} className="text-zinc-900 dark:text-zinc-100" />}
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{option.description}</p>
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
            <div className="flex justify-between items-center pt-8 border-t border-[#1A1A1A]/5">
                <button
                    onClick={() => setStep('budget')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
                >
                    <ArrowLeft size={16} strokeWidth={3} />
                    Framework
                </button>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-medium italic font-serif text-[#8A8A8A]">
                        {stepMeta.helperText}
                    </span>
                    <button
                        onClick={() => setStep('generating')}
                        disabled={!canProceed}
                        className="flex items-center gap-3 bg-[#1A1A1A] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#FF4D4D] transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded-2xl shadow-2xl active:scale-95"
                    >
                        Initiate Build
                        <ArrowRight size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};
