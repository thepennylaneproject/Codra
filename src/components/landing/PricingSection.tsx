/**
 * PRICING SECTION
 * Display pricing tiers with feature comparison
 */

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIERS = [
    {
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        description: 'For exploring and personal projects',
        cta: 'Get Started',
        highlighted: false,
        features: [
            { name: '3 projects', included: true },
            { name: '1,000 AI calls/month', included: true },
            { name: 'Basic flow builder', included: true },
            { name: 'Community support', included: true },
            { name: 'Benchmarking', included: false },
            { name: 'Team collaboration', included: false },
            { name: 'Custom integrations', included: false },
            { name: 'Priority support', included: false },
        ],
    },
    {
        name: 'Pro',
        price: { monthly: 29, yearly: 290 },
        description: 'For serious makers and freelancers',
        cta: 'Start Pro Trial',
        highlighted: true,
        badge: 'Most Popular',
        features: [
            { name: 'Unlimited projects', included: true },
            { name: '50,000 AI calls/month', included: true },
            { name: 'Advanced flow builder', included: true },
            { name: 'Email support', included: true },
            { name: 'Benchmarking', included: true },
            { name: 'Version history', included: true },
            { name: 'Custom integrations', included: false },
            { name: 'Priority support', included: false },
        ],
    },
    {
        name: 'Team',
        price: { monthly: 79, yearly: 790 },
        description: 'For teams building together',
        cta: 'Contact Sales',
        highlighted: false,
        features: [
            { name: 'Everything in Pro', included: true },
            { name: '200,000 AI calls/month', included: true },
            { name: 'Team collaboration', included: true },
            { name: 'SSO & SAML', included: true },
            { name: 'Custom integrations', included: true },
            { name: 'Priority support', included: true },
            { name: 'Dedicated CSM', included: true },
            { name: 'SLA guarantee', included: true },
        ],
    },
];

export const PricingSection: React.FC = () => {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
    const navigate = useNavigate();

    return (
        <section id="pricing" className="py-24 px-6 bg-background-subtle">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="text-label-md text-brand-gold uppercase tracking-widest mb-4 block">
                        Pricing
                    </span>
                    <h2 className="text-display-md text-text-primary font-bold mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-body-lg text-text-muted max-w-2xl mx-auto mb-8">
                        Start free, upgrade when you need more power. No hidden fees.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center bg-background-elevated rounded-full p-1 border border-border-subtle">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-4 py-2 rounded-full text-label-sm transition-colors ${billingPeriod === 'monthly'
                                    ? 'bg-brand-teal text-background-default'
                                    : 'text-text-muted hover:text-text-primary'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-4 py-2 rounded-full text-label-sm transition-colors ${billingPeriod === 'yearly'
                                    ? 'bg-brand-teal text-background-default'
                                    : 'text-text-muted hover:text-text-primary'
                                }`}
                        >
                            Yearly <span className="text-brand-gold ml-1">-17%</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative p-8 rounded-2xl transition-all ${tier.highlighted
                                    ? 'bg-gradient-to-b from-brand-teal/20 to-background-elevated border-2 border-brand-teal scale-105 shadow-xl'
                                    : 'bg-background-elevated border border-border-subtle hover:border-border-strong'
                                }`}
                        >
                            {tier.badge && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-teal text-background-default text-label-sm font-semibold rounded-full">
                                    {tier.badge}
                                </span>
                            )}

                            {/* Tier Header */}
                            <div className="text-center mb-6">
                                <h3 className="text-heading-md text-text-primary font-bold mb-2">
                                    {tier.name}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-display-sm text-text-primary font-black">
                                        ${tier.price[billingPeriod]}
                                    </span>
                                    <span className="text-body-sm text-text-muted">
                                        /{billingPeriod === 'yearly' ? 'year' : 'month'}
                                    </span>
                                </div>
                                <p className="text-body-sm text-text-muted mt-2">
                                    {tier.description}
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {tier.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        {feature.included ? (
                                            <Check className="w-5 h-5 text-state-success shrink-0" />
                                        ) : (
                                            <X className="w-5 h-5 text-text-soft shrink-0" />
                                        )}
                                        <span className={`text-body-sm ${feature.included ? 'text-text-primary' : 'text-text-soft'}`}>
                                            {feature.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                onClick={() => navigate('/signup')}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${tier.highlighted
                                        ? 'bg-brand-teal text-background-default hover:brightness-110'
                                        : 'bg-background-subtle text-text-primary border border-border-subtle hover:border-brand-teal'
                                    }`}
                            >
                                {tier.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Enterprise Note */}
                <p className="text-center text-body-sm text-text-muted mt-8">
                    Need more? <a href="/contact" className="text-brand-teal hover:underline">Contact us</a> for enterprise pricing.
                </p>
            </div>
        </section>
    );
};
