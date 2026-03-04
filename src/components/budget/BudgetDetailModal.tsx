import { AnimatePresence, motion } from 'framer-motion';
import { X, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBudget } from '@/hooks/useBudget';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PROJECT_TOOLS } from '../../domain/types';

interface BudgetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BudgetDetailModal({ isOpen, onClose }: BudgetDetailModalProps) {
    const { spent, limit, percentage, byDesk, byModel, forecast, isLoading } = useBudget();

    if (!isOpen) return null;

    const deskData = Object.entries(byDesk).map(([deskId, cost]) => {
        const desk = PROJECT_TOOLS.find(d => d.id === deskId);
        return {
            name: desk?.label || deskId,
            cost: Number(cost.toFixed(2))
        };
    }).sort((a, b) => b.cost - a.cost);

    const modelData = Object.entries(byModel).map(([modelId, cost]) => ({
        name: modelId,
        cost: Number(cost.toFixed(2))
    })).sort((a, b) => b.cost - a.cost);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.98, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.98, opacity: 0, y: 10 }}
                    className="w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(event) => event.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
                        <div>
                            <h2 className="text-base font-semibold text-text-primary">Budget Analysis</h2>
                            <p className="text-xs text-text-soft mt-1">This Month's Spending Trends</p>
                        </div>
                        <Button onClick={onClose} variant="ghost" className="p-2 hover:bg-zinc-100 rounded-lg">
                            <X size={16} className="text-zinc-500" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-sm text-text-soft animate-pulse">Loading budget data...</div>
                            </div>
                        ) : (
                            <>
                                {/* Summary Section */}
                                <section className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-3xl font-bold text-zinc-900">${spent.toFixed(2)}</div>
                                            <div className="text-xs text-text-soft mt-1">
                                                of ${limit} monthly budget ({percentage.toFixed(0)}%)
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${percentage > 90 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                                {percentage > 90 ? <AlertCircle size={12} /> : <TrendingUp size={12} />}
                                                {percentage > 90 ? 'Near Limit' : 'On Track'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, percentage)}%` }}
                                            className={`h-full ${percentage > 80 ? 'bg-rose-500' : percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        />
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Forecast Section */}
                                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Month-End Forecast</h3>
                                        <div className="text-xl font-bold text-zinc-900">${forecast.toFixed(2)}</div>
                                        <p className="text-[10px] text-zinc-500 mt-1">Based on current daily average</p>
                                        
                                        {forecast > limit && (
                                            <div className="mt-3 flex items-start gap-2 text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                                <p className="text-[10px] leading-tight">
                                                    Projected to exceed budget by ${(forecast - limit).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Daily Limit</h3>
                                        <div className="text-xl font-bold text-zinc-900">${(limit / 30).toFixed(2)}</div>
                                        <p className="text-[10px] text-zinc-500 mt-1">Recommended daily spend</p>
                                        <Button 
                                            variant="ghost" 
                                            className="mt-3 w-full h-8 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-zinc-200"
                                            onClick={onClose}
                                        >
                                            Configure settings <ExternalLink size={10} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Spend by Desk Section */}
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Spend by Desk</h3>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={deskData} layout="vertical">
                                                <XAxis type="number" hide />
                                                <YAxis 
                                                    dataKey="name" 
                                                    type="category" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#71717a' }}
                                                    width={80}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                                                />
                                                <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={20}>
                                                    {deskData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#e4e4e7'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </section>

                                {/* Spend by Model Section */}
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Spend by Model</h3>
                                    <div className="space-y-2">
                                        {modelData.map((model) => (
                                            <div key={model.name} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0 text-xs">
                                                <div className="font-medium text-zinc-700">{model.name}</div>
                                                <div className="font-mono font-semibold">${model.cost.toFixed(2)}</div>
                                            </div>
                                        ))}
                                        {modelData.length === 0 && (
                                            <div className="text-xs text-text-soft italic text-center py-4">No model usage recorded yet this month.</div>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-100 bg-white flex items-center justify-between">
                         <p className="text-[10px] text-zinc-400 max-w-xs">
                            Data updates every 5 minutes. Costs include 20% system markup for infrastructure and maintenance.
                        </p>
                        <Button variant="secondary" onClick={onClose} size="sm" className="text-xs font-bold">
                            Close
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
