import React, { useState } from 'react';
import type { ProjectBrand } from '../../../../types/architect';

interface BrandVoiceStepProps {
    data: {
        brand: ProjectBrand;
    };
    updateData: (updates: Partial<{ brand: ProjectBrand }>) => void;
}

const VOICE_SUGGESTIONS = [
    'Professional',
    'Friendly',
    'Technical',
    'Casual',
    'Authoritative',
    'Playful',
    'Minimalist',
    'Bold',
    'Empathetic',
];

const ADJECTIVE_SUGGESTIONS = [
    'Innovative',
    'Trustworthy',
    'Modern',
    'Reliable',
    'Fast',
    'Simple',
    'Powerful',
    'Beautiful',
    'Secure',
];

export const BrandVoiceStep: React.FC<BrandVoiceStepProps> = ({ data, updateData }) => {
    const [customVoiceTag, setCustomVoiceTag] = useState('');
    const [customAdjective, setCustomAdjective] = useState('');
    const [customBannedWord, setCustomBannedWord] = useState('');

    const toggleItem = (array: string[], item: string) => {
        return array.includes(item)
            ? array.filter((i) => i !== item)
            : [...array, item];
    };

    const addCustomItem = (
        field: 'voiceTags' | 'adjectives' | 'bannedWords',
        value: string,
        setter: (val: string) => void
    ) => {
        const trimmed = value.trim();
        if (trimmed && !data.brand[field].includes(trimmed)) {
            updateData({
                brand: { ...data.brand, [field]: [...data.brand[field], trimmed] },
            });
            setter('');
        }
    };

    const removeItem = (field: 'voiceTags' | 'adjectives' | 'bannedWords', item: string) => {
        updateData({
            brand: { ...data.brand, [field]: data.brand[field].filter((i) => i !== item) },
        });
    };

    return (
        <div className="space-y-8">
            <div className="text-body-sm text-text-muted">
                Define your brand voice to help Codra generate copy and content that feels authentic.
            </div>

            {/* Voice Tags */}
            <div>
                <label className="block text-label-md text-text-primary mb-3">
                    🎭 Voice & Tone
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {VOICE_SUGGESTIONS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() =>
                                updateData({
                                    brand: { ...data.brand, voiceTags: toggleItem(data.brand.voiceTags, tag) },
                                })
                            }
                            className={`px-3 py-1.5 rounded-full text-label-sm transition-all ${data.brand.voiceTags.includes(tag)
                                    ? 'bg-brand-teal text-background-default'
                                    : 'bg-background-subtle border border-border-subtle text-text-muted hover:border-brand-teal hover:text-text-primary'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Custom voice tags */}
                {data.brand.voiceTags.filter((t) => !VOICE_SUGGESTIONS.includes(t)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.brand.voiceTags
                            .filter((t) => !VOICE_SUGGESTIONS.includes(t))
                            .map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-full text-label-sm"
                                >
                                    {tag}
                                    <button
                                        onClick={() => removeItem('voiceTags', tag)}
                                        className="hover:text-brand-magenta/70 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customVoiceTag}
                        onChange={(e) => setCustomVoiceTag(e.target.value)}
                        onKeyPress={(e) =>
                            e.key === 'Enter' && addCustomItem('voiceTags', customVoiceTag, setCustomVoiceTag)
                        }
                        placeholder="Add custom voice tag..."
                        className="flex-1 px-3 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal"
                    />
                    <button
                        onClick={() => addCustomItem('voiceTags', customVoiceTag, setCustomVoiceTag)}
                        className="px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-muted hover:text-text-primary hover:border-border-strong transition-colors text-body-sm"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Adjectives */}
            <div>
                <label className="block text-label-md text-text-primary mb-3">
                    ✨ Brand Adjectives
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {ADJECTIVE_SUGGESTIONS.map((adj) => (
                        <button
                            key={adj}
                            onClick={() =>
                                updateData({
                                    brand: { ...data.brand, adjectives: toggleItem(data.brand.adjectives, adj) },
                                })
                            }
                            className={`px-3 py-1.5 rounded-full text-label-sm transition-all ${data.brand.adjectives.includes(adj)
                                    ? 'bg-brand-teal text-background-default'
                                    : 'bg-background-subtle border border-border-subtle text-text-muted hover:border-brand-teal hover:text-text-primary'
                                }`}
                        >
                            {adj}
                        </button>
                    ))}
                </div>

                {/* Custom adjectives */}
                {data.brand.adjectives.filter((a) => !ADJECTIVE_SUGGESTIONS.includes(a)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.brand.adjectives
                            .filter((a) => !ADJECTIVE_SUGGESTIONS.includes(a))
                            .map((adj) => (
                                <span
                                    key={adj}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-full text-label-sm"
                                >
                                    {adj}
                                    <button
                                        onClick={() => removeItem('adjectives', adj)}
                                        className="hover:text-brand-magenta/70 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customAdjective}
                        onChange={(e) => setCustomAdjective(e.target.value)}
                        onKeyPress={(e) =>
                            e.key === 'Enter' &&
                            addCustomItem('adjectives', customAdjective, setCustomAdjective)
                        }
                        placeholder="Add brand adjective..."
                        className="flex-1 px-3 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal"
                    />
                    <button
                        onClick={() => addCustomItem('adjectives', customAdjective, setCustomAdjective)}
                        className="px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-muted hover:text-text-primary hover:border-border-strong transition-colors text-body-sm"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Banned Words */}
            <div>
                <label className="block text-label-md text-text-primary mb-3">
                    🚫 Banned Words
                </label>
                <p className="text-body-sm text-text-muted mb-3">
                    Words or phrases you never want to see in generated content.
                </p>

                {data.brand.bannedWords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.brand.bannedWords.map((word) => (
                            <span
                                key={word}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-state-error/10 text-state-error rounded-full text-label-sm"
                            >
                                {word}
                                <button
                                    onClick={() => removeItem('bannedWords', word)}
                                    className="hover:text-state-error/70 transition-colors"
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customBannedWord}
                        onChange={(e) => setCustomBannedWord(e.target.value)}
                        onKeyPress={(e) =>
                            e.key === 'Enter' &&
                            addCustomItem('bannedWords', customBannedWord, setCustomBannedWord)
                        }
                        placeholder="e.g., synergy, paradigm, disrupt..."
                        className="flex-1 px-3 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal"
                    />
                    <button
                        onClick={() => addCustomItem('bannedWords', customBannedWord, setCustomBannedWord)}
                        className="px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-muted hover:text-text-primary hover:border-border-strong transition-colors text-body-sm"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Tone Notes */}
            <div>
                <label className="block text-label-md text-text-primary mb-2">
                    📝 Additional Tone Notes (optional)
                </label>
                <textarea
                    value={data.brand.toneNotes || ''}
                    onChange={(e) =>
                        updateData({
                            brand: { ...data.brand, toneNotes: e.target.value },
                        })
                    }
                    placeholder="Any other guidance for the brand voice? E.g., 'Avoid corporate jargon, speak like a helpful friend'"
                    rows={3}
                    className="w-full px-4 py-3 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-md placeholder-text-muted focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 resize-none"
                />
            </div>
        </div>
    );
};
