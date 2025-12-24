import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProjectMetrics } from '../../domain/spread/metrics-engine';
import { cn } from '../../lib/utils';

interface BudgetMeterProps {
    metrics: ProjectMetrics;
    dailyLimit: number;
    className?: string;
}

export function BudgetMeter({ metrics, dailyLimit, className }: BudgetMeterProps) {
    const { burnRate, projectedCost, healthStatus, progress } = metrics;

    // Calculate percentage of daily limit used on average
    const burnPercentage = Math.min(100, (burnRate / dailyLimit) * 100);

    const statusColors = {
        healthy: 'text-emerald-500 bg-emerald-500',
        warning: 'text-amber-500 bg-amber-500',
        critical: 'text-rose-500 bg-rose-500',
    };

    const statusIcons = {
        healthy: CheckCircle2,
        warning: AlertCircle,
        critical: AlertCircle,
    };

    const StatusIcon = statusIcons[healthStatus as keyof typeof statusIcons];

    return (
        <div className={cn("p-4 bg-white border border-zinc-100 rounded-xl shadow-sm", className)}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg bg-opacity-10", statusColors[healthStatus as keyof typeof statusColors].split(' ')[1])}>
                        <StatusIcon size={16} className={statusColors[healthStatus as keyof typeof statusColors].split(' ')[0]} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">Budget Health</h4>
                        <p className="text-[9px] text-zinc-400 uppercase">{healthStatus}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-mono font-bold text-zinc-900">${burnRate.toFixed(2)}<span className="text-[9px] text-zinc-400 font-normal">/day</span></p>
                    <p className="text-[8px] text-zinc-400 uppercase tracking-tighter">Avg Daily Burn</p>
                </div>
            </div>

            {/* Gauge Area */}
            <div className="space-y-3">
                {/* Burn Rate Gauge */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Daily Capacity</span>
                        <span className="text-[9px] font-mono text-zinc-400">${dailyLimit} limit</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${burnPercentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn("h-full rounded-full transition-colors", statusColors[healthStatus as keyof typeof statusColors].split(' ')[1])}
                        />
                    </div>
                </div>

                {/* Total Cost Forecast */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Total Forecast</span>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[8px] font-mono text-zinc-400">Spent</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                                <span className="text-[8px] font-mono text-zinc-400">Proj.</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                        {/* Spent segment */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (metrics.burnRate / metrics.projectedCost) * 100)}%` }} // Approximate spent ratio
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-indigo-500 rounded-l-full"
                        />
                        {/* Projected segment */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, 100 - (metrics.burnRate / metrics.projectedCost) * 100)}%` }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="h-full bg-indigo-200 rounded-r-full"
                        />
                    </div>
                </div>

                {/* Projected Cost vs Progress */}
                <div className="flex gap-4 pt-2 border-t border-zinc-50">
                    <div className="flex-1">
                        <p className="text-[14px] font-mono font-bold text-zinc-900">${projectedCost.toFixed(2)}</p>
                        <p className="text-[8px] text-zinc-400 uppercase tracking-tighter">Projected Total</p>
                    </div>
                    <div className="flex-1 border-l border-zinc-50 pl-4">
                        <p className="text-[14px] font-mono font-bold text-zinc-900">{Math.round(progress)}%</p>
                        <p className="text-[8px] text-zinc-400 uppercase tracking-tighter">Queue Progress</p>
                    </div>
                </div>
            </div>

            {/* Micro-annotation */}
            {healthStatus !== 'healthy' && (
                <div className="mt-3 flex items-start gap-1.5 p-2 bg-rose-50 rounded-lg">
                    <TrendingUp size={10} className="text-rose-500 mt-0.5" />
                    <p className="text-[8px] leading-tight text-rose-600 font-medium">
                        Burn rate is exceeding target. Consider consolidating tasks or upgrading budget policy.
                    </p>
                </div>
            )}
        </div>
    );
}
