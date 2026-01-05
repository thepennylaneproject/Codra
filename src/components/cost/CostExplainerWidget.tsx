import { HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCostEstimate } from '@/hooks/useCostEstimate';
import { useState } from 'react';
import { CompareModelsModal } from './CompareModelsModal';

interface Props {
    modelId: string;
    taskType: string;
    onModelChange: (modelId: string) => void;
}

export function CostExplainerWidget({ modelId, taskType, onModelChange }: Props) {
    const { data, isLoading } = useCostEstimate(modelId, taskType);
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-between p-3 bg-[#FFFAF0]/30 rounded-xl border border-[#1A1A1A]/5 animate-pulse">
                <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-zinc-300" />
                    <div className="h-3 w-20 bg-zinc-100 rounded" />
                </div>
                <div className="h-3 w-16 bg-zinc-100 rounded" />
            </div>
        );
    }

    const { estimate, approvalRate } = data || {};

    return (
        <>
            <div className="group relative flex items-center justify-between p-3 bg-[#FFFAF0] rounded-xl border border-[#1A1A1A]/5 hover:border-[#1A1A1A]/10 transition-all shadow-sm">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary">
                            Est. ${estimate?.toFixed(3) || '0.000'}
                        </span>
                        <div className="relative group/tooltip">
                            <HelpCircle size={10} className="text-zinc-300 group-hover/tooltip:text-zinc-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 leading-relaxed">
                                Estimate based on task complexity and average context size. Includes 20% system markup.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold ${approvalRate && approvalRate >= 80 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                            {approvalRate ? `${approvalRate}% approval rate` : 'No history yet'}
                        </span>
                        {approvalRate && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                    </div>
                </div>

                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCompareOpen(true)}
                    className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-text-soft hover:text-text-primary hover:bg-white border border-transparent hover:border-[#1A1A1A]/10 rounded-lg shadow-none"
                >
                    Compare Models
                </Button>
            </div>

            <CompareModelsModal
                isOpen={isCompareOpen}
                onClose={() => setIsCompareOpen(false)}
                currentModel={modelId}
                taskType={taskType}
                onSelectModel={onModelChange}
            />
        </>
    );
}
