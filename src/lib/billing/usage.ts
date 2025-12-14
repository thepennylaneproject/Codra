
import { supabase } from '../supabase';

const LIMITS = {
    free: 100,
    pro: 2000,
    team: 10000,
};

export async function getUsage(userId: string) {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('usage_count, plan_id')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        // Default to free if no record found (or handle error)
        return { count: 0, limit: LIMITS.free, plan: 'free' };
    }

    const plan = (data.plan_id || 'free') as keyof typeof LIMITS;
    return {
        count: data.usage_count || 0,
        limit: LIMITS[plan],
        plan,
    };
}

export async function checkLimit(userId: string): Promise<boolean> {
    const usage = await getUsage(userId);
    return usage.count < usage.limit;
}

export async function incrementUsage(userId: string, quantity: number = 1): Promise<void> {
    // 1. Increment in local DB
    const { error } = await supabase.rpc('increment_usage', {
        row_id: userId,
        quantity
    });
    // Note: rpc is efficient but if not set up, we might need a two-step select/update or custom query.
    // For now let's try a direct update if RPC is not available, but race conditions exist.
    // Better approach for now without RPC:

    if (error) {
        // Fallback: simple increment (not race-condition safe but okay for MVP)
        const { data: sub } = await supabase.from('subscriptions').select('usage_count, stripe_subscription_id').eq('user_id', userId).single();
        if (sub) {
            const newCount = (sub.usage_count || 0) + quantity;
            await supabase.from('subscriptions').update({ usage_count: newCount }).eq('user_id', userId);

            // 2. Report to Stripe if metered billing is used (optional, based on requirements)
            // The prompt mentioned "Count AI requests per billing period" and "Overage handling (optional)"
            // If we are just enforcing limits on flat-rate tiers, we don't need `recordUsage` on Stripe.
            // If we have a metered price, we would call `billingAdapter.recordUsage`.
            // Assuming flat rate with hard limits for now based on "Enforce limits (show upgrade modal)".
        }
    }
}

// Reset usage at billing cycle anchor - this would usually be a webhook handler for invoice.created
export async function resetUsage(userId: string) {
    await supabase.from('subscriptions').update({ usage_count: 0 }).eq('user_id', userId);
}
