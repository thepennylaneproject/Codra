
import React from 'react';
import { Users, CreditCard, Activity, TrendingUp } from 'lucide-react';
import { CostTrendChart } from '../../billing/CostTrendChart';

export const OverviewPage: React.FC = () => {

    // Mock data for overview
    const stats = [
        { label: 'Total Users', value: '1,234', change: '+12%', icon: <Users className="w-5 h-5 text-blue-500" /> },
        { label: 'Active Subscriptions', value: '856', change: '+5%', icon: <CreditCard className="w-5 h-5 text-green-500" /> },
        { label: 'AI Spend (MTD)', value: '$432.50', change: '-2%', icon: <Activity className="w-5 h-5 text-orange-500" /> },
        { label: 'System Health', value: '98.9%', change: 'Stable', icon: <TrendingUp className="w-5 h-5 text-purple-500" /> },
    ];

    const mockTrendData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
        cost: Math.random() * 50 + 20
    }));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-surface-glass border border-border-subtle p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-text-muted">{stat.label}</h3>
                            <div className="p-2 bg-background-subtle rounded-lg">
                                {stat.icon}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-primary">{stat.value}</span>
                            <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-500' : stat.change.startsWith('-') ? 'text-red-500' : 'text-gray-500'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Chart */}
                <div className="bg-surface-glass border border-border-subtle p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">AI Cost Trends</h3>
                    <CostTrendChart data={mockTrendData} />
                </div>

                {/* Recent Activity */}
                <div className="bg-surface-glass border border-border-subtle p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-text-primary font-medium">New user signup</span>
                                <span className="text-text-muted ml-auto">2m ago</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
