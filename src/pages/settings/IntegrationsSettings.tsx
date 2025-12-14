
import React from 'react';
import { Github, Globe } from 'lucide-react';

export const IntegrationsSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-zinc-100">Integrations</h2>
                <p className="text-sm text-zinc-400">Connect Codra to your favorite external tools.</p>
            </div>

            <div className="grid gap-4">
                {/* GitHub */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Github className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-zinc-100">GitHub</h3>
                            <p className="text-sm text-zinc-400">Connect repositories and sync version control.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
                        Connect
                    </button>
                </div>

                {/* Netlify */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-900/30 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-zinc-100">Netlify</h3>
                            <p className="text-sm text-zinc-400">Standard for modern web hosting.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors">
                        Connected
                    </button>
                </div>

                {/* Vercel */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-zinc-700">
                            <svg viewBox="0 0 1155 1000" className="w-5 h-5 text-white" fill="currentColor">
                                <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-zinc-100">Vercel</h3>
                            <p className="text-sm text-zinc-400">Develop. Preview. Ship.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
                        Connect
                    </button>
                </div>
            </div>
        </div>
    );
};
