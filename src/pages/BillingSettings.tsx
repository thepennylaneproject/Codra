
import React, { useEffect, useState } from 'react';
import { UsageMeter } from '../components/billing/UsageMeter';
import { billingAdapter, Subscription } from '../lib/billing/stripe';
import { PricingTable } from '../components/billing/PricingTable';
import { supabase } from '../lib/supabase';
import { Loader2, CreditCard } from 'lucide-react';

export const BillingSettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const sub = await billingAdapter.getSubscription(user.id);
                setSubscription(sub);
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleManageSubscription = async () => {
        try {
            const url = await billingAdapter.createPortalSession();
            window.location.href = url;
        } catch (error) {
            console.error('Portal failed', error);
            alert('Failed to open billing portal');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (!user) return <div>Please log in</div>;

    const isFree = !subscription || subscription.plan === 'free';
    const statusColor = subscription?.status === 'active' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50';

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
                <p className="text-gray-500">Manage your subscription and view usage limits.</p>
            </div>

            {/* Current Plan Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-2xl font-bold capitalize">{subscription?.plan || 'Free'}</span>
                            {subscription && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                    {subscription.status}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {!isFree && (
                            <button
                                onClick={handleManageSubscription}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Manage Subscription
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                    <UsageMeter userId={user.id} />
                </div>

                {subscription?.currentPeriodEnd && (
                    <p className="mt-4 text-xs text-gray-400">
                        Cycle ends {subscription.currentPeriodEnd.toLocaleDateString()}
                    </p>
                )}
            </div>

            {/* Available Plans (Need to hide current?) */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Available Plans</h2>
                <PricingTable />
            </div>

        </div>
    );
};
