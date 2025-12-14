/**
 * CTA SECTION
 * Final call to action
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const CTASection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="py-24 px-6 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-teal/5 to-brand-magenta/5" />

            <div className="max-w-4xl mx-auto relative z-10 text-center">
                <h2 className="text-display-lg text-text-primary font-black mb-6 tracking-tight">
                    Ready to Build the Future?
                </h2>
                <p className="text-heading-md text-text-muted mb-10 max-w-2xl mx-auto">
                    Join thousands of makers who are building better software, faster.
                    Start for free, no credit card required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate('/signup')}
                        className="group px-8 py-4 bg-text-primary text-background-default rounded-full text-lg font-bold hover:scale-105 transition-all flex items-center gap-2"
                    >
                        Start Building Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={() => navigate('/contact')}
                        className="px-8 py-4 text-text-primary font-semibold hover:bg-background-elevated rounded-full transition-colors"
                    >
                        Talk to Sales
                    </button>
                </div>

                <p className="mt-6 text-label-sm text-text-soft uppercase tracking-wide">
                    Includes 14-day Pro trial
                </p>
            </div>
        </section>
    );
};
