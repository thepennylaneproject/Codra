
import { supabase } from '../supabase';

export interface Subscription {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    plan: 'free' | 'pro' | 'team';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
}

export interface BillingAdapter {
    createCheckoutSession(priceId: string): Promise<string>;
    createPortalSession(): Promise<string>;
    getSubscription(userId: string): Promise<Subscription | null>;
}

export class ClientBillingAdapter implements BillingAdapter {

    async createCheckoutSession(priceId: string): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ priceId, successUrl: window.location.href, cancelUrl: window.location.href }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create checkout session');
        }

        const data = await response.json();
        return data.url;
    }

    async createPortalSession(): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch('/api/billing/portal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ returnUrl: window.location.href }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create portal session');
        }

        const data = await response.json();
        return data.url;
    }

    async getSubscription(userId: string): Promise<Subscription | null> {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching subscription:', error);
            return null;
        }

        return {
            id: data.id,
            status: data.status,
            plan: data.plan_id as 'free' | 'pro' | 'team',
            currentPeriodEnd: new Date(data.current_period_end),
            cancelAtPeriodEnd: data.cancel_at_period_end,
            stripeCustomerId: data.stripe_customer_id,
            stripeSubscriptionId: data.stripe_subscription_id,
        };
    }

    // Client cannot trustlessly cancel or record usage safely. 
    // Cancellation is done via Portal.
    // Usage is recorded by server.
}

export const billingAdapter = new ClientBillingAdapter();
