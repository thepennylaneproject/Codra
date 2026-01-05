import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    sections: { title: string; content: string }[];
}

export function LegalPage({ title, lastUpdated, sections }: LegalPageProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200 pb-12">
            <header className="fixed top-0 left-0 right-0 h-16 glass-panel-light border-0 border-b border-zinc-100 rounded-none bg-white/80 z-50 flex items-center px-8">
                <Button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft size={14} /> Open previous page
                </Button>
            </header>

            <main className="max-w-3xl mx-auto pt-12 px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span className="text-xs font-semibold text-zinc-500 mb-4 block">Regulatory Policy</span>
                    <h1 className="text-xl font-semibold tracking-tight mb-4">{title}</h1>
                    <p className="text-sm text-zinc-400 font-medium mb-12">Last updated: {lastUpdated}</p>

                    <div className="space-y-12">
                        {sections.map((section, idx) => (
                            <section key={idx} className="space-y-4">
                                <h2 className="text-base font-semibold text-zinc-900">{section.title}</h2>
                                <div className="text-zinc-600 leading-relaxed font-normal text-base space-y-4 whitespace-pre-wrap">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>
                </motion.div>

                <footer className="mt-12 pt-12 border-t border-zinc-100 text-center">
                    <p className="text-xs font-semibold text-zinc-300">© 2025 Codra Production Lab. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
}
