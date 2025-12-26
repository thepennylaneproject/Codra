/**
 * IDEA CLUSTERER
 * src/new/components/IdeaClusterer.tsx
 * 
 * Chaos-to-structure organization tool.
 * Dump unstructured ideas → AI clusters by theme, priority, feasibility.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
    Sparkles, 
    Plus, 
    X, 
    Loader2, 
    Grid3x3,
    ListOrdered,
    Lightbulb,
    Flame,
    Clock,
    AlertCircle
} from 'lucide-react';

export interface Idea {
    id: string;
    content: string;
    createdAt: string;
}

export interface IdeaCluster {
    id: string;
    name: string;
    theme: string;
    priority: 'high' | 'medium' | 'low';
    feasibility: 'easy' | 'moderate' | 'hard';
    ideas: Idea[];
}

interface IdeaClustererProps {
    onClusterComplete?: (clusters: IdeaCluster[]) => void;
    className?: string;
}

export const IdeaClusterer: React.FC<IdeaClustererProps> = ({
    onClusterComplete,
    className = '',
}) => {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [clusters, setClusters] = useState<IdeaCluster[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'input' | 'clusters'>('input');

    const addIdea = useCallback(() => {
        if (!inputValue.trim()) return;
        
        const newIdea: Idea = {
            id: crypto.randomUUID(),
            content: inputValue.trim(),
            createdAt: new Date().toISOString(),
        };
        
        setIdeas(prev => [...prev, newIdea]);
        setInputValue('');
    }, [inputValue]);

    const removeIdea = useCallback((id: string) => {
        setIdeas(prev => prev.filter(i => i.id !== id));
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addIdea();
        }
    }, [addIdea]);

    // Simulated clustering (in production, this would call AI)
    const clusterIdeas = useCallback(async () => {
        if (ideas.length < 3) return;
        
        setIsProcessing(true);
        
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simple keyword-based clustering (would be AI in production)
        const clustered: IdeaCluster[] = [];
        const usedIds = new Set<string>();
        
        // Group by simple keyword matching
        const keywords = ['design', 'feature', 'fix', 'improve', 'add', 'user', 'api', 'test'];
        
        for (const keyword of keywords) {
            const matchingIdeas = ideas.filter(idea => 
                !usedIds.has(idea.id) && 
                idea.content.toLowerCase().includes(keyword)
            );
            
            if (matchingIdeas.length >= 2) {
                matchingIdeas.forEach(i => usedIds.add(i.id));
                clustered.push({
                    id: crypto.randomUUID(),
                    name: keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Related',
                    theme: keyword,
                    priority: matchingIdeas.length > 3 ? 'high' : 'medium',
                    feasibility: 'moderate',
                    ideas: matchingIdeas,
                });
            }
        }
        
        // Put remaining ideas in "Uncategorized"
        const remaining = ideas.filter(idea => !usedIds.has(idea.id));
        if (remaining.length > 0) {
            clustered.push({
                id: crypto.randomUUID(),
                name: 'Other Ideas',
                theme: 'misc',
                priority: 'low',
                feasibility: 'easy',
                ideas: remaining,
            });
        }
        
        setClusters(clustered);
        setViewMode('clusters');
        setIsProcessing(false);
        onClusterComplete?.(clustered);
    }, [ideas, onClusterComplete]);

    const getPriorityIcon = (priority: IdeaCluster['priority']) => {
        switch (priority) {
            case 'high': return <Flame size={12} className="text-red-500" />;
            case 'medium': return <Clock size={12} className="text-amber-500" />;
            case 'low': return <AlertCircle size={12} className="text-blue-500" />;
        }
    };

    const getFeasibilityColor = (feasibility: IdeaCluster['feasibility']) => {
        switch (feasibility) {
            case 'easy': return 'bg-emerald-100 text-emerald-700';
            case 'moderate': return 'bg-amber-100 text-amber-700';
            case 'hard': return 'bg-red-100 text-red-700';
        }
    };

    return (
        <div className={`bg-white rounded-2xl border border-[#1A1A1A]/10 shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 bg-[#FFFAF0] border-b border-[#1A1A1A]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Lightbulb size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-[#1A1A1A]">
                            Idea Clusterer
                        </h3>
                        <p className="text-[9px] text-[#8A8A8A]">
                            {ideas.length} idea{ideas.length !== 1 ? 's' : ''} • {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('input')}
                        className={`p-1.5 rounded-lg transition-colors ${
                            viewMode === 'input' 
                                ? 'bg-[#1A1A1A] text-white' 
                                : 'text-[#8A8A8A] hover:bg-[#1A1A1A]/5'
                        }`}
                    >
                        <ListOrdered size={14} />
                    </button>
                    <button
                        onClick={() => setViewMode('clusters')}
                        className={`p-1.5 rounded-lg transition-colors ${
                            viewMode === 'clusters' 
                                ? 'bg-[#1A1A1A] text-white' 
                                : 'text-[#8A8A8A] hover:bg-[#1A1A1A]/5'
                        }`}
                        disabled={clusters.length === 0}
                    >
                        <Grid3x3 size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
                <AnimatePresence mode="wait">
                    {viewMode === 'input' ? (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {/* Input */}
                            <div className="flex gap-2">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Dump your ideas here... (Enter to add)"
                                    className="flex-1 px-3 py-2 bg-[#1A1A1A]/5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 min-h-[60px]"
                                />
                                <button
                                    onClick={addIdea}
                                    disabled={!inputValue.trim()}
                                    className="px-3 bg-[#1A1A1A] text-white rounded-xl disabled:opacity-30 transition-opacity"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Ideas list */}
                            <Reorder.Group values={ideas} onReorder={setIdeas} className="space-y-2">
                                {ideas.map((idea) => (
                                    <Reorder.Item
                                        key={idea.id}
                                        value={idea}
                                        className="flex items-start gap-2 p-2 bg-[#FFFAF0] rounded-xl border border-[#1A1A1A]/5 cursor-grab active:cursor-grabbing"
                                    >
                                        <span className="text-sm text-[#1A1A1A] flex-1">{idea.content}</span>
                                        <button
                                            onClick={() => removeIdea(idea.id)}
                                            className="p-1 text-[#8A8A8A] hover:text-red-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>

                            {/* Cluster button */}
                            {ideas.length >= 3 && (
                                <button
                                    onClick={clusterIdeas}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Clustering...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Cluster {ideas.length} Ideas
                                        </>
                                    )}
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="clusters"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {clusters.map((cluster) => (
                                <div
                                    key={cluster.id}
                                    className="bg-[#FFFAF0] rounded-xl border border-[#1A1A1A]/5 overflow-hidden"
                                >
                                    <div className="px-3 py-2 bg-white/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getPriorityIcon(cluster.priority)}
                                            <span className="text-xs font-bold text-[#1A1A1A]">{cluster.name}</span>
                                            <span className="text-[9px] text-[#8A8A8A]">({cluster.ideas.length})</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${getFeasibilityColor(cluster.feasibility)}`}>
                                            {cluster.feasibility}
                                        </span>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {cluster.ideas.map((idea) => (
                                            <div
                                                key={idea.id}
                                                className="px-2 py-1.5 bg-white rounded-lg text-xs text-[#5A5A5A]"
                                            >
                                                {idea.content}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            <button
                                onClick={() => {
                                    setClusters([]);
                                    setViewMode('input');
                                }}
                                className="w-full py-2 text-[#8A8A8A] text-xs font-bold uppercase tracking-wider hover:text-[#1A1A1A] transition-colors"
                            >
                                ← Back to Ideas
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
