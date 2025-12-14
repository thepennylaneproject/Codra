
import React from 'react';
import { CredentialsPanel } from '../../components/credentials/CredentialsPanel';

export const CredentialsSettings: React.FC = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h2 className="text-xl font-semibold text-zinc-100">API Credentials</h2>
                <p className="text-sm text-zinc-400">Manage API keys for AI providers and external services.</p>
            </div>

            <div className="flex-1 min-h-0 bg-zinc-950 rounded-lg border border-zinc-800 p-4 overflow-y-auto">
                <CredentialsPanel />
            </div>
        </div>
    );
};
