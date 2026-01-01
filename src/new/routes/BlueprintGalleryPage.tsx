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
            navigate(`/p/${project.id}/spread`);
        } catch (err) {
            toast.error('Failed to initiate blueprint.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFAF0] text-[#1A1A1A] font-sans pb-32">
            {/* Header */}
            <header className="px-8 py-20 text-center max-w-4xl mx-auto">
                <div className="flex justify-center mb-12">
                     <button
                        onClick={() => navigate('/projects')}
                        className="p-3 bg-white border border-[#1A1A1A]/5 rounded-2xl hover:opacity-70 transition-opacity group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8A8A8A]">
                            Starter Blueprints
                        </span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter leading-none mb-8">
                        The Gallery <br />
                        <span className="italic font-serif font-light text-[#8A8A8A]">Blueprints</span>
                    </h1>
                    <p className="text-xl text-[#5A5A5A] max-w-xl mx-auto font-medium leading-relaxed italic">
                        "Accelerate the production cycle with proven strategic frameworks."
                    </p>
                </motion.div>
            </header>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-8 mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-2 p-1 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedCategory === cat ? 'bg-[#1A1A1A] text-white' : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full md:w-80">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition-colors group-focus-within:text-[#FF4D4D]" />
                    <input
                        type="text"
                        placeholder="Search blueprints..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 pr-6 py-3.5 bg-white border border-[#1A1A1A]/10 rounded-2xl text-sm focus:outline-none focus:border-[#FF4D4D] transition-all w-full shadow-sm"
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
                    <div className="py-40 text-center opacity-30">
                        <Filter size={48} className="mx-auto mb-6" />
                        <h2 className="text-2xl font-bold">No blueprints match your criteria</h2>
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
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay, duration: 0.4 }}
            className="group bg-white border border-[#1A1A1A]/5 rounded-[32px] overflow-hidden flex flex-col hover:border-[#1A1A1A]/20 hover:shadow-2xl transition-all p-8 relative"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                {blueprint.category === 'Marketing' && <Zap size={80} strokeWidth={1} />}
                {blueprint.category === 'Branding' && <Sparkles size={80} strokeWidth={1} />}
                {blueprint.category === 'Strategy' && <Shield size={80} strokeWidth={1} />}
                {blueprint.category === 'Product' && <Layers size={80} strokeWidth={1} />}
            </div>

            <div className="flex justify-between items-start mb-10">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A8A8A] bg-[#1A1A1A]/5 px-3 py-1 rounded-full border border-[#1A1A1A]/5">
                    {blueprint.category}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                    blueprint.difficulty === 'Entry' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    blueprint.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                    {blueprint.difficulty}
                </span>
            </div>

            <h3 className="text-3xl font-black tracking-tighter mb-4 leading-tight">
                {blueprint.name}
            </h3>
            <p className="text-sm text-[#5A5A5A] leading-relaxed mb-10 font-medium">
                {blueprint.description}
            </p>

            <div className="mt-auto space-y-6">
                <div className="flex flex-wrap gap-2">
                    {blueprint.desks.slice(0, 3).map(desk => (
                        <span key={desk} className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                             • {desk.replace(/-/g, ' ')}
                        </span>
                    ))}
                    {blueprint.desks.length > 3 && <span className="text-[10px] font-black text-[#1A1A1A]/40">+{blueprint.desks.length - 3}</span>}
                </div>

                <button
                    onClick={onUse}
                    className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all transform group-hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                >
                    Initiate Blueprint
                    <ArrowRight size={14} strokeWidth={3} />
                </button>
            </div>
        </motion.div>
    );
}
