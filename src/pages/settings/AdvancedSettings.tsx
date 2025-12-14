
import React from 'react';

export const AdvancedSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-zinc-100">Advanced Settings</h2>
                <p className="text-sm text-zinc-400">Dangerous zones and experimental features.</p>
            </div>

            <div className="rounded-lg border border-red-900/50 bg-red-950/10 p-6">
                <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-zinc-400 mb-4">Irreversible actions that affect your entire account.</p>

                <button className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-md transition-colors">
                    Delete Account
                </button>
            </div>
        </div>
    );
};
