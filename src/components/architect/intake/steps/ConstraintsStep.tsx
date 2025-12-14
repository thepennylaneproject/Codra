import React from 'react';
import type { ProjectConstraints, BudgetLevel, Timeline, ComplexityTolerance } from '../../../../types/architect';

interface ConstraintsStepProps {
    data: {
        constraints: ProjectConstraints;
    };
    updateData: (updates: Partial<{ constraints: ProjectConstraints }>) => void;
}

const BUDGET_OPTIONS: { value: BudgetLevel; label: string; description: string }[] = [
    { value: 'low', label: 'Bootstrap', description: 'Minimize costs, use free tiers' },
    { value: 'medium', label: 'Moderate', description: 'Balanced approach, some paid services' },
    { value: 'high', label: 'Invest', description: 'Premium services, no cost constraints' },
];

const TIMELINE_OPTIONS: { value: Timeline; label: string; description: string }[] = [
    { value: 'rush', label: 'Fast Track', description: 'Ship ASAP, iterate later' },
    { value: 'normal', label: 'Steady', description: 'Normal pace, balanced' },
    { value: 'long_horizon', label: 'Long-term', description: 'No rush, build it right' },
];

const COMPLEXITY_OPTIONS: { value: ComplexityTolerance; label: string; description: string }[] = [
    { value: 'simple', label: 'Keep it Simple', description: 'Minimal features, easy to maintain' },
    { value: 'moderate', label: 'Balanced', description: 'Some complexity is okay' },
    { value: 'complex', label: 'Sophisticated', description: 'Advanced features, embrace complexity' },
];

export const ConstraintsStep: React.FC<ConstraintsStepProps> = ({ data, updateData }) => {
    const updateConstraint = <K extends keyof ProjectConstraints>(
        key: K,
        value: ProjectConstraints[K]
    ) => {
        updateData({
            constraints: { ...data.constraints, [key]: value },
        });
    };

    const renderRadioGroup = <T extends string>(
        label: string,
        emoji: string,
        options: { value: T; label: string; description: string }[],
        currentValue: T,
        onChange: (value: T) => void
    ) => (
        <div>
            <label className="block text-label-md text-text-primary mb-4">
                {emoji} {label}
            </label>
            <div className="space-y-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`w-full p-4 text-left rounded-lg border transition-all ${currentValue === option.value
                                ? 'bg-brand-teal/10 border-brand-teal'
                                : 'bg-background-subtle border-border-subtle hover:border-border-strong'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-label-md text-text-primary font-medium">
                                {option.label}
                            </span>
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentValue === option.value
                                        ? 'border-brand-teal bg-brand-teal'
                                        : 'border-border-subtle'
                                    }`}
                            >
                                {currentValue === option.value && (
                                    <div className="w-2 h-2 bg-background-default rounded-full" />
                                )}
                            </div>
                        </div>
                        <p className="text-body-sm text-text-muted">{option.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="text-body-sm text-text-muted">
                Help Codra understand your constraints so it can make smarter recommendations.
            </div>

            {renderRadioGroup(
                'Budget Level',
                '💰',
                BUDGET_OPTIONS,
                data.constraints.budgetLevel,
                (value) => updateConstraint('budgetLevel', value)
            )}

            {renderRadioGroup(
                'Timeline',
                '⏱️',
                TIMELINE_OPTIONS,
                data.constraints.timeline,
                (value) => updateConstraint('timeline', value)
            )}

            {renderRadioGroup(
                'Complexity Tolerance',
                '🎚️',
                COMPLEXITY_OPTIONS,
                data.constraints.complexityTolerance,
                (value) => updateConstraint('complexityTolerance', value)
            )}

            {/* Optional: Monthly AI Cost */}
            <div>
                <label className="block text-label-md text-text-primary mb-2">
                    💸 Max Monthly AI Cost (optional)
                </label>
                <input
                    type="number"
                    value={data.constraints.maxMonthlyAICost || ''}
                    onChange={(e) =>
                        updateConstraint('maxMonthlyAICost', e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-md placeholder-text-muted focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                />
                <p className="mt-2 text-body-sm text-text-muted">
                    Set a budget for AI API costs. Leave empty for no limit.
                </p>
            </div>
        </div>
    );
};
