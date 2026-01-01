interface FlowMetric {
  name: string;
  rate: number;
}

interface FlowMetricsProps {
  flows: FlowMetric[];
}

export function FlowMetrics({ flows }: FlowMetricsProps) {
  return (
    <div className="space-y-6">
      {flows.map((flow) => (
        <div key={flow.name} className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">
                {flow.name}
            </span>
            <span className="text-xs font-black text-zinc-900">
                {flow.rate}%
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
              style={{ width: `${flow.rate}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
            <span>Entry</span>
            <span>Completion</span>
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-zinc-50">
        <p className="text-[9px] text-zinc-400 italic">
            * Completion rates calculated based on begun vs successful event capture
        </p>
      </div>
    </div>
  );
}
