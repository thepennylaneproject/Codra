import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { costEngine } from '@/lib/ai/cost';
import { smartRouter } from '@/lib/ai/router/smart-router';

interface CompareModelsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel: string;
    taskType: string;
    onSelectModel: (modelId: string) => void;
}

export function CompareModelsModal({
    isOpen,
    onClose,
    currentModel,
    taskType,
    onSelectModel,
}: CompareModelsModalProps) {
    const models = costEngine.getAllModels();

    // In a real app, we'd fetch all rates at once. 
    // For MVP, we'll use a simplified version or a bulk hook.
    // Here we'll just show the comparison based on static quality and cost indices.

    if (!isOpen) return null;

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
                    className="w-full max-w-4xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(event) => event.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-text-primary">Compare AI Models</h2>
                            <p className="text-xs text-text-soft mt-1">
                                Evaluate cost, quality, and performance for <span className="font-bold">{taskType}</span> tasks.
                            </p>
                        </div>
                        <Button onClick={onClose} variant="ghost" className="p-2 hover:bg-zinc-100 rounded-lg">
                            <X size={16} className="text-zinc-500" />
                        </Button>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-y-auto p-0">
                        <Table>
                            <TableHeader className="bg-zinc-50/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[200px]">Model</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Est. Cost</TableHead>
                                    <TableHead>Quality Index</TableHead>
                                    <TableHead>Latency</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {models.map((model) => {
                                    const isCurrent = model.id === currentModel;
                                    const isRecommended = model.quality >= 0.9 && (model.inputCostPer1k + model.outputCostPer1k) < 0.02;
                                    const estTokens = costEngine.estimateTokens(taskType);
                                    const estCost = costEngine.estimateCost(model.id, estTokens);

                                    return (
                                        <TableRow 
                                            key={model.id}
                                            className={isRecommended ? 'bg-emerald-50/30' : ''}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span>{smartRouter.getModelDisplayName(model.id)}</span>
                                                    {isRecommended && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                                            <Star size={10} fill="currentColor" />
                                                            Best Value
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-zinc-500 text-xs">
                                                {smartRouter.getProviderDisplayName(model.provider)}
                                            </TableCell>
                                            <TableCell className="text-zinc-900 font-semibold">
                                                ${estCost.toFixed(3)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-rose-500" 
                                                            style={{ width: `${model.quality * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-zinc-400 font-bold">{(model.quality * 100).toFixed(0)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium">
                                                    <Zap size={10} className={model.latencyScore > 0.7 ? "text-amber-500" : "text-zinc-300"} />
                                                    {model.latencyScore > 0.8 ? "Fast" : model.latencyScore > 0.5 ? "Average" : "Slow"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isCurrent ? (
                                                    <div className="text-rose-500 font-bold text-xs flex items-center justify-end gap-1">
                                                        <Check size={14} />
                                                        Selected
                                                    </div>
                                                ) : (
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary"
                                                        onClick={() => {
                                                            onSelectModel(model.id);
                                                            onClose();
                                                        }}
                                                        className="text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        Select
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
                        <p className="text-[10px] text-zinc-400 font-medium max-w-md">
                            Costs are estimates based on average task complexity and include a 20% system markup. 
                            Quality index is derived from historical benchmark performance.
                        </p>
                        <Button variant="ghost" onClick={onClose} size="sm">
                            Close
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
