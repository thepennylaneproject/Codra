/**
 * TESTIMONIALS SECTION
 * Social proof from users
 */

import React from 'react';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
    {
        quote: "Codra completely changed how I prototype. I went from spending 3 days on boilerplate to shipping my MVP in an afternoon.",
        author: "Elena Rodriguez",
        role: "Product Designer @ FinTech Co",
        avatar: "ER"
    },
    {
        quote: "The visual workflow builder is a game changer. Being able to see the logic flow and debug in real-time saved me hours.",
        author: "Marcus Chen",
        role: "Indie Developer",
        avatar: "MC"
    },
    {
        quote: "Finally, a low-code tool that doesn't feel like a toy. The ability to drop down into code whenever I need is perfect.",
        author: "Sarah Jenkins",
        role: "Senior Engineer",
        avatar: "SJ"
    }
];

export const TestimonialsSection: React.FC = () => {
    return (
        <section className="py-24 px-6 bg-background-default">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-display-md text-text-primary font-bold mb-4">
                        Loved by Builders
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-background-elevated border border-border-subtle hover:border-brand-gold/50 transition-colors relative">
                            <Quote className="absolute top-6 right-6 w-8 h-8 text-border-subtle opacity-50" />

                            <div className="mb-6">
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg key={star} className="w-4 h-4 text-brand-gold fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-body-lg text-text-secondary italic">
                                    "{t.quote}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-magenta flex items-center justify-center text-text-primary font-bold text-sm">
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className="text-body-sm text-text-primary font-semibold">
                                        {t.author}
                                    </div>
                                    <div className="text-label-xs text-text-muted">
                                        {t.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
