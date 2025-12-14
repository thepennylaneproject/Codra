import React, { useState } from 'react';

interface GoalsStepProps {
    data: {
        primaryGoal: string;
        secondaryGoals: string[];
        targetUsers: string[];
    };
    updateData: (updates: Partial<{ primaryGoal: string; secondaryGoals: string[]; targetUsers: string[] }>) => void;
}

export const GoalsStep: React.FC<GoalsStepProps> = ({ data, updateData }) => {
    const [newSecondaryGoal, setNewSecondaryGoal] = useState('');
    const [newTargetUser, setNewTargetUser] = useState('');

    const addSecondaryGoal = () => {
        if (newSecondaryGoal.trim()) {
            updateData({ secondaryGoals: [...data.secondaryGoals, newSecondaryGoal.trim()] });
            setNewSecondaryGoal('');
        }
    };

    const removeSecondaryGoal = (index: number) => {
        updateData({ secondaryGoals: data.secondaryGoals.filter((_, i) => i !== index) });
    };

    const addTargetUser = () => {
        if (newTargetUser.trim()) {
            updateData({ targetUsers: [...data.targetUsers, newTargetUser.trim()] });
            setNewTargetUser('');
        }
    };

    const removeTargetUser = (index: number) => {
        updateData({ targetUsers: data.targetUsers.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-8">
            {/* Primary Goal */}
            <div>
                <label className="block text-label-md text-text-primary mb-2">
                    Primary Goal <span className="text-brand-magenta">*</span>
                </label>
                <textarea
                    value={data.primaryGoal}
                    onChange={(e) => updateData({ primaryGoal: e.target.value })}
                    placeholder="e.g., Help job seekers create tailored resumes and track applications in one place"
                    rows={3}
                    className="w-full px-4 py-3 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-md placeholder-text-muted focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 resize-none"
                />
                <p className="mt-2 text-body-sm text-text-muted">
                    The single most important thing this project should accomplish.
                </p>
            </div>

            {/* Secondary Goals */}
            <div>
                <label className="block text-label-md text-text-primary mb-2">
                    Secondary Goals
                </label>
                <div className="space-y-2 mb-3">
                    {data.secondaryGoals.map((goal, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-background-subtle rounded-lg border border-border-subtle"
                        >
                            <span className="flex-1 text-body-sm text-text-primary">{goal}</span>
                            <button
                                onClick={() => removeSecondaryGoal(index)}
                                className="text-text-muted hover:text-state-error transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSecondaryGoal}
                        onChange={(e) => setNewSecondaryGoal(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSecondaryGoal()}
                        placeholder="Add a secondary goal..."
                        className="flex-1 px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal"
                    />
                    <button
                        onClick={addSecondaryGoal}
                        className="px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-muted hover:text-text-primary hover:border-border-strong transition-colors"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Target Users */}
            <div>
                <label className="block text-label-md text-text-primary mb-2">
                    Who is this for?
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {data.targetUsers.map((user, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-teal/10 text-brand-teal rounded-full text-label-sm"
                        >
                            {user}
                            <button
                                onClick={() => removeTargetUser(index)}
                                className="hover:text-brand-teal/70 transition-colors"
                            >
                                ✕
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTargetUser}
                        onChange={(e) => setNewTargetUser(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTargetUser()}
                        placeholder="e.g., Small business owners, Developers, Job seekers"
                        className="flex-1 px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal"
                    />
                    <button
                        onClick={addTargetUser}
                        className="px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-muted hover:text-text-primary hover:border-border-strong transition-colors"
                    >
                        + Add
                    </button>
                </div>
                <p className="mt-2 text-body-sm text-text-muted">
                    Understanding your audience helps Codra tailor copy and UX suggestions.
                </p>
            </div>
        </div>
    );
};
