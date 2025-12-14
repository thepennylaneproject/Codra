/**
 * DASHBOARD
 * Command center with Cosmic Cockpit Elegance styling
 */

import { useState } from 'react';
import { FileText, Folder, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BenchmarkPanel } from './benchmark/BenchmarkPanel';
import { UsageMeter } from './billing/UsageMeter';
import { AIModelStatusPanel } from './dashboard/AIModelStatusPanel';
import { QuickActionsBar } from './dashboard/QuickActionsBar';
import { RecentActivityPanel } from './dashboard/RecentActivityPanel';
import { GlassPanel } from './ui/GlassPanel';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
    const [showBenchmark, setShowBenchmark] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const openDesignConsole = () => navigate('/settings/appearance');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header - Cosmic styled */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-stardust-warm mb-2">
                    Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
                </h1>
                <p className="text-base text-stardust-muted">Here's what's happening with your projects today.</p>
            </div>

            {/* Stats Row - Glass Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Active Projects"
                    value={3}
                    icon={Folder}
                    glowColor="teal"
                />
                <StatCard
                    label="AI Calls Today"
                    value="1,247"
                    icon={Zap}
                    glowColor="gold"
                />
                <StatCard
                    label="Prompts Created"
                    value={47}
                    icon={FileText}
                    glowColor="teal"
                />

                {/* Usage Meter in Glass Panel */}
                <GlassPanel className="p-4 flex items-center">
                    {user?.id ? (
                        <UsageMeter userId={user.id} />
                    ) : (
                        <div className="w-full h-full animate-pulse bg-white/[0.04] rounded-md" />
                    )}
                </GlassPanel>
            </div>

            {/* Quick Actions */}
            <QuickActionsBar
                openDesignConsole={openDesignConsole}
                setShowBenchmark={setShowBenchmark}
            />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <RecentActivityPanel />

                    {/* Recent Projects Panel */}
                    <GlassPanel className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-stardust flex items-center gap-2">
                                <Folder className="w-5 h-5 text-stardust-muted" />
                                Recent Projects
                            </h3>
                            <button
                                onClick={() => navigate('/projects')}
                                className="text-sm text-energy-teal hover:text-energy-cyan flex items-center gap-1 transition-colors"
                            >
                                View All
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-stardust-muted text-sm py-8 text-center bg-white/[0.02] rounded-xl border border-glass-edge border-dashed">
                            Your recent projects will appear here as cards.
                        </div>
                    </GlassPanel>
                </div>

                {/* Sidebar - 1 col */}
                <div className="space-y-6">
                    <AIModelStatusPanel />

                    {/* Quick Links Panel */}
                    <GlassPanel className="p-5">
                        <h3 className="text-base font-semibold mb-4 text-stardust">Docs & Help</h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="#"
                                    className="text-sm text-stardust-muted hover:text-energy-teal flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-all group"
                                >
                                    Documentation
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-sm text-stardust-muted hover:text-energy-teal flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-all group"
                                >
                                    API Reference
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-sm text-stardust-muted hover:text-energy-teal flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-all group"
                                >
                                    Community Support
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </li>
                        </ul>
                    </GlassPanel>
                </div>
            </div>

            {/* BENCHMARK PANEL OVERLAY */}
            {showBenchmark && (
                <BenchmarkPanel onClose={() => setShowBenchmark(false)} />
            )}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    glowColor?: 'teal' | 'gold' | 'magenta';
}

function StatCard({ label, value, icon: Icon, glowColor = 'teal' }: StatCardProps) {
    const glowStyles = {
        teal: 'bg-energy-teal/10 text-energy-teal shadow-glow-teal-soft',
        gold: 'bg-energy-gold/10 text-energy-gold shadow-glow-gold',
        magenta: 'bg-energy-magenta/10 text-energy-magenta',
    };

    return (
        <GlassPanel className="p-5 flex flex-col justify-between group hover:border-glass-edge-bright transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${glowStyles[glowColor]} transition-all group-hover:scale-105`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-stardust-muted">{label}</h3>
            </div>
            <div className="text-2xl font-bold text-stardust pl-1">{value}</div>
        </GlassPanel>
    );
}
