
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { stripe } from './utils/stripe';
import Stripe from 'stripe';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Helper to determine plan name from Price ID
// Ideally this should be dynamic or stored in DB, but for now hardcode or use metadata
async function getPlanFromPriceId(priceId: string): Promise<string> {
    // If we passed metadata to the price object in Stripe, we could use that.
    // Or we can just store the priceId in the sub table and handle mapping in frontend/backend logic.
    // For now, let's fetch the price from Stripe to see its product or metadata? Too slow.
    // We'll store the priceId in DB maybe? 
    // The `subscriptions` table has `plan` column ('free'|'pro'|'team').
    // We assume the Price objects in Stripe have metadata `plan_key: 'pro'` OR we map them here via ENV or hardcoded map.
    // Let's rely on Price Metadata `key` if possible.
    try {
        const price = await stripe.prices.retrieve(priceId);
        if (price.metadata.key) return price.metadata.key;

        // Fallback or retrieve product to check its metadata
        if (typeof price.product === 'string') {
            const product = await stripe.products.retrieve(price.product);
            if (product.metadata.key) return product.metadata.key;
            return product.name.toLowerCase(); // fallback
        }
    } catch (e) {
        console.error('Error fetching price/product details', e);
    }
    return 'pro'; // default fallback for MVP
}

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Make a POST request' };
    }

    const sig = event.headers['stripe-signature'];

    if (!sig || !webhookSecret) {
        console.error('Missing signature or webhook secret');
        return { statusCode: 400, body: 'Webhook Error' };
    }

    let stripeEvent: Stripe.Event;

    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${(err as Error).message}`);
        return { statusCode: 400, body: `Webhook Error: ${(err as Error).message}` };
    }

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                if (userId) {
                    // Ensure subscription record exists and is linked
                    // We might need to wait for subscription.created? No, session.completed implies sub created usually.
                    // But subscription.created might have raced already.
                    // We just update the customer ID linkage here mostly.
                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        // Status will be updated by subscription.updated/created events
                    }, { onConflict: 'user_id' });
                }
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object as Stripe.Subscription & {
                    current_period_end: number;
                    cancel_at_period_end?: boolean;
                    metadata?: Record<string, string>;
                };
                const status = subscription.status;
                const customerId = subscription.customer as string;
                const priceId = subscription.items.data[0].price.id;

                // We need to find the user by customerId if client_reference_id is not available on sub object
                // Subscriptions don't always have client_reference_id directly, Metadata does if we put it there.
                // In Checkout, we put metadata.userId on subscription_data.
                const userId = subscription.metadata.userId;

                const plan = await getPlanFromPriceId(priceId);

                const updateData = {
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscription.id,
                    status,
                    plan_id: plan,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end,
                };

                if (userId) {
                    // Direct update via ID
                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        ...updateData
                    });
                } else {
                    // Lookup by customer_id
                    await supabase.from('subscriptions').update(updateData).eq('stripe_customer_id', customerId);
                }
                break;
            }

            case 'invoice.payment_failed': {
                // Handle failed payment (e.g. email user, handled by Stripe usually but we can update status)
                const invoice = stripeEvent.data.object as Stripe.Invoice & {
                    subscription?: string | Stripe.Subscription | null;
                };
                const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as Stripe.Subscription)?.id;
                if (subscriptionId) {
                    await supabase.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', subscriptionId);
                }
                break;
            }
        }

        return { statusCode: 200, body: JSON.stringify({ received: true }) };

    } catch (error) {
        console.error('Webhook handler error:', error);
        return { statusCode: 500, body: 'Server Error' };
    }
};
