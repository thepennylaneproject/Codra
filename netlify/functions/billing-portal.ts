
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { stripe } from './utils/stripe';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

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

        const { returnUrl } = JSON.parse(event.body || '{}');

        // Get Customer ID
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (!sub?.stripe_customer_id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No subscription found' }) };
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: sub.stripe_customer_id,
            return_url: returnUrl || event.headers.referer, // fallback to referer
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url }),
        };

    } catch (error) {
        console.error('Portal error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: (error as Error).message }),
        };
    }
};
