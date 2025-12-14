/**
 * PROFILE STEP
 * Collect basic user info for personalization
 */

import React, { useState } from 'react';
import type { UserRole, PrimaryUseCase } from '../../../lib/onboarding/onboarding-store';

interface ProfileStepProps {
    initialData: {
        displayName?: string;
        role?: UserRole;
        useCase?: PrimaryUseCase;
        company?: string;
    };
    onComplete: (data: { displayName: string; role: UserRole; useCase: PrimaryUseCase; company: string }) => void;
    onSkip: () => void;
    onBack: () => void;
}

const ROLES: { id: UserRole; label: string }[] = [
    { id: 'developer', label: 'Developer' },
    { id: 'designer', label: 'Designer' },
    { id: 'marketer', label: 'Marketer' },
    { id: 'founder', label: 'Founder' },
    { id: 'student', label: 'Student' },
    { id: 'other', label: 'Other' },
];

const USE_CASES: { id: PrimaryUseCase; label: string }[] = [
    { id: 'content_generation', label: 'Content Gen' },
    { id: 'code_assistance', label: 'Coding' },
    { id: 'design_automation', label: 'Design' },
    { id: 'workflow_orchestration', label: 'Workflows' },
    { id: 'exploration', label: 'Just Exploring' },
];

export const ProfileStep: React.FC<ProfileStepProps> = ({
    initialData,
    onComplete,
    onSkip,
    onBack,
}) => {
    const [formData, setFormData] = useState({
        displayName: initialData.displayName || '',
        role: initialData.role || 'developer',
        useCase: initialData.useCase || 'code_assistance',
        company: initialData.company || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
                <label className="block text-label-sm text-text-secondary mb-2">Display Name</label>
                <input
                    type="text"
                    value={formData.displayName}
                    onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="What should we call you?"
                    className="w-full px-4 py-2 bg-background-default border border-border-subtle rounded-lg focus:border-brand-teal focus:outline-none text-text-primary"
                    required
                />
            </div>

            {/* Role */}
            <div>
                <label className="block text-label-sm text-text-secondary mb-2">My Role</label>
                <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, role: role.id as UserRole }))}
                            className={`
                px-3 py-2 rounded-lg text-label-sm border transition-all
                ${formData.role === role.id
                                    ? 'border-brand-teal bg-brand-teal/10 text-brand-teal font-medium'
                                    : 'border-border-subtle bg-background-default text-text-secondary hover:border-border-strong'}
              `}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Use Case */}
            <div>
                <label className="block text-label-sm text-text-secondary mb-2">Primary Goal</label>
                <select
                    value={formData.useCase}
                    onChange={e => setFormData(prev => ({ ...prev, useCase: e.target.value as PrimaryUseCase }))}
                    className="w-full px-4 py-2 bg-background-default border border-border-subtle rounded-lg focus:border-brand-teal focus:outline-none text-text-primary appearance-none"
                >
                    {USE_CASES.map(uc => (
                        <option key={uc.id} value={uc.id}>{uc.label}</option>
                    ))}
                </select>
            </div>

            {/* Company (Optional) */}
            <div>
                <label className="block text-label-sm text-text-secondary mb-2">Company / Organization <span className="text-text-soft font-normal">(Optional)</span></label>
                <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Where do you work?"
                    className="w-full px-4 py-2 bg-background-default border border-border-subtle rounded-lg focus:border-brand-teal focus:outline-none text-text-primary"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-text-muted hover:text-text-primary px-4 py-2 rounded transition-colors"
                >
                    Back
                </button>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="text-text-soft hover:text-text-muted px-4 py-2 rounded transition-colors text-label-sm"
                    >
                        Skip
                    </button>
                    <button
                        type="submit"
                        className="bg-brand-teal text-background-default px-6 py-2 rounded-lg font-semibold hover:brightness-110 transition-all"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </form>
    );
};
