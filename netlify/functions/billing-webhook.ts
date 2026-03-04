/**
 * Stripe Billing Webhook Handler
 * Phase 1 fixes: ARCH-001, ARCH-002, ARCH-003, ARCH-004
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { stripe } from './utils/stripe';
import Stripe from 'stripe';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ARCH-021: Add proper null checks before creating client
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/**
 * ARCH-003 FIX: Map Stripe price ID to plan tier
 * Returns null instead of unsafe default if plan cannot be determined
 */
async function getPlanFromPriceId(priceId: string): Promise<string | null> {
    try {
        const price = await stripe.prices.retrieve(priceId);
        
        // Check price metadata first
        if (price.metadata?.plan_key) {
            return price.metadata.plan_key;
        }

        // Check product metadata
        if (typeof price.product === 'string') {
            const product = await stripe.products.retrieve(price.product);
            
            if (product.metadata?.plan_key) {
                return product.metadata.plan_key;
            }
            
            // Fallback to product name (normalized)
            const productName = product.name.toLowerCase();
            if (['free', 'pro', 'team', 'enterprise'].includes(productName)) {
                return productName;
            }
        }
        
        console.error(`Could not determine plan for priceId: ${priceId}`);
        return null; // Don't assume a default
        
    } catch (error) {
        console.error('Error fetching price/product details:', error);
        return null;
    }
}

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!supabase) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Server misconfiguration' }) 
        };
    }

    const sig = event.headers['stripe-signature'];

    if (!sig || !webhookSecret) {
        console.error('Missing signature or webhook secret');
        return { statusCode: 400, body: 'Webhook Error: Missing signature' };
    }

    let stripeEvent: Stripe.Event;

    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${(err as Error).message}`);
        return { statusCode: 400, body: `Webhook Error: ${(err as Error).message}` };
    }

    try {
        // IDEMPOTENCY CHECK: Check if event already processed
        const { data: alreadyProcessed } = await supabase
            .rpc('is_webhook_processed', { event_id: stripeEvent.id });

        if (alreadyProcessed) {
            console.log(`Webhook ${stripeEvent.id} already processed, skipping`);
            return { statusCode: 200, body: JSON.stringify({ received: true, duplicate: true }) };
        }

        // Mark as processing (will be committed at end)
        const { data: isFirstTime } = await supabase
            .rpc('mark_webhook_processed', { 
                event_id: stripeEvent.id,
                event_type: stripeEvent.type,
                event_payload: stripeEvent as any
            });

        if (!isFirstTime) {
            // Another instance is processing this
            console.log(`Webhook ${stripeEvent.id} being processed by another instance`);
            return { statusCode: 200, body: JSON.stringify({ received: true, concurrent: true }) };
        }

        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                // ARCH-001 FIX: Set proper initial status and plan
                const session = stripeEvent.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                if (!userId) {
                    console.error('Checkout session missing client_reference_id (userId)');
                    break;
                }

                // Extract plan from session metadata if available
                const sessionPlan = session.metadata?.plan_id || 'pro';

                await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId,
                    status: 'incomplete' as any, // Initial status, will be updated by subscription.created
                    plan_id: sessionPlan,
                    price_id: session.metadata?.price_id || null,
                }, { onConflict: 'user_id' });

                console.log(`Checkout completed for user ${userId}, subscription ${subscriptionId}`);
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
                const userId = subscription.metadata?.userId;

                // ARCH-003 FIX: Don't proceed with null plan
                const plan = await getPlanFromPriceId(priceId);
                if (!plan) {
                    console.error(`Cannot process subscription ${subscription.id}: could not map priceId ${priceId} to plan`);
                    // Store for manual review
                    await supabase.from('webhook_events').update({
                        payload: {
                            ...stripeEvent as any,
                            error: 'unmapped_price_id',
                            needs_review: true
                        }
                    }).eq('id', stripeEvent.id);
                    
                    return { 
                        statusCode: 500, 
                        body: JSON.stringify({ error: 'Plan mapping failed', priceId }) 
                    };
                }

                const updateData = {
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscription.id,
                    status: status as any,
                    plan_id: plan,
                    price_id: priceId,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end || false,
                    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                };

                if (userId) {
                    // Direct update via userId from metadata
                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        ...updateData
                    }, { onConflict: 'user_id' });
                    
                    console.log(`Updated subscription for user ${userId}: status=${status}, plan=${plan}`);
                } else {
                    // ARCH-002 FIX: Validate that update affected a row
                    const { data, error, count } = await supabase
                        .from('subscriptions')
                        .update(updateData)
                        .eq('stripe_customer_id', customerId)
                        .select();

                    if (error) {
                        console.error(`Error updating subscription by customer_id ${customerId}:`, error);
                        throw error;
                    }

                    if (!count || count === 0) {
                        console.error(`No subscription found for customer_id ${customerId} (subscription ${subscription.id})`);
                        // Alert: orphaned subscription
                        await supabase.from('webhook_events').update({
                            payload: {
                                ...stripeEvent as any,
                                error: 'orphaned_subscription',
                                needs_review: true
                            }
                        }).eq('id', stripeEvent.id);
                    } else {
                        console.log(`Updated subscription by customer_id ${customerId}: status=${status}, plan=${plan}`);
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                // ARCH-004: Update status to past_due
                // Note: Actual tier enforcement happens in user-tier.ts
                const invoice = stripeEvent.data.object as Stripe.Invoice & {
                    subscription?: string | Stripe.Subscription | null;
                };
                
                const subscriptionId = typeof invoice.subscription === 'string' 
                    ? invoice.subscription 
                    : (invoice.subscription as Stripe.Subscription)?.id;

                if (subscriptionId) {
                    const { error } = await supabase
                        .from('subscriptions')
                        .update({ status: 'past_due' as any })
                        .eq('stripe_subscription_id', subscriptionId);

                    if (error) {
                        console.error(`Error updating subscription ${subscriptionId} to past_due:`, error);
                    } else {
                        console.log(`Payment failed for subscription ${subscriptionId}, set to past_due`);
                    }
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event type: ${stripeEvent.type}`);
        }

        return { statusCode: 200, body: JSON.stringify({ received: true }) };

    } catch (error) {
        console.error('Webhook handler error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }) 
        };
    }
};
