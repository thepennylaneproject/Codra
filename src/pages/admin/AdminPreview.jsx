import React, { useState } from 'react';
import { 
  Key, Shield, Zap, AlertTriangle, CheckCircle, Eye, EyeOff, 
  Plus, Trash2, RefreshCw, Settings, BarChart3, Clock, 
  ChevronDown, ChevronRight, Copy, ExternalLink, Activity, X
} from 'lucide-react';

// Types
const PROVIDERS = [
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
    description: "Google's multimodal AI with vision, code & reasoning",
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

const INITIAL_CREDENTIALS = [
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

const USAGE_DATA = [
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

// Components
const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
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

const EnvironmentTabs = ({ active, onChange }) => {
  const envs = ['development', 'staging', 'production'];
  const labels = { development: 'Dev', staging: 'Staging', production: 'Prod' };
  const colors = {
    development: 'text-sky-400 border-sky-400',
    staging: 'text-amber-400 border-amber-400',
    production: 'text-emerald-400 border-emerald-400'
  };

  return (
    <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg">
      {envs.map(env => (
        <button
          key={env}
          onClick={() => onChange(env)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            active === env 
              ? `bg-zinc-700 ${colors[env]} border border-current` 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {labels[env]}
        </button>
      ))}
    </div>
  );
};

const UsageBar = ({ current, limit, color }) => {
  const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">
          {current.toLocaleString()} {limit ? `/ ${limit.toLocaleString()}` : ''} requests
        </span>
        {limit && (
          <span className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-500'}>
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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

const MiniChart = ({ data, color }) => {
  const max = Math.max(...data);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 40 - (val / max) * 35;
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
    </svg>
  );
};

const ProviderCard = ({ provider, credential, onConfigure, onTest, usageData }) => {
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
    <div className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all hover:border-zinc-700">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: provider.color }} />

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
              <h3 className="font-semibold text-zinc-100">{provider.name}</h3>
              <p className="text-xs text-zinc-500 mt-0.5 max-w-[200px] truncate">{provider.description}</p>
            </div>
          </div>
          {credential && <StatusBadge status={credential.status} />}
        </div>

        <div className="flex gap-1.5 mb-4">
          {provider.capabilities.map(cap => (
            <span 
              key={cap}
              className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-zinc-800 text-zinc-400 rounded"
            >
              {cap}
            </span>
          ))}
        </div>

        {credential ? (
          <>
            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-1.5 block">API Key</label>
              <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2">
                <code className="flex-1 text-xs text-zinc-300 font-mono truncate">
                  {showKey ? credential.apiKey : '••••••••••••••••••••'}
                </code>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button className="p-1 text-zinc-500 hover:text-zinc-300 transition">
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
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>5-day activity</span>
                  <span>${totalCost.toFixed(2)} spent</span>
                </div>
                <MiniChart data={recentUsage} color={provider.color} />
              </div>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 transition mb-3"
            >
              <span>{provider.models.length} models available</span>
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {provider.models.map(model => (
                  <span 
                    key={model}
                    className="px-2 py-1 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded"
                  >
                    {model}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onTest}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                Test Connection
              </button>
              <button
                onClick={onConfigure}
                className="flex items-center justify-center p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onConfigure}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-2 border-dashed border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-600 hover:text-zinc-300 transition"
          >
            <Plus className="w-4 h-4" />
            Add API Key
          </button>
        )}

        <a 
          href={provider.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition"
        >
          <ExternalLink className="w-3 h-3" />
          Documentation
        </a>
      </div>
    </div>
  );
};

const UsageDashboard = ({ credentials, usageData }) => {
  const totalRequests = usageData.reduce((sum, u) => sum + u.requests, 0);
  const totalCost = usageData.reduce((sum, u) => sum + u.cost, 0);
  const totalTokens = usageData.reduce((sum, u) => sum + u.tokens, 0);

  const costByProvider = PROVIDERS.map(p => ({
    provider: p,
    cost: usageData.filter(u => u.providerId === p.id).reduce((sum, u) => sum + u.cost, 0)
  })).filter(x => x.cost > 0).sort((a, b) => b.cost - a.cost);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-zinc-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Usage Overview</h2>
        <span className="ml-auto text-xs text-zinc-500">Last 30 days</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-zinc-100">{totalRequests.toLocaleString()}</div>
          <div className="text-xs text-zinc-500 mt-1">Total Requests</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-400">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-1">Total Spend</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-zinc-100">{(totalTokens / 1000).toFixed(0)}K</div>
          <div className="text-xs text-zinc-500 mt-1">Tokens Used</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Cost by Provider</h3>
        <div className="space-y-3">
          {costByProvider.map(({ provider, cost }) => (
            <div key={provider.id} className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: `${provider.color}20` }}
              >
                {provider.logo}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300">{provider.name}</span>
                  <span className="text-zinc-400">${cost.toFixed(2)}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(cost / totalCost) * 100}%`,
                      backgroundColor: provider.color
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Modal = ({ provider, environment, existingCredential, onSave, onClose }) => {
  const [apiKey, setApiKey] = useState(existingCredential?.apiKey || '');
  const [monthlyLimit, setMonthlyLimit] = useState(existingCredential?.monthlyLimit?.toString() || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!provider) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestResult(apiKey.length > 10 ? 'success' : 'error');
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800" style={{ backgroundColor: `${provider.color}10` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${provider.color}20` }}
              >
                {provider.logo}
              </div>
              <div>
                <h2 className="font-semibold text-zinc-100">
                  {existingCredential ? 'Edit' : 'Configure'} {provider.name}
                </h2>
                <p className="text-xs text-zinc-500">
                  Environment: <span className="capitalize">{environment}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider.name} API key`}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Monthly Limit (optional)</label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="e.g., 1000"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={!apiKey || testing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-50 transition"
          >
            {testing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Testing...</>
            ) : (
              <><Zap className="w-4 h-4" /> Test Connection</>
            )}
          </button>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {testResult === 'success' ? (
                <><CheckCircle className="w-4 h-4" /> Connection successful!</>
              ) : (
                <><AlertTriangle className="w-4 h-4" /> Connection failed.</>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-zinc-800/30 border-t border-zinc-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ apiKey, monthlyLimit: monthlyLimit ? parseInt(monthlyLimit) : null });
              onClose();
            }}
            disabled={!apiKey}
            className="px-5 py-2 text-sm font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CodraAdminConsole() {
  const [environment, setEnvironment] = useState('development');
  const [credentials, setCredentials] = useState(INITIAL_CREDENTIALS);
  const [configureProvider, setConfigureProvider] = useState(null);

  const getCredentialForProvider = (providerId) => {
    return credentials.find(c => c.providerId === providerId && c.environment === environment);
  };

  const handleSaveCredential = (providerId, data) => {
    const existing = getCredentialForProvider(providerId);
    
    if (existing) {
      setCredentials(prev => prev.map(c => 
        c.id === existing.id ? { ...c, ...data } : c
      ));
    } else {
      setCredentials(prev => [...prev, {
        id: Date.now().toString(),
        providerId,
        environment,
        apiKey: data.apiKey,
        status: 'active',
        lastTested: new Date(),
        monthlyLimit: data.monthlyLimit,
        currentUsage: 0,
        createdAt: new Date()
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Codra</span>
            </div>
            <span className="text-xs text-zinc-600 px-2 py-0.5 bg-zinc-800 rounded">Admin</span>
          </div>
          
          <EnvironmentTabs active={environment} onChange={setEnvironment} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">API Providers</h1>
          <p className="text-zinc-500">Manage credentials and monitor usage across services.</p>
        </div>

        <div className="mb-8">
          <UsageDashboard credentials={credentials} usageData={USAGE_DATA} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROVIDERS.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              credential={getCredentialForProvider(provider.id)}
              usageData={USAGE_DATA}
              onConfigure={() => setConfigureProvider(provider)}
              onTest={() => {}}
            />
          ))}
        </div>

        <div className="mt-6">
          <button className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-zinc-800 text-zinc-500 rounded-xl hover:border-zinc-700 hover:text-zinc-400 transition">
            <Plus className="w-5 h-5" />
            Add Custom Provider
          </button>
        </div>
      </main>

      {configureProvider && (
        <Modal
          provider={configureProvider}
          environment={environment}
          existingCredential={getCredentialForProvider(configureProvider.id)}
          onSave={(data) => handleSaveCredential(configureProvider.id, data)}
          onClose={() => setConfigureProvider(null)}
        />
      )}
    </div>
  );
}
