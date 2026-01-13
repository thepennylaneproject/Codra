/**
 * UPGRADE MODAL
 * Modal showing tier comparison and upgrade CTAs
 * src/new/components/UpgradeModal.tsx
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Zap, Shield } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import type { UserTier } from '@/lib/stores/user-tier';
import type { GatedFeature } from '@/lib/hooks/useFeatureGate';

// ============================================================
// Types
// ============================================================

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: GatedFeature;
    currentTier: UserTier;
}

// ============================================================
// Tier Feature Matrix
// ============================================================

interface TierConfig {
    name: string;
    price: number;
    period: string;
    icon: React.ReactNode;
    highlighted?: boolean;
    features: {
        projects: string;
        taskExecution: string;
        coherenceScan: string;
        collaboration: string;
        support: string;
    };
    cta: 'current' | 'upgrade' | 'contact';
    ctaLabel: string;
}

const TIER_CONFIGS: Record<UserTier, TierConfig> = {
    free: {
        name: 'Free',
        price: 0,
        period: '/month',
        icon: <Zap size={20} strokeWidth={2.5} className="opacity-40" />,
        features: {
            projects: '1 project',
            taskExecution: '—',
            coherenceScan: '—',
            collaboration: '—',
            support: 'Community',
        },
        cta: 'current',
        ctaLabel: 'Current Plan',
    },
    pro: {
        name: 'Pro',
        price: 29,
        period: '/month',
        icon: <Sparkles size={20} strokeWidth={2.5} />,
        highlighted: true,
        features: {
            projects: '10 projects',
            taskExecution: '✓ Unlimited',
            coherenceScan: '5/month',
            collaboration: '—',
            support: 'Priority Email',
        },
        cta: 'upgrade',
        ctaLabel: 'Upgrade to Pro',
    },
    team: {
        name: 'Team',
        price: 99,
        period: '/month',
        icon: <Shield size={20} strokeWidth={2.5} />,
        features: {
            projects: 'Unlimited',
            taskExecution: '✓ Unlimited',
            coherenceScan: 'Unlimited',
            collaboration: '✓ Team access',
            support: 'Dedicated',
        },
        cta: 'contact',
        ctaLabel: 'Contact Sales',
    },
};

// Feature display names
const FEATURE_LABELS: Record<keyof TierConfig['features'], string> = {
    projects: 'Projects',
    taskExecution: 'Task Execution',
    coherenceScan: 'Coherence Scan',
    collaboration: 'Collaboration',
    support: 'Support',
};

// ============================================================
// Component
// ============================================================

export function UpgradeModal({ isOpen, onClose, feature, currentTier }: UpgradeModalProps) {
    const handleUpgradeClick = useCallback((targetTier: UserTier) => {
        analytics.track('feature_gate_shown', { 
            feature, 
            tier: currentTier, 
            action: 'upgrade_clicked' 
        });
        analytics.track('upgrade_attempted', { 
            source: 'feature_gate',
            tier: targetTier,
        });
        
        // Navigate to pricing/billing page
        window.location.href = '/pricing';
    }, [feature, currentTier]);

    const handleContactSales = useCallback(() => {
        analytics.track('feature_gate_shown', { 
            feature, 
            tier: currentTier, 
            action: 'upgrade_clicked' 
        });
        
        // Open email or contact form
        window.location.href = 'mailto:team@codra.co?subject=Team Plan Inquiry';
    }, [feature, currentTier]);

    const handleClose = useCallback(() => {
        analytics.track('feature_gate_shown', { 
            feature, 
            tier: currentTier, 
            action: 'dismissed' 
        });
        onClose();
    }, [feature, currentTier, onClose]);

    const tiers: UserTier[] = ['free', 'pro', 'team'];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div 
                            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Upgrade to Unlock
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        This feature requires a higher tier plan
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Pricing Grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-3 gap-4">
                                    {tiers.map((tier) => {
                                        const config = TIER_CONFIGS[tier];
                                        const isCurrent = tier === currentTier;
                                        const isHighlighted = config.highlighted && !isCurrent;

                                        return (
                                            <div
                                                key={tier}
                                                className={`
                                                    relative rounded-xl p-5 transition-all
                                                    ${isHighlighted 
                                                        ? 'bg-gray-900 text-white ring-2 ring-gray-900 scale-105' 
                                                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                                                    }
                                                    ${isCurrent ? 'opacity-60' : ''}
                                                `}
                                            >
                                                {isHighlighted && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
                                                        Recommended
                                                    </div>
                                                )}

                                                {/* Tier Header */}
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className={isHighlighted ? 'text-white' : 'text-gray-600'}>
                                                        {config.icon}
                                                    </div>
                                                    <span className="font-semibold">{config.name}</span>
                                                </div>

                                                {/* Price */}
                                                <div className="mb-6">
                                                    <span className="text-3xl font-bold">${config.price}</span>
                                                    <span className={`text-sm ${isHighlighted ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        {config.period}
                                                    </span>
                                                </div>

                                                {/* Features */}
                                                <ul className="space-y-3 mb-6">
                                                    {Object.entries(config.features).map(([key, value]) => (
                                                        <li 
                                                            key={key} 
                                                            className={`flex items-center text-sm ${
                                                                isHighlighted ? 'text-gray-200' : 'text-gray-600'
                                                            }`}
                                                        >
                                                            {value.startsWith('✓') ? (
                                                                <Check size={14} className="mr-2 text-green-500 flex-shrink-0" />
                                                            ) : value === '—' ? (
                                                                <span className="mr-2 w-[14px] text-center text-gray-400">—</span>
                                                            ) : (
                                                                <span className="mr-2 w-[14px]" />
                                                            )}
                                                            <span className="flex-1">
                                                                <span className={`${isHighlighted ? 'text-gray-400' : 'text-gray-400'} mr-1`}>
                                                                    {FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]}:
                                                                </span>
                                                                {value.replace('✓ ', '')}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {/* CTA Button */}
                                                <button
                                                    onClick={() => {
                                                        if (config.cta === 'upgrade') {
                                                            handleUpgradeClick(tier);
                                                        } else if (config.cta === 'contact') {
                                                            handleContactSales();
                                                        }
                                                    }}
                                                    disabled={isCurrent}
                                                    className={`
                                                        w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all
                                                        ${isCurrent 
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                            : isHighlighted
                                                                ? 'bg-white text-gray-900 hover:bg-gray-100'
                                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                                        }
                                                    `}
                                                >
                                                    {isCurrent ? 'Current Plan' : config.ctaLabel}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6">
                                <p className="text-xs text-gray-400 text-center">
                                    All plans include a 14-day free trial. Cancel anytime.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default UpgradeModal;
