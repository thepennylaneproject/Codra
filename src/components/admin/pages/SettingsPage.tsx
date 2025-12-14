
import React, { useState } from 'react';

export const SettingsPage: React.FC = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [hardContextLimit, setHardContextLimit] = useState(true);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">System Settings</h2>

            <div className="bg-surface-glass border border-border-subtle rounded-xl p-6 space-y-8">

                {/* General */}
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-subtle pb-2">General</h3>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <h4 className="font-medium text-text-primary">Maintenance Mode</h4>
                            <p className="text-sm text-text-muted">Disable access for non-admin users.</p>
                        </div>
                        <button
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${maintenanceMode ? 'bg-blue-600' : 'bg-zinc-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>
                </div>

                {/* AI Safety */}
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-subtle pb-2">AI Safety Guidelines</h3>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <h4 className="font-medium text-text-primary">Enforce Hard Context Limits</h4>
                            <p className="text-sm text-text-muted">Strictly block requests exceeding context windows to prevent overflow errors.</p>
                        </div>
                        <button
                            onClick={() => setHardContextLimit(!hardContextLimit)}
                            className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${hardContextLimit ? 'bg-blue-600' : 'bg-zinc-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${hardContextLimit ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-subtle pb-2">Notifications</h3>
                    <div className="space-y-3">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-zinc-700 bg-zinc-800" />
                            <span className="text-text-primary">Email alerts for system errors</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-zinc-700 bg-zinc-800" />
                            <span className="text-text-primary">Weekly usage reports</span>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
};
