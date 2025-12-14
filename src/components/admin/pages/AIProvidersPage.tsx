
import React, { useState } from 'react';
import {
    AlertTriangle, CheckCircle, Eye, EyeOff, Zap,
    Plus, Trash2, RefreshCw, Settings, Clock,
    ChevronDown, ChevronRight, Copy, ExternalLink
} from 'lucide-react';

// ============================================================
// TYPES (Copied from original AdminConsole)
// ============================================================

export type Environment = 'development' | 'staging' | 'production';
export type ProviderStatus = 'active' | 'inactive' | 'error' | 'testing';

export interface APIProvider {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo: string;
    docsUrl: string;
    baseUrl: string;
    models: string[];
    capabilities: ('text' | 'image' | 'video' | 'voice' | 'code')[];
    color: string;
}

export interface APICredential {
    id: string;
    providerId: string;
    environment: Environment;
    apiKey: string;
    status: ProviderStatus;
    lastTested: Date | null;
    monthlyLimit: number | null;
    currentUsage: number;
    createdAt: Date;
}

export interface UsageMetric {
    providerId: string;
    date: string;
    requests: number;
    cost: number;
    tokens: number;
}

// ============================================================
// PROVIDER REGISTRY
// ============================================================

const PROVIDERS: APIProvider[] = [
    {
        id: 'aimlapi',
        name: 'AI/ML API',
        slug: 'aimlapi',
        description: '200+ models via single API - GPT-4, Claude, Llama, DALL-E, Flux & more',
        logo: '🌐',
        docsUrl: 'https://docs.aimlapi.com',
        baseUrl: 'https://api.aimlapi.com/v1',
        models: ['gpt-4o', 'claude-3.5-sonnet', 'llama-3.1-70b', 'flux-pro', 'stable-diffusion-xl'],
        capabilities: ['text', 'image', 'code'],
        color: '#6366f1'
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        slug: 'deepseek',
        description: 'High-performance reasoning models with competitive pricing',
        logo: '🔮',
        docsUrl: 'https://platform.deepseek.com/docs',
        baseUrl: 'https://api.deepseek.com/v1',
        models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
        capabilities: ['text', 'code'],
        color: '#10b981'
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        slug: 'gemini',
        description: 'Google\'s multimodal AI with vision, code & reasoning',
        logo: '💎',
        docsUrl: 'https://ai.google.dev/docs',
        baseUrl: 'https://generativelanguage.googleapis.com/v1',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        capabilities: ['text', 'image', 'code'],
        color: '#3b82f6'
    },
    {
        id: 'deepai',
        name: 'DeepAI',
        slug: 'deepai',
        description: 'Image generation, enhancement & creative tools',
        logo: '🎨',
        docsUrl: 'https://deepai.org/docs',
        baseUrl: 'https://api.deepai.org',
        models: ['text2img', 'super-resolution', 'colorizer', 'toonify'],
        capabilities: ['image'],
        color: '#f59e0b'
    }
];

// ============================================================
// MOCK DATA
// ============================================================

const INITIAL_CREDENTIALS: APICredential[] = [
    {
        id: '1',
        providerId: 'aimlapi',
        environment: 'development',
        apiKey: 'sk-aiml-dev-xxxxxxxxxxxx',
        status: 'active',
        lastTested: new Date(Date.now() - 3600000),
        monthlyLimit: 100,
        currentUsage: 34,
        createdAt: new Date(Date.now() - 86400000 * 7)
    },
    {
        id: '2',
        providerId: 'deepseek',
        environment: 'development',
        apiKey: 'sk-deep-xxxxxxxxxxxx',
        status: 'active',
        lastTested: new Date(Date.now() - 7200000),
        monthlyLimit: 50,
        currentUsage: 12,
        createdAt: new Date(Date.now() - 86400000 * 3)
    }
];

const USAGE_DATA: UsageMetric[] = [
    { providerId: 'aimlapi', date: '2025-11-25', requests: 145, cost: 2.34, tokens: 45000 },
    { providerId: 'aimlapi', date: '2025-11-26', requests: 203, cost: 3.12, tokens: 62000 },
    { providerId: 'aimlapi', date: '2025-11-27', requests: 178, cost: 2.89, tokens: 54000 },
    { providerId: 'aimlapi', date: '2025-11-28', requests: 256, cost: 4.15, tokens: 78000 },
    { providerId: 'aimlapi', date: '2025-11-29', requests: 189, cost: 3.45, tokens: 61000 },
    { providerId: 'deepseek', date: '2025-11-25', requests: 67, cost: 0.45, tokens: 23000 },
    { providerId: 'deepseek', date: '2025-11-26', requests: 89, cost: 0.62, tokens: 31000 },
    { providerId: 'deepseek', date: '2025-11-27', requests: 54, cost: 0.38, tokens: 19000 },
    { providerId: 'deepseek', date: '2025-11-28', requests: 112, cost: 0.78, tokens: 42000 },
    { providerId: 'deepseek', date: '2025-11-29', requests: 76, cost: 0.51, tokens: 27000 },
];

// ============================================================
// SHARED UTILS (Can be moved to a shared file later, keeping here for now)
// ============================================================

export const StatusBadge: React.FC<{ status: ProviderStatus }> = ({ status }) => {
    const styles = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        inactive: 'bg-zinc-500/20 text-text-soft border-zinc-500/30',
        error: 'bg-red-500/20 text-red-400 border-red-500/30',
        testing: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };

    const icons = {
        active: <CheckCircle className="w-3 h-3" />,
        inactive: <Clock className="w-3 h-3" />,
        error: <AlertTriangle className="w-3 h-3" />,
        testing: <RefreshCw className="w-3 h-3 animate-spin" />
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-full ${styles[status]}`}>
            {icons[status]}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const EnvironmentTabs: React.FC<{
    active: Environment;
    onChange: (env: Environment) => void;
}> = ({ active, onChange }) => {
    const envs: Environment[] = ['development', 'staging', 'production'];
    const labels = { development: 'Dev', staging: 'Staging', production: 'Prod' };
    const colors = {
        development: 'text-sky-400 border-sky-400',
        staging: 'text-amber-400 border-amber-400',
        production: 'text-emerald-400 border-emerald-400'
    };

    return (
        <div className="flex gap-1 p-1 bg-background-subtle/50 rounded-lg">
            {envs.map(env => (
                <button
                    key={env}
                    onClick={() => onChange(env)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${active === env
                        ? `bg-zinc-700 ${colors[env]} border border-current`
                        : 'text-text-muted hover:text-text-primary'
                        }`}
                >
                    {labels[env]}
                </button>
            ))}
        </div>
    );
};

export const UsageBar: React.FC<{ current: number; limit: number | null; color: string }> = ({
    current, limit, color
}) => {
    const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;
    const isWarning = percentage > 80;
    const isCritical = percentage > 95;

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-text-muted">
                    {current.toLocaleString()} {limit ? `/ ${limit.toLocaleString()} ` : ''} requests
                </span>
                {limit && (
                    <span className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-text-muted'}>
                        {percentage.toFixed(0)}%
                    </span>
                )}
            </div>
            <div className="h-1.5 bg-background-subtle rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : color
                    }}
                />
            </div>
        </div>
    );
};

const MiniChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const max = Math.max(...data);
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (val / max) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 40" className="w-full h-10">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {data.map((val, i) => (
                <circle
                    key={i}
                    cx={(i / (data.length - 1)) * 100}
                    cy={100 - (val / max) * 100}
                    r="2"
                    fill={color}
                />
            ))}
        </svg>
    );
};

const ProviderCard: React.FC<{
    provider: APIProvider;
    credential: APICredential | undefined;
    onConfigure: () => void;
    onTest: () => void;
    usageData: UsageMetric[];
}> = ({ provider, credential, onConfigure, onTest, usageData }) => {
    const [showKey, setShowKey] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const recentUsage = usageData
        .filter(u => u.providerId === provider.id)
        .slice(-5)
        .map(u => u.requests);

    const totalCost = usageData
        .filter(u => u.providerId === provider.id)
        .reduce((sum, u) => sum + u.cost, 0);

    return (
        <div
            className="group relative bg-surface-glass border border-border-subtle rounded-xl overflow-hidden transition-all hover:border-zinc-700"
            style={{ '--provider-color': provider.color } as React.CSSProperties}
        >
            <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: provider.color }}
            />

            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${provider.color}20` }}
                        >
                            {provider.logo}
                        </div>
                        <div>
                            <h3 className="font-semibold text-text-primary">{provider.name}</h3>
                            <p className="text-xs text-text-muted mt-0.5">{provider.description}</p>
                        </div>
                    </div>
                    {credential && <StatusBadge status={credential.status} />}
                </div>

                <div className="flex gap-1.5 mb-4">
                    {provider.capabilities.map(cap => (
                        <span
                            key={cap}
                            className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-background-subtle text-text-soft rounded"
                        >
                            {cap}
                        </span>
                    ))}
                </div>

                {credential ? (
                    <>
                        <div className="mb-4">
                            <label className="text-xs text-text-muted mb-1.5 block">API Key</label>
                            <div className="flex items-center gap-2 bg-background-subtle/50 rounded-lg p-2">
                                <code className="flex-1 text-xs text-text-primary font-mono truncate">
                                    {showKey ? credential.apiKey : '••••••••••••••••••••'}
                                </code>
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-1 text-text-muted hover:text-text-primary transition"
                                >
                                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(credential.apiKey)}
                                    className="p-1 text-text-muted hover:text-text-primary transition"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <UsageBar
                                current={credential.currentUsage}
                                limit={credential.monthlyLimit}
                                color={provider.color}
                            />
                        </div>

                        {recentUsage.length > 0 && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-text-muted mb-2">
                                    <span>5-day activity</span>
                                    <span>${totalCost.toFixed(2)} spent</span>
                                </div>
                                <MiniChart data={recentUsage} color={provider.color} />
                            </div>
                        )}

                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full flex items-center justify-between text-xs text-text-muted hover:text-text-primary transition mb-3"
                        >
                            <span>{provider.models.length} models available</span>
                            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {expanded && (
                            <div className="flex flex-wrap gap-1.5 mb-4 animate-in fade-in duration-200">
                                {provider.models.map(model => (
                                    <span
                                        key={model}
                                        className="px-2 py-1 text-[10px] font-mono bg-background-subtle text-text-soft rounded"
                                    >
                                        {model}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={onTest}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-background-subtle text-text-primary rounded-lg hover:bg-zinc-700 transition"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Test Connection
                            </button>
                            <button
                                onClick={onConfigure}
                                className="flex items-center justify-center p-2 text-text-muted hover:text-text-primary hover:bg-background-subtle rounded-lg transition"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={onConfigure}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-2 border-dashed border-zinc-700 text-text-soft rounded-lg hover:border-zinc-600 hover:text-text-primary transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add API Key
                    </button>
                )}

                <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-soft hover:text-text-soft transition"
                >
                    <ExternalLink className="w-3 h-3" />
                    Documentation
                </a>
            </div>
        </div>
    );
};

const AddProviderModal: React.FC<{
    provider: APIProvider | null;
    environment: Environment;
    existingCredential: APICredential | null;
    onSave: (data: Partial<APICredential>) => void;
    onDelete: () => void;
    onClose: () => void;
}> = ({ provider, environment, existingCredential, onSave, onDelete, onClose }) => {
    const [apiKey, setApiKey] = useState(existingCredential?.apiKey || '');
    const [monthlyLimit, setMonthlyLimit] = useState(existingCredential?.monthlyLimit?.toString() || '');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    if (!provider) return null;

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTestResult(apiKey.length > 10 ? 'success' : 'error');
        setTesting(false);
    };

    const handleSave = () => {
        onSave({
            providerId: provider.id,
            environment,
            apiKey,
            monthlyLimit: monthlyLimit ? parseInt(monthlyLimit) : null,
            status: testResult === 'success' ? 'active' : 'inactive',
            lastTested: testResult ? new Date() : null
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-zinc-900 border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div
                    className="px-6 py-4 border-b border-border-subtle"
                    style={{ backgroundColor: `${provider.color}10` }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${provider.color}20` }}
                        >
                            {provider.logo}
                        </div>
                        <div>
                            <h2 className="font-semibold text-text-primary">
                                {existingCredential ? 'Edit' : 'Configure'} {provider.name}
                            </h2>
                            <p className="text-xs text-text-muted">
                                Environment: <span className="capitalize">{environment}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={`Enter your ${provider.name} API key`}
                            className="w-full px-4 py-3 bg-background-subtle border border-zinc-700 rounded-lg text-text-primary placeholder:text-text-soft focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Monthly Request Limit (optional)
                        </label>
                        <input
                            type="number"
                            value={monthlyLimit}
                            onChange={(e) => setMonthlyLimit(e.target.value)}
                            placeholder="e.g., 1000"
                            className="w-full px-4 py-3 bg-background-subtle border border-zinc-700 rounded-lg text-text-primary placeholder:text-text-soft focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleTest}
                            disabled={!apiKey || testing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background-subtle text-text-primary rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {testing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Testing connection...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Test Connection
                                </>
                            )}
                        </button>

                        {testResult && (
                            <div className={`mt-3 flex items-center gap-2 text-sm ${testResult === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {testResult === 'success' ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Connection successful! API key is valid.
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-4 h-4" />
                                        Connection failed. Please check your API key.
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-background-subtle/30 border-t border-border-subtle flex items-center justify-between">
                    {existingCredential ? (
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-text-soft hover:text-text-primary transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!apiKey}
                            className="px-5 py-2 text-sm font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {existingCredential ? 'Update' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AIProvidersPage: React.FC = () => {
    const [environment, setEnvironment] = useState<Environment>('development');
    const [credentials, setCredentials] = useState<APICredential[]>(INITIAL_CREDENTIALS);
    const [configureProvider, setConfigureProvider] = useState<APIProvider | null>(null);

    const getCredentialForProvider = (providerId: string) => {
        return credentials.find(c => c.providerId === providerId && c.environment === environment);
    };

    const handleSaveCredential = (data: Partial<APICredential>) => {
        const existing = getCredentialForProvider(data.providerId!);

        if (existing) {
            setCredentials(prev => prev.map(c =>
                c.id === existing.id ? { ...c, ...data } : c
            ));
        } else {
            setCredentials(prev => [...prev, {
                id: Date.now().toString(),
                providerId: data.providerId!,
                environment,
                apiKey: data.apiKey!,
                status: data.status || 'inactive',
                lastTested: data.lastTested || null,
                monthlyLimit: data.monthlyLimit || null,
                currentUsage: 0,
                createdAt: new Date()
            }]);
        }
        setConfigureProvider(null);
    };

    const handleDeleteCredential = () => {
        if (configureProvider) {
            const existing = getCredentialForProvider(configureProvider.id);
            if (existing) {
                setCredentials(prev => prev.filter(c => c.id !== existing.id));
            }
        }
        setConfigureProvider(null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">API Providers</h2>
                    <p className="text-text-muted">Manage your API credentials and integrations.</p>
                </div>
                <EnvironmentTabs active={environment} onChange={setEnvironment} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROVIDERS.map(provider => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        credential={getCredentialForProvider(provider.id)}
                        onConfigure={() => setConfigureProvider(provider)}
                        onTest={() => { /* Quick test handler if needed */ }}
                        usageData={USAGE_DATA}
                    />
                ))}
            </div>

            {configureProvider && (
                <AddProviderModal
                    provider={configureProvider}
                    environment={environment}
                    existingCredential={getCredentialForProvider(configureProvider.id) || null}
                    onSave={handleSaveCredential}
                    onDelete={handleDeleteCredential}
                    onClose={() => setConfigureProvider(null)}
                />
            )}
        </div>
    );
};
