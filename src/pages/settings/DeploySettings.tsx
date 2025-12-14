
import React from 'react';
import { DeployPanel } from '../../components/deploy/DeployPanel';

export const DeploySettings: React.FC = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h2 className="text-xl font-semibold text-zinc-100">Deployment Logic</h2>
                <p className="text-sm text-zinc-400">Configure deployment targets and environments.</p>
            </div>

            <div className="flex-1 min-h-0 bg-zinc-950 rounded-lg border border-zinc-800 p-4 overflow-y-auto">
                {/* Providing dummy props as DeployPanel likely expects some context or props based on usage in other parts */}
                <DeployPanel />
            </div>
        </div>
    );
};
