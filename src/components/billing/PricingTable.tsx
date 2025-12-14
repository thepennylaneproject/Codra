
import React from 'react';
import { Check } from 'lucide-react';
import { billingAdapter } from '../../lib/billing/stripe';

// These should match your Stripe Price IDs or be mapped
const PLANS = [
    {
        key: 'free',
        name: 'Free',
        price: '$0',
        description: 'For personal projects',
        features: ['100 AI requests/mo', '1 Project', 'Community Support'],
        priceId: '', // No price ID for free
    },
    {
        key: 'pro',
        name: 'Pro',
        price: '$29',
        period: '/mo',
        description: 'For power users',
        features: ['2,000 AI requests/mo', '10 Projects', 'Priority Support', 'Collaboration'],
        priceId: 'price_PRO_ID_PLACEHOLDER', // Replace with Env Var or logic
        highlight: true,
    },
    {
        key: 'team',
        name: 'Team',
        price: '$99',
        period: '/mo',
        description: 'For teams',
        features: ['10,000 AI requests/mo', 'Unlimited Projects', 'Dedicated Support', 'SSO'],
        priceId: 'price_TEAM_ID_PLACEHOLDER',
    },
];

export const PricingTable: React.FC = () => {

    const handleSubscribe = async (priceId: string) => {
        if (!priceId) return; // Free tier logic or disabled
        try {
            const url = await billingAdapter.createCheckoutSession(priceId);
            window.location.href = url;
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Failed to start checkout. Please try again.');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 py-12">
            {PLANS.map((plan) => (
                <div
                    key={plan.key}
                    className={`relative rounded-2xl border p-8 shadow-sm flex flex-col
            ${plan.highlight
                            ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-indigo-100 bg-white'
                            : 'border-gray-200 bg-white/50'
                        }`}
                >
                    {plan.highlight && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Most Popular
                        </span>
                    )}

                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                        <p className="mt-2 text-gray-500 text-sm">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        {plan.period && <span className="text-gray-500">{plan.period}</span>}
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                                <Check className="h-5 w-5 text-indigo-600 mr-2 shrink-0" />
                                <span className="text-sm text-gray-600">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleSubscribe(plan.priceId)}
                        disabled={!plan.priceId}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
              ${plan.highlight
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                            }
              ${!plan.priceId ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-none' : ''}
            `}
                    >
                        {plan.priceId ? 'Upgrade' : 'Current Plan'}
                    </button>
                </div>
            ))}
        </div>
    );
};
