/**
 * FAQ SECTION
 * Frequently asked questions with expandable answers
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
    {
        question: 'Do I need my own API keys?',
        answer: 'Yes, you bring your own API keys from providers like OpenAI, Anthropic, or Google. This keeps you in control of costs and ensures your data stays private. We never see your API keys unencrypted — they\'re stored with AES-256-GCM encryption.',
    },
    {
        question: 'How does the AI call limit work?',
        answer: 'AI calls are counted when your workflows execute prompts against AI models. Each plan includes a monthly allowance. Unused calls don\'t roll over, but you can purchase additional calls if needed. The free tier includes 1,000 calls — enough to build several projects.',
    },
    {
        question: 'Can I export my workflows?',
        answer: 'Absolutely. You can export workflows as standalone code, deploy directly to Netlify or Vercel, or download as JSON for backup. Your work is never locked in.',
    },
    {
        question: 'What\'s the difference between benchmarking and normal execution?',
        answer: 'Benchmarking runs your prompt against multiple models simultaneously and compares outputs, latency, and cost. It helps you pick the best model for each task. Normal execution just runs your workflow with your chosen model.',
    },
    {
        question: 'Is there a free trial for Pro?',
        answer: 'Yes! Pro includes a 14-day free trial with full access to all features. No credit card required to start. You can cancel anytime during the trial.',
    },
    {
        question: 'How does team collaboration work?',
        answer: 'Team plans include real-time collaboration with presence indicators, shared projects, role-based permissions, and activity logs. Multiple team members can work on the same workflow simultaneously.',
    },
    {
        question: 'What about data privacy?',
        answer: 'We take privacy seriously. Your API keys are encrypted at rest. Your prompts and outputs pass through our servers only during execution and are never stored or used for training. You can delete all your data at any time.',
    },
    {
        question: 'Can I use Codra for commercial projects?',
        answer: 'Yes, all plans (including Free) allow commercial use. You own everything you create with Codra.',
    },
];

export const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-24 px-6 bg-background-default">
            <div className="max-w-3xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="text-label-md text-brand-magenta uppercase tracking-widest mb-4 block">
                        FAQ
                    </span>
                    <h2 className="text-display-md text-text-primary font-bold mb-4">
                        Frequently Asked Questions
                    </h2>
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                    {FAQS.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-border-subtle rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-background-subtle transition-colors"
                            >
                                <span className="text-label-lg text-text-primary font-semibold">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-text-muted shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {openIndex === index && (
                                <div className="px-6 pb-6">
                                    <p className="text-body-md text-text-secondary leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Contact Link */}
                <p className="text-center text-body-md text-text-muted mt-8">
                    Have another question?{' '}
                    <a href="/contact" className="text-brand-teal hover:underline">
                        Contact us
                    </a>
                </p>
            </div>
        </section>
    );
};
