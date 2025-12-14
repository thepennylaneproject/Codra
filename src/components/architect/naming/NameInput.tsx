/**
 * NAME INPUT
 * Input field with real-time validation and collision checking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Check, AlertTriangle, X, Sparkles } from 'lucide-react';
import { namingRegistry, NamingValidation } from '../../../lib/naming/naming-registry';
import type { NamingTargetType, NamingScope } from '../../../types/architect';
import { debounce } from '../../../lib/utils';

interface NameInputProps {
    value: string;
    onChange: (value: string) => void;
    projectId: string;
    kind: NamingTargetType;
    scope: NamingScope;
    label?: string;
    placeholder?: string;
    onSuggest?: () => void;
    disabled?: boolean;
}

export const NameInput: React.FC<NameInputProps> = ({
    value,
    onChange,
    projectId,
    kind,
    scope,
    label,
    placeholder,
    onSuggest,
    disabled = false,
}) => {
    const [validation, setValidation] = useState<NamingValidation | null>(null);
    const [hasCollision, setHasCollision] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Debounced validation
    const validateName = useCallback(
        debounce(async (name: string) => {
            if (!name.trim()) {
                setValidation(null);
                setHasCollision(false);
                setIsChecking(false);
                return;
            }

            setIsChecking(true);

            // Local validation
            const localValidation = namingRegistry.validateName(name, kind, scope);
            setValidation(localValidation);

            // Check collision
            const collision = await namingRegistry.checkCollision(projectId, name, kind);
            setHasCollision(!!collision);

            setIsChecking(false);
        }, 300),
        [projectId, kind, scope]
    );

    useEffect(() => {
        validateName(value);
    }, [value, validateName]);

    const getInputStyle = () => {
        if (!value.trim()) return 'border-border-subtle';
        if (hasCollision) return 'border-state-error focus:border-state-error';
        if (validation && !validation.isValid) return 'border-state-warning focus:border-state-warning';
        if (validation?.isValid) return 'border-state-success focus:border-state-success';
        return 'border-border-subtle';
    };

    return (
        <div className="space-y-2">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-label-sm text-text-muted">{label}</label>
                    {onSuggest && (
                        <button
                            onClick={onSuggest}
                            className="flex items-center gap-1 text-body-sm text-brand-teal hover:text-brand-teal/80"
                            type="button"
                        >
                            <Sparkles className="w-3 h-3" />
                            Suggest
                        </button>
                    )}
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || `Enter ${kind} name...`}
                    disabled={disabled}
                    className={`w-full px-3 py-2 pr-10 bg-background-default border rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal/20 disabled:opacity-50 transition-colors ${getInputStyle()}`}
                />

                {/* Status Icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isChecking && (
                        <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                    )}
                    {!isChecking && value.trim() && (
                        <>
                            {hasCollision && <X className="w-4 h-4 text-state-error" />}
                            {!hasCollision && validation && !validation.isValid && (
                                <AlertTriangle className="w-4 h-4 text-state-warning" />
                            )}
                            {!hasCollision && validation?.isValid && (
                                <Check className="w-4 h-4 text-state-success" />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Validation Messages */}
            {value.trim() && (
                <div className="space-y-1">
                    {hasCollision && (
                        <div className="flex items-start gap-1 text-body-xs text-state-error">
                            <X className="w-3 h-3 mt-0.5" />
                            <p>This name is already used for another {kind}</p>
                        </div>
                    )}
                    {validation?.errors.map((error, i) => (
                        <div key={i} className="flex items-start gap-1 text-body-xs text-state-error">
                            <AlertTriangle className="w-3 h-3 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    ))}
                    {validation?.warnings.map((warning, i) => (
                        <div key={i} className="flex items-start gap-1 text-body-xs text-state-warning">
                            <AlertTriangle className="w-3 h-3 mt-0.5" />
                            <p>{warning}</p>
                        </div>
                    ))}
                    {validation?.suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => onChange(suggestion.replace('Try: ', ''))}
                            className="text-body-xs text-brand-teal hover:underline flex items-center gap-1"
                            type="button"
                        >
                            <Sparkles className="w-3 h-3" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
