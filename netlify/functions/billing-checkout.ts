
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { stripe } from './utils/stripe';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Make a POST request' };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
        }

        const { priceId, successUrl, cancelUrl } = JSON.parse(event.body || '{}');

        if (!priceId || !successUrl || !cancelUrl) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        // Check if user already has a Stripe Customer ID
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId = sub?.stripe_customer_id;

        // Optional: Create customer upfront if missing (cleaner but not strictly required if we rely on webhook)
        // But reusing customer is good practice.
        if (!customerId) {
            // We could create it here, but simplest is let Checkout do it for new users.
            // But if they have an email, existing customers? 
            // For simplicity: Pass user.email to prefill.
        }

        const sessionParams: any = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            client_reference_id: user.id,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: user.id,
            },
            subscription_data: {
                metadata: {
                    userId: user.id,
                }
            }
        };

        if (customerId) {
            sessionParams.customer = customerId;
        } else {
            sessionParams.customer_email = user.email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url }),
        };
    } catch (error) {
        console.error('Checkout error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: (error as Error).message }),
        };
    }
};
