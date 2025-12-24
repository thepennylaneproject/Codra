import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    sections: { title: string; content: string }[];
}

export function LegalPage({ title, lastUpdated, sections }: LegalPageProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-rose-100 pb-32">
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50 flex items-center px-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft size={14} /> Back
                </button>
            </header>

            <main className="max-w-3xl mx-auto pt-40 px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-4 block">Regulatory Policy</span>
                    <h1 className="text-6xl font-black tracking-tighter mb-4">{title}</h1>
                    <p className="text-sm text-zinc-400 font-medium mb-20 italic">Last updated: {lastUpdated}</p>

                    <div className="space-y-16">
                        {sections.map((section, idx) => (
                            <section key={idx} className="space-y-4">
                                <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-900">{section.title}</h2>
                                <div className="text-zinc-600 leading-relaxed font-light text-base space-y-4 whitespace-pre-wrap">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>
                </motion.div>

                <footer className="mt-40 pt-20 border-t border-zinc-100 text-center">
                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">© 2025 Codra Production Lab. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
}
