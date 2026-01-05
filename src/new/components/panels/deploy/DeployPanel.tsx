import { useState, useEffect } from 'react';
import { SiteSelector } from './SiteSelector';
import { DeployHistory } from './DeployHistory';
import { EnvVarEditor } from './EnvVarEditor';
import { useDeploy } from '../../../../lib/deploy/hooks';
import { Site, Deploy, EnvVar } from '../../../../lib/deploy/types';
import { AlertCircle, CheckCircle2, RefreshCw, Settings, Globe, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/Button';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function DeployPanel() {
    const [activeProvider, setActiveProvider] = useState<'netlify' | 'vercel'>('netlify');
    const [token, setToken] = useState<string>('');
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'env'>('overview');

    useEffect(() => {
        const savedToken = localStorage.getItem(`codra_deploy_token_${activeProvider}`);
        if (savedToken) setToken(savedToken);
        else setToken('');
    }, [activeProvider]);

    const deploy = useDeploy({ provider: activeProvider, token });

    const [sites, setSites] = useState<Site[]>([]);
    const [deploys, setDeploys] = useState<Deploy[]>([]);
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);

    useEffect(() => {
        if (token) {
            deploy.listSites().then(setSites);
        } else {
            setSites([]);
        }
    }, [token, deploy.listSites]);

    useEffect(() => {
        if (selectedSiteId && token) {
            deploy.listDeploys(selectedSiteId).then(setDeploys);
            deploy.getEnvVars(selectedSiteId).then(setEnvVars);
        }
    }, [selectedSiteId, token, deploy.listDeploys, deploy.getEnvVars]);

    useEffect(() => {
        if (!selectedSiteId || !token) return;

        const hasActiveDeploys = deploys.some(d =>
            d.state === 'building' || d.state === 'queued' || d.state === 'processing'
        );

        if (hasActiveDeploys) {
            const interval = setInterval(() => {
                deploy.listDeploys(selectedSiteId).then(data => {
                    setDeploys(data);
                });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedSiteId, token, deploys, deploy.listDeploys]);

    const handleTokenSave = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem(`codra_deploy_token_${activeProvider}`, newToken);
    };

    const handleDeployTrigger = async () => {
        if (!selectedSiteId) return;
        const newDeploy = await deploy.triggerDeploy(selectedSiteId);
        if (newDeploy) {
            const updated = await deploy.listDeploys(selectedSiteId);
            setDeploys(updated);
        }
    };

    const handleEnvSave = async (key: string, value: string) => {
        if (!selectedSiteId) return;
        const success = await deploy.updateEnvVar(selectedSiteId, key, value);
        if (success) {
            const updated = await deploy.getEnvVars(selectedSiteId);
            setEnvVars(updated);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
            {/* Action Bar */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <Button
                            onClick={() => { setActiveProvider('netlify'); setSelectedSiteId(null); }}
                            className={cn(
                                "px-4 py-1 rounded-lg transition-all text-xs font-semibold",
                                activeProvider === 'netlify'
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                            )}
                        >
                            Netlify
                        </Button>
                        <Button
                            onClick={() => { setActiveProvider('vercel'); setSelectedSiteId(null); }}
                            className={cn(
                                "px-4 py-1 rounded-lg transition-all text-xs font-semibold",
                                activeProvider === 'vercel'
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                            )}
                        >
                            Vercel
                        </Button>
                    </div>

                    {deploy.loading && (
                        <div className="flex items-center gap-2 text-xs font-mono text-rose-500 animate-pulse">
                            <RefreshCw size={10} className="animate-spin" />
                            Synchronizing
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {!token ? (
                        <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                            <AlertCircle size={10} />
                            Key Required
                        </span>
                    ) : (
                        <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                            <CheckCircle2 size={10} />
                            Verified
                        </span>
                    )}
                    <Button
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-400 transition-all hover:text-zinc-600"
                        onClick={() => {
                            setToken('');
                            localStorage.removeItem(`codra_deploy_token_${activeProvider}`);
                        }}
                        title="Reset Token"
                    >
                        <Settings size={16} />
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex">
                {/* Configuration Sidebar */}
                <aside className="w-80 border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 p-6 flex flex-col gap-8 overflow-y-auto">
                    {!token ? (
                        <div className="space-y-6">
                            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                        Connect {activeProvider}
                                    </h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                        Enter your Personal Access Token to bridge your local workspace to production.
                                    </p>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Paste access token..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner"
                                    onBlur={(e) => {
                                        if (e.target.value) handleTokenSave(e.target.value)
                                    }}
                                />
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                                    <p className="text-xs text-zinc-400 font-mono leading-tight">
                                        Your token is stored locally in your browser for session persistence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <SiteSelector
                                sites={sites}
                                selectedSiteId={selectedSiteId}
                                onSelect={setSelectedSiteId}
                                loading={deploy.loading && sites.length === 0}
                            />

                            {selectedSiteId && (
                                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                                    <h4 className="text-xs font-semibold text-zinc-400">Release Management</h4>
                                    <Button
                                        onClick={handleDeployTrigger}
                                        disabled={deploy.loading}
                                        className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-zinc-900/10 dark:shadow-none"
                                    >
                                        <RefreshCw size={12} className={deploy.loading ? 'animate-spin' : ''} />
                                        Trigger Release
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </aside>

                {/* Main Workspace */}
                <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
                    {selectedSiteId ? (
                        <>
                            <nav className="flex px-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Button
                                    onClick={() => setActiveTab('overview')}
                                    className={cn(
                                        "px-6 py-4 text-xs font-semibold border-b-2 transition-all",
                                        activeTab === 'overview'
                                            ? 'border-zinc-900 text-zinc-900 dark:text-zinc-100'
                                            : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                                    )}
                                >
                                    Event History
                                </Button>
                                <Button
                                    onClick={() => setActiveTab('env')}
                                    className={cn(
                                        "px-6 py-4 text-xs font-semibold border-b-2 transition-all",
                                        activeTab === 'env'
                                            ? 'border-zinc-900 text-zinc-900 dark:text-zinc-100'
                                            : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                                    )}
                                >
                                    Global Config
                                </Button>
                            </nav>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {deploy.error && (
                                    <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-3">
                                        <AlertCircle size={16} />
                                        {deploy.error}
                                    </div>
                                )}

                                {activeTab === 'overview' && (
                                    <DeployHistory deploys={deploys} loading={deploy.loading && deploys.length === 0} />
                                )}

                                {activeTab === 'env' && (
                                    <EnvVarEditor envVars={envVars} onSave={handleEnvSave} loading={deploy.loading && envVars.length === 0} />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-200 dark:text-zinc-800">
                                <Globe size={40} strokeWidth={1.5} />
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tighter">Production Overview</h2>
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                    Select a production target from the sidebar to continue.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                                <span>Awaiting Target Selection</span>
                                <ChevronRight size={10} />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
