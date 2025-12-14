import { useState, useEffect } from 'react';
import { SiteSelector } from './SiteSelector';
import { DeployHistory } from './DeployHistory';
import { EnvVarEditor } from './EnvVarEditor';
import { useDeploy } from '@/lib/deploy/hooks';
import { Site, Deploy, EnvVar } from '@/lib/deploy/types';
import { useCredentials } from '@/lib/api/credentials/hooks';
import { AlertCircle, CheckCircle2, RefreshCw, Server, Settings } from 'lucide-react';

export function DeployPanel() {
    const [activeProvider, setActiveProvider] = useState<'netlify' | 'vercel'>('netlify');
    const [token, setToken] = useState<string>('');
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'env'>('overview');

    // We can try to auto-load token from credentials if available
    const { credentials } = useCredentials();

    useEffect(() => {
        if (!token && credentials.length > 0) {
            // Find a credential for the active provider
            // Note: In a real app with encrypted keys, we couldn't just read 'encrypted_key' as plaintext 
            // unless the API returns it decrypted for the owner or we use a proxy. 
            // For this prototype, we'll check if a credential labeled matching the provider exists and try to use it 
            // if the user hasn't manually entered one.
            const cred = credentials.find(c => c.provider === activeProvider);
            if (cred && cred.encrypted_key) {
                // Assuming for this demo the key might be stored/returned in a way we can use, 
                // or we might need the user to input it if this is strictly safe-storage.
                // Let's NOT auto-fill to be safe and avoid confusion with "encrypted" text,
                // unless we are sure.
                // checking cred.metadata or similar might be better. 
                // For now, we rely on manual input or previously saved session.
            }
        }
        const savedToken = localStorage.getItem(`codra_deploy_token_${activeProvider}`);
        if (savedToken) setToken(savedToken);
    }, [activeProvider, credentials, token]);

    const deploy = useDeploy({ provider: activeProvider, token });

    const [sites, setSites] = useState<Site[]>([]);
    const [deploys, setDeploys] = useState<Deploy[]>([]);
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);

    // Load Sites
    useEffect(() => {
        if (token) {
            deploy.listSites().then(setSites);
        } else {
            setSites([]);
        }
    }, [token, deploy.listSites]);

    // Load Site Details (Deploys, Envs) when site changes
    useEffect(() => {
        if (selectedSiteId && token) {
            deploy.listDeploys(selectedSiteId).then(setDeploys);
            deploy.getEnvVars(selectedSiteId).then(setEnvVars);
        }
    }, [selectedSiteId, token, deploy.listDeploys, deploy.getEnvVars]);

    // Poll for active deploys
    useEffect(() => {
        if (!selectedSiteId || !token) return;

        // Check if we have any active deployments that need monitoring
        const hasActiveDeploys = deploys.some(d =>
            d.state === 'building' || d.state === 'queued' || d.state === 'processing'
        );

        if (hasActiveDeploys) {
            const interval = setInterval(() => {
                deploy.listDeploys(selectedSiteId).then(data => {
                    // Only update if changed to avoid unnecessary re-renders or flickers if possible, 
                    // but setting state is fine.
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
            // Refresh list
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
        <div className="h-full flex flex-col bg-background-default text-text-primary">
            {/* Toolbar / Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-background-elevated">
                <div className="flex items-center gap-4">
                    <div className="flex bg-background-subtle rounded-lg p-1 border border-border-subtle">
                        <button
                            onClick={() => { setActiveProvider('netlify'); setSelectedSiteId(null); }}
                            className={`px-3 py-1.5 rounded transition-all text-sm font-medium ${activeProvider === 'netlify'
                                ? 'bg-background-elevated text-text-primary shadow-sm'
                                : 'text-text-muted hover:text-text-primary'
                                }`}
                        >
                            Netlify
                        </button>
                        <button
                            onClick={() => { setActiveProvider('vercel'); setSelectedSiteId(null); }}
                            className={`px-3 py-1.5 rounded transition-all text-sm font-medium ${activeProvider === 'vercel'
                                ? 'bg-background-elevated text-text-primary shadow-sm'
                                : 'text-text-muted hover:text-text-primary'
                                }`}
                        >
                            Vercel
                        </button>
                    </div>

                    {deploy.loading && <span className="text-xs text-text-accent animate-pulse">Syncing...</span>}
                </div>

                <div className="flex items-center gap-2">
                    {!token && <span className="text-xs text-yellow-500">Not connected</span>}
                    {token && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> Connected</span>}
                    <button
                        className="p-2 hover:bg-background-subtle rounded-full text-text-muted transition-colors"
                        onClick={() => setToken('')} // simple logout
                        title="Disconnect"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Sidebar / Left Panel */}
                <div className="w-80 border-r border-border-subtle bg-background-subtle p-6 flex flex-col gap-6 overflow-y-auto">
                    {!token ? (
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-background-elevated border border-border-strong rounded-lg">
                                <h3 className="text-sm font-semibold mb-2">Connect {activeProvider === 'netlify' ? 'Netlify' : 'Vercel'}</h3>
                                <p className="text-xs text-text-muted mb-4">
                                    Enter your Personal Access Token to manage deployments.
                                </p>
                                <input
                                    type="password"
                                    placeholder="Paste token here..."
                                    className="w-full bg-background-default border border-border-subtle rounded px-3 py-2 text-sm text-text-primary mb-3 focus:outline-none focus:border-text-accent"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTokenSave(e.currentTarget.value)
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value) handleTokenSave(e.target.value)
                                    }}
                                />
                                <button
                                    className="w-full bg-text-accent text-background-default font-bold text-xs py-2 rounded hover:brightness-110 transition-colors"
                                >
                                    Connect
                                </button>
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
                                <div className="p-4 bg-background-elevated border border-border-subtle rounded-lg">
                                    <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">Quick Actions</h4>
                                    <button
                                        onClick={handleDeployTrigger}
                                        disabled={deploy.loading}
                                        className="w-full flex items-center justify-center gap-2 bg-text-primary text-background-default font-semibold text-xs py-2 rounded hover:brightness-90 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw size={14} className={deploy.loading ? 'animate-spin' : ''} />
                                        Trigger New Deploy
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Center / Details Panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {selectedSiteId ? (
                        <>
                            <div className="flex border-b border-border-subtle bg-background-elevated">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                                        ? 'border-text-accent text-text-primary'
                                        : 'border-transparent text-text-muted hover:text-text-primary'
                                        }`}
                                >
                                    Overview & History
                                </button>
                                <button
                                    onClick={() => setActiveTab('env')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'env'
                                        ? 'border-text-accent text-text-primary'
                                        : 'border-transparent text-text-muted hover:text-text-primary'
                                        }`}
                                >
                                    Environment Variables
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {deploy.error && (
                                    <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
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
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-12 text-center">
                            <Server size={48} className="mb-4 opacity-20" />
                            <h2 className="text-lg font-medium text-text-soft">Select a site to view details</h2>
                            <p className="text-sm max-w-sm mt-2 opacity-60">
                                Choose a site from the sidebar to view deployment history, logs, and environment variables.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
