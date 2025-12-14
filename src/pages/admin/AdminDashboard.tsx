/**
 * Admin Dashboard - Main Layout
 * 
 * Tabbed interface for admin control plane:
 * - Provider Config
 * - Router Settings
 * - Retrieval Settings
 * - Usage & Costs
 */

import { useState } from 'react';
import { Settings, Zap, Search, BarChart3, ShieldCheck } from 'lucide-react';
import { useAdminCheck } from '../../hooks/useAdminCheck';
import { Navigate } from 'react-router-dom';
import { ProviderConfigPanel } from '../../components/admin/ProviderConfigPanel';
import { RouterSettingsPanel } from '../../components/admin/RouterSettingsPanel';
import { RetrievalSettingsPanel } from '../../components/admin/RetrievalSettingsPanel';
import { UsageCostsPanel } from '../../components/admin/UsageCostsPanel';
import { SeoDashboard } from './SeoDashboard';

type TabId = 'providers' | 'router' | 'retrieval' | 'usage' | 'seo';

export function AdminDashboard() {
    const { isAdmin, isLoading } = useAdminCheck();
    const [activeTab, setActiveTab] = useState<TabId>('providers');

    // Redirect non-admins
    if (!isLoading && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const tabs = [
        { id: 'providers' as TabId, label: 'Provider Config', icon: Settings },
        { id: 'router' as TabId, label: 'Router Settings', icon: Zap },
        { id: 'retrieval' as TabId, label: 'Retrieval Settings', icon: Search },
        { id: 'usage' as TabId, label: 'Usage & Costs', icon: BarChart3 },
        { id: 'seo' as TabId, label: 'SEO Health', icon: ShieldCheck },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/50">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-100">Admin Dashboard</h1>
                            <p className="text-sm text-zinc-400 mt-1">
                                Control routing, retrieval, and usage settings
                            </p>
                        </div>
                        <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <span className="text-xs font-semibold text-purple-400">ADMIN</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-800 bg-zinc-900/20">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-5 py-3 font-medium text-sm
                                        border-b-2 transition-colors
                                        ${isActive
                                            ? 'border-teal-400 text-teal-400'
                                            : 'border-transparent text-zinc-400 hover:text-zinc-100'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {activeTab === 'providers' && <ProviderConfigPanel />}
                {activeTab === 'router' && <RouterSettingsPanel />}
                {activeTab === 'retrieval' && <RetrievalSettingsPanel />}
                {activeTab === 'usage' && <UsageCostsPanel />}
                {activeTab === 'seo' && <SeoDashboard />}
            </div>
        </div>
    );
}
