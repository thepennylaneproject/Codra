import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  current: string | number;
  target: string | number;
  status: 'healthy' | 'warning' | 'critical';
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export function MetricCard({ title, current, target, status, description, trend }: MetricCardProps) {
  const statusColors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {title}
        </h3>
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 tracking-tight">
                {current}
            </span>
            {trend && (
                <div className={`flex items-center text-[10px] font-bold ${trend.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend.value}%
                </div>
            )}
        </div>
        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            Target: {target}
        </div>
      </div>

      {description && (
        <p className="text-[10px] text-zinc-500 leading-relaxed pt-2 border-t border-zinc-50">
            {description}
        </p>
      )}
    </div>
  );
}
