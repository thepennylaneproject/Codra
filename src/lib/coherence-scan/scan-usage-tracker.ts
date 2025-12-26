/**
 * SCAN USAGE TRACKER
 * 
 * Tracks scan usage per user, enforces limits, handles extra scan purchases.
 */

import { supabase } from '../supabase';
import type { ScanType, ScanUsage } from '../../domain/coherence-scan';

// ============================================
// Tier Limits
// ============================================

export const SCAN_LIMITS: Record<'free' | 'pro' | 'team', {
    quickChecksPerMonth: number;
    fullScansPerMonth: number;
    deepScanAvailable: boolean;
    extraScanPrice: number; // USD
}> = {
    free: {
        quickChecksPerMonth: 1,
        fullScansPerMonth: 0,
        deepScanAvailable: false,
        extraScanPrice: 0, // Can't buy extra
    },
    pro: {
        quickChecksPerMonth: 3,
        fullScansPerMonth: 1,
        deepScanAvailable: true,
        extraScanPrice: 7.00,
    },
    team: {
        quickChecksPerMonth: 10,
        fullScansPerMonth: 3,
        deepScanAvailable: true,
        extraScanPrice: 5.00,
    },
};

// ============================================
// Usage Functions
// ============================================

/**
 * Get current scan usage for a user
 */
export async function getScanUsage(userId: string): Promise<ScanUsage | null> {
    const { data, error } = await supabase
        .from('scan_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No usage record yet, return default
            return null;
        }
        console.error('Error fetching scan usage:', error);
        return null;
    }

    return {
        userId: data.user_id,
        tier: data.tier,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        scansUsed: data.scans_used,
        scansAllowed: data.scans_allowed,
        additionalScansPurchased: data.additional_scans_purchased ?? 0,
    };
}

/**
 * Check if user can run a scan of given type
 */
export async function canRunScan(
    userId: string,
    scanType: ScanType,
    userTier: 'free' | 'pro' | 'team'
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
    const limits = SCAN_LIMITS[userTier];
    
    // Free users can only run quick checks
    if (userTier === 'free' && scanType !== 'quick-check') {
        return {
            allowed: false,
            reason: 'Full scans require a Pro or Team subscription',
            upgradeRequired: true,
        };
    }
    
    // Deep scan requires pro/team
    if (scanType === 'deep-scan' && !limits.deepScanAvailable) {
        return {
            allowed: false,
            reason: 'Deep Scan is available as an add-on for Pro and Team members',
            upgradeRequired: true,
        };
    }
    
    // Check usage limits
    const usage = await getScanUsage(userId);
    if (!usage) {
        // First scan ever - allowed
        return { allowed: true };
    }
    
    // Check if period has reset
    if (new Date(usage.periodEnd) < new Date()) {
        // Period expired, reset and allow
        return { allowed: true };
    }
    
    // Calculate available scans
    const allowedScans = scanType === 'quick-check'
        ? limits.quickChecksPerMonth
        : limits.fullScansPerMonth;
    
    const totalAllowed = allowedScans + usage.additionalScansPurchased;
    
    if (usage.scansUsed >= totalAllowed) {
        return {
            allowed: false,
            reason: `You've used all ${allowedScans} included scans this month. Purchase additional scans for $${limits.extraScanPrice} each.`,
            upgradeRequired: false,
        };
    }
    
    return { allowed: true };
}

/**
 * Record a scan usage
 */
export async function recordScanUsage(
    userId: string,
    _scanType: ScanType,
    actualCost: number
): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Upsert usage record
    const { error } = await supabase
        .from('scan_usage')
        .upsert({
            user_id: userId,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            scans_used: 1,
            last_scan_at: now.toISOString(),
            total_cost_incurred: actualCost,
        }, {
            onConflict: 'user_id,period_start',
            // Increment scans_used
        });

    if (error) {
        console.error('Error recording scan usage:', error);
    }
}

/**
 * Get remaining scans for display
 */
export async function getScansRemaining(
    userId: string,
    userTier: 'free' | 'pro' | 'team'
): Promise<{
    quickChecks: { used: number; allowed: number };
    fullScans: { used: number; allowed: number };
    extraPurchased: number;
}> {
    const limits = SCAN_LIMITS[userTier];
    const usage = await getScanUsage(userId);
    
    if (!usage || new Date(usage.periodEnd) < new Date()) {
        // No usage or period expired
        return {
            quickChecks: { used: 0, allowed: limits.quickChecksPerMonth },
            fullScans: { used: 0, allowed: limits.fullScansPerMonth },
            extraPurchased: 0,
        };
    }
    
    return {
        quickChecks: { used: usage.scansUsed, allowed: limits.quickChecksPerMonth },
        fullScans: { used: usage.scansUsed, allowed: limits.fullScansPerMonth },
        extraPurchased: usage.additionalScansPurchased,
    };
}

/**
 * Check if Coherence Scan feature is available for tier
 */
export function isCoherenceScanAvailable(_tier: 'free' | 'pro' | 'team'): boolean {
    // All tiers can access coherence scan (free gets quick check only)
    return true;
}

/**
 * Get upgrade message for tier
 */
export function getUpgradeMessage(currentTier: 'free' | 'pro' | 'team'): string {
    switch (currentTier) {
        case 'free':
            return 'Upgrade to Pro to unlock Full Scans (1/month included) and Deep Scan add-on.';
        case 'pro':
            return 'Upgrade to Team for 3 Full Scans/month and discounted extra scans.';
        case 'team':
            return 'You have full access to all Coherence Scan features.';
    }
}
