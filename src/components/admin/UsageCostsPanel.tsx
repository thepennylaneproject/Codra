/**
 * Usage & Costs Panel
 * 
 * Display usage analytics and cost breakdown:
 * - Charts (runs/day, cost/day, provider share)
 * - Latest runs table with drill-in
 */

import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminUsage } from '../../hooks/useAdminUsage';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WORKSPACE_ID = undefined; // Show all workspace data for admin

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];

export function UsageCostsPanel() {
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
    const [expandedRun, setExpandedRun] = useState<string | null>(null);

    const {
        runsPerDay,
        costPerDay,
        providerShare,
        latestRuns,
        totalRuns,
        totalCost,
        isLoading,
        refetch,
    } = useAdminUsage(period, WORKSPACE_ID);

    const periodLabels = {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        '90d': 'Last 90 Days',
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-zinc-400">Loading usage data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Usage & Costs</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Analytics and cost tracking from telemetry data
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as typeof period)}
                        className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-teal-500"
                    >
                        <option value="7d">{periodLabels['7d']}</option>
                        <option value="30d">{periodLabels['30d']}</option>
                        <option value="90d">{periodLabels['90d']}</option>
                    </select>

                    <button
                        onClick={() => refetch()}
                        className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-zinc-100 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                    <div className="text-3xl font-bold text-zinc-100">{totalRuns.toLocaleString()}</div>
                    <div className="text-sm text-zinc-500 mt-1">Total Runs</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                    <div className="text-3xl font-bold text-emerald-400">${totalCost.toFixed(4)}</div>
                    <div className="text-sm text-zinc-500 mt-1">Total Cost</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                    <div className="text-3xl font-bold text-zinc-100">
                        ${totalRuns > 0 ? (totalCost / totalRuns).toFixed(6) : '0.00'}
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">Avg Cost/Run</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
                {/* Runs Per Day */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                    <h3 className="font-semibold text-zinc-100 mb-4">Runs Per Day</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={runsPerDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                            <YAxis stroke="#71717a" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                                labelStyle={{ color: '#a1a1aa' }}
                            />
                            <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Cost Per Day */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                    <h3 className="font-semibold text-zinc-100 mb-4">Cost Per Day</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={costPerDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                            <YAxis stroke="#71717a" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                                labelStyle={{ color: '#a1a1aa' }}
                            />
                            <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Provider Share */}
            {providerShare.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                    <h3 className="font-semibold text-zinc-100 mb-4">Provider Share</h3>
                    <div className="grid grid-cols-2 gap-8">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={providerShare}
                                    dataKey="cost"
                                    nameKey="provider"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {providerShare.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="space-y-3">
                            {providerShare.map((provider, index) => (
                                <div key={provider.provider} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-sm font-medium text-zinc-300 capitalize">
                                            {provider.provider}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-zinc-100">
                                            ${provider.cost.toFixed(4)}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {provider.count} runs
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Latest Runs Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                    <h3 className="font-semibold text-zinc-100">Latest Runs</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Click a row to view trace details
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium">Time</th>
                                <th className="px-6 py-3 text-left font-medium">Task</th>
                                <th className="px-6 py-3 text-left font-medium">Provider</th>
                                <th className="px-6 py-3 text-left font-medium">Model</th>
                                <th className="px-6 py-3 text-right font-medium">Cost</th>
                                <th className="px-6 py-3 text-right font-medium">Latency</th>
                                <th className="px-6 py-3 text-center font-medium">Status</th>
                                <th className="px-6 py-3 text-center font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {latestRuns.map((run) => (
                                <React.Fragment key={run.id}>
                                    <tr
                                        onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                                        className="hover:bg-zinc-800/30 cursor-pointer transition"
                                    >
                                        <td className="px-6 py-4 text-zinc-300">
                                            {new Date(run.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-300">{run.task_type}</td>
                                        <td className="px-6 py-4 text-zinc-300 capitalize">{run.provider_id}</td>
                                        <td className="px-6 py-4 text-zinc-300 font-mono text-xs">{run.model_id}</td>
                                        <td className="px-6 py-4 text-right text-zinc-300">
                                            ${run.actual_cost_usd.toFixed(6)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-zinc-300">{run.latency_ms}ms</td>
                                        <td className="px-6 py-4 text-center">
                                            {run.success ? (
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">
                                                    Error
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-zinc-400">
                                            {expandedRun === run.id ? (
                                                <ChevronUp className="w-4 h-4 inline" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 inline" />
                                            )}
                                        </td>
                                    </tr>

                                    {expandedRun === run.id && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 bg-zinc-800/20">
                                                <div className="space-y-3 text-xs">
                                                    {run.sources_count > 0 && (
                                                        <div>
                                                            <span className="text-zinc-500">Grounded Sources: </span>
                                                            <span className="text-zinc-300">{run.sources_count}</span>
                                                        </div>
                                                    )}

                                                    {run.error_code && (
                                                        <div>
                                                            <span className="text-zinc-500">Error: </span>
                                                            <span className="text-red-400">{run.error_code}</span>
                                                            {run.error_message_safe && (
                                                                <span className="text-zinc-400 ml-2">
                                                                    - {run.error_message_safe}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {run.trace_json && (
                                                        <div>
                                                            <div className="text-zinc-500 mb-2">Trace:</div>
                                                            <pre className="bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300 max-h-64">
                                                                {JSON.stringify(run.trace_json, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    {latestRuns.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            No runs found for the selected period
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
