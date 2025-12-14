/**
 * CREDENTIALS STEP
 * Add API keys or choose demo mode
 */

import React, { useState } from 'react';
import { Key, Play, ChevronRight, Check, ExternalLink } from 'lucide-react';

interface CredentialsStepProps {
    onComplete: (preferences: { useDemoMode: boolean; hasOwnCredentials: boolean }) => void;
    onSkip: () => void;
    onBack: () => void;
}

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', logo: '🤖', docsUrl: 'https://platform.openai.com/api-keys' },
    { id: 'anthropic', name: 'Anthropic', logo: '🅰️', docsUrl: 'https://console.anthropic.com/' },
    { id: 'google', name: 'Google AI', logo: '🔷', docsUrl: 'https://aistudio.google.com/app/apikey' },
];

export const CredentialsStep: React.FC<CredentialsStepProps> = ({
    onComplete,
    onSkip,
    onBack,
}) => {
    const [mode, setMode] = useState<'choose' | 'add' | 'demo'>('choose');
    const [apiKey, setApiKey] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState(false);

    const handleValidateKey = async () => {
        if (!apiKey.trim() || !selectedProvider) return;

        setIsValidating(true);

        // Call credentials test endpoint
        try {
            // NOTE: In a real app we would hit an endpoint. For now simulating success if key looks real.
            // const response = await fetch('/.netlify/functions/credentials-test', ...);

            let isFakeValid = false;

            // Simple regex checks for common prefixes
            if (selectedProvider === 'openai') {
                isFakeValid = apiKey.startsWith('sk-') && apiKey.length > 20;
            } else if (selectedProvider === 'anthropic') {
                isFakeValid = apiKey.startsWith('sk-ant-') && apiKey.length > 20;
            } else if (selectedProvider === 'google') {
                isFakeValid = apiKey.startsWith('AIza') && apiKey.length > 20;
            } else {
                isFakeValid = apiKey.length > 10;
            }

            await new Promise(r => setTimeout(r, 1000)); // Simulate delay

            setIsValid(isFakeValid);

            if (isFakeValid) {
                // Save credential logic would go here
                // await fetch('/.netlify/functions/credentials-create', ...);
            }
        } catch (error) {
            setIsValid(false);
        }

        setIsValidating(false);
    };

    if (mode === 'choose') {
        return (
            <div className="space-y-6">
                <p className="text-body-md text-text-secondary text-center">
                    To use AI features, you'll need API keys from at least one provider.
                    <br />
                    You can also explore with our demo mode first.
                </p>

                <div className="grid gap-4">
                    <button
                        onClick={() => setMode('add')}
                        className="p-6 rounded-xl border-2 border-brand-teal bg-brand-teal/5 text-left hover:bg-brand-teal/10 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-brand-teal/20">
                                <Key className="w-6 h-6 text-brand-teal" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-label-lg text-text-primary font-semibold">
                                    Add API Key
                                </h3>
                                <p className="text-body-sm text-text-muted">
                                    Connect your own AI provider account
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-muted" />
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            setMode('demo');
                            onComplete({ useDemoMode: true, hasOwnCredentials: false });
                        }}
                        className="p-6 rounded-xl border-2 border-border-subtle text-left hover:border-border-strong transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-brand-magenta/20">
                                <Play className="w-6 h-6 text-brand-magenta" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-label-lg text-text-primary font-semibold">
                                    Use Demo Mode
                                </h3>
                                <p className="text-body-sm text-text-muted">
                                    Try with sample data (no AI generation)
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-muted" />
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={onSkip}
                        className="ml-auto text-body-sm text-text-soft hover:text-text-muted"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'add') {
        return (
            <div className="space-y-6">
                {/* Provider Selection */}
                <div>
                    <label className="text-label-sm text-text-muted uppercase tracking-wide mb-3 block">
                        Select Provider
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {PROVIDERS.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => setSelectedProvider(provider.id)}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${selectedProvider === provider.id
                                    ? 'border-brand-teal bg-brand-teal/10'
                                    : 'border-border-subtle hover:border-border-strong'
                                    }`}
                            >
                                <div className="w-full">
                                    <span className="text-2xl mb-2 block">{provider.logo}</span>
                                    <span className="text-label-sm text-text-primary">{provider.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* API Key Input */}
                {selectedProvider && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-label-sm text-text-muted uppercase tracking-wide">
                                API Key
                            </label>
                            <a
                                href={PROVIDERS.find(p => p.id === selectedProvider)?.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-body-sm text-brand-teal hover:underline"
                            >
                                Get API key <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setIsValid(false);
                                }}
                                placeholder="sk-..."
                                className="w-full px-4 py-3 bg-background-default border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-teal"
                            />
                            {isValid && (
                                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-state-success" />
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4">
                    <button
                        onClick={() => setMode('choose')}
                        className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
                    >
                        ← Back
                    </button>

                    <div className="flex-1" />

                    {!isValid ? (
                        <button
                            onClick={handleValidateKey}
                            disabled={!apiKey.trim() || !selectedProvider || isValidating}
                            className="px-6 py-3 bg-brand-teal text-background-default font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isValidating ? 'Validating...' : 'Validate Key'}
                        </button>
                    ) : (
                        <button
                            onClick={() => onComplete({ useDemoMode: false, hasOwnCredentials: true })}
                            className="px-6 py-3 bg-state-success text-white font-semibold rounded-lg hover:brightness-110 transition-all"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
};


