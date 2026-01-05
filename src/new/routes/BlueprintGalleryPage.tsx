import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    ArrowRight, 
    Sparkles, 
    Layers, 
    Zap, 
    Shield, 
    Search,
    Filter
} from 'lucide-react';
import { PROJECT_BLUEPRINTS, ProjectBlueprint } from '../../domain/templates';
import { createProject } from '../../domain/projects';
import { useToast } from '../components/Toast';
import { analytics } from '@/lib/analytics';

import { Heading, Text, Label, Input } from '../components';
import { Button } from '@/components/ui/Button';

/**
 * BLUEPRINT GALLERY
 * Editorial grid of production-ready starting points.
 */
export function BlueprintGalleryPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', 'Branding', 'Marketing', 'Product', 'Strategy'];

    const filteredBlueprints = PROJECT_BLUEPRINTS.filter(t => {
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleUseBlueprint = async (blueprint: ProjectBlueprint) => {
        analytics.track('blueprint_selected', { blueprintId: blueprint.id });
        
        try {
            const project = await createProject({
                projectName: `${blueprint.name} (Draft)`,
                description: blueprint.description,
                audience: 'General',
                goals: blueprint.goals,
                boundaries: [],
                budgetPolicy: { maxCostPerRun: 10, dailyLimit: 100, approvalRequired: false },
                selectedDesks: blueprint.desks,
                moodboard: []
            });
            
            toast.success(`Started production from ${blueprint.name} blueprint.`);
            navigate(`/p/${project.id}/workspace`);
        } catch (err) {
            toast.error('Failed to initiate blueprint.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--ui-bg)] text-text-primary font-sans pb-12">
            {/* Header */}
            <header className="px-8 py-12 text-center max-w-4xl mx-auto">
                <div className="flex justify-center mb-12">
                     <Button
                        variant="ghost"
                        onClick={() => navigate('/projects')}
                        size="sm"
                        className="p-3 border-[var(--ui-border)] group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Button>
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Label variant="muted" className="">
                            Starter Blueprints
                        </Label>
                    </div>
                    <Heading size="xl" className="leading-none mb-8">
                        The Gallery <br />
                        <span className="italic font-serif font-normal text-text-soft">Blueprints</span>
                    </Heading>
                    <p className="text-xl text-text-secondary max-w-xl mx-auto font-medium leading-relaxed italic">
                        &quot;Accelerate the production cycle with proven strategic frameworks.&quot;
                    </p>
                </motion.div>
            </header>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-2 p-1 bg-white border border-[var(--ui-border)] rounded-2xl shadow-sm">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "primary" : "ghost"}
                            onClick={() => setSelectedCategory(cat)}
                            size="sm"
                            className="px-6"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                <div className="relative group w-full md:w-80">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft transition-colors group-focus-within:text-zinc-500 z-10" />
                    <Input
                        type="text"
                        placeholder="Search blueprints..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12"
                    />
                </div>
            </div>

            {/* Grid */}
            <main className="max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredBlueprints.map((blueprint, idx) => (
                            <BlueprintCard 
                                key={blueprint.id} 
                                blueprint={blueprint} 
                                delay={idx * 0.05}
                                onUse={() => handleUseBlueprint(blueprint)}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {filteredBlueprints.length === 0 && (
                    <div className="py-12 text-center opacity-30">
                        <Filter size={48} className="mx-auto mb-6" />
                        <h2 className="text-xl font-semibold">No blueprints match your criteria</h2>
                    </div>
                )}
            </main>
        </div>
    );
}

function BlueprintCard({ blueprint, onUse, delay }: { blueprint: ProjectBlueprint, onUse: () => void, delay: number }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay, duration: 0.4 }}
            className="group bg-white border border-[var(--ui-border)] rounded-[32px] overflow-hidden flex flex-col hover:border-[var(--brand-ink)]/20 hover:shadow-2xl transition-all p-8 relative"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                {blueprint.category === 'Marketing' && <Zap size={80} strokeWidth={1} className="text-brand-ink" />}
                {blueprint.category === 'Branding' && <Sparkles size={80} strokeWidth={1} className="text-brand-ink" />}
                {blueprint.category === 'Strategy' && <Shield size={80} strokeWidth={1} className="text-brand-ink" />}
                {blueprint.category === 'Product' && <Layers size={80} strokeWidth={1} className="text-brand-ink" />}
            </div>

            <div className="flex justify-between items-start mb-8">
                <span className="text-xs font-semibold text-text-soft bg-[var(--brand-ink)]/5 px-3 py-1 rounded-full border border-[var(--ui-border)]">
                    {blueprint.category}
                </span>
                <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        blueprint.difficulty === 'Entry'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : blueprint.difficulty === 'Intermediate'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}
                >
                    {blueprint.difficulty}
                </span>
            </div>
            <Heading size="lg" className="mb-4 leading-tight">
                {blueprint.name}
            </Heading>
            <Text variant="muted" size="sm" className="mb-8 font-medium leading-relaxed">
                {blueprint.description}
            </Text>

            <div className="mt-auto space-y-6">
                <div className="flex flex-wrap gap-2">
                    {blueprint.desks.slice(0, 3).map(desk => (
                        <Label key={desk} variant="muted">
                            • {desk.replace(/-/g, ' ')}
                        </Label>
                    ))}
                    {blueprint.desks.length > 3 && (
                        <Label variant="muted">+{blueprint.desks.length - 3}</Label>
                    )}
                </div>

                <Button
                    onClick={onUse}
                    variant="primary"
                    className="w-full py-6 group-hover:scale-[1.02]"
                    size="lg"
                >
                    <div className="flex items-center justify-center gap-3">
                        Initiate Blueprint
                        <ArrowRight size={14} strokeWidth={3} />
                    </div>
                </Button>
            </div>
        </motion.div>
    );
}
