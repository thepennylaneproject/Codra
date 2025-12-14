
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    // This might be okay during build if not used, but runtime needs it
    console.warn('STRIPE_SECRET_KEY is missing in process.env');
}

export const stripe = new Stripe(stripeSecretKey || '', {
    apiVersion: '2024-06-20',
    typescript: true,
} as any);
