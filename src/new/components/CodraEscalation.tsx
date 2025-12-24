/**
 * CODRA ESCALATION
 * System intervention UI for budget, risk, and destructive action alerts
 * 
 * Codra is the system authority. Its UI is:
 * - Minimal
 * - Neutral
 * - Firm
 * - Text-forward (no avatar)
 */

import { CodraEscalation } from '../../domain/types';
import { AlertTriangle, ShieldAlert, Trash2, X, Check } from 'lucide-react';

// ============================================
// Icon Mapping
// ============================================

const ESCALATION_ICONS = {
    budget_exceeded: AlertTriangle,
    risk_exceeded: ShieldAlert,
    destructive_action: Trash2,
};

const ESCALATION_COLORS = {
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        text: 'text-amber-900',
    },
    blocking: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        text: 'text-red-900',
    },
};

// ============================================
// Component
// ============================================

interface CodraEscalationProps {
    escalation: CodraEscalation;
    onResolve: (id: string) => void;
    onDismiss?: (id: string) => void;
}

export function CodraEscalationBanner({ escalation, onResolve, onDismiss }: CodraEscalationProps) {
    const Icon = ESCALATION_ICONS[escalation.type];
    const colors = ESCALATION_COLORS[escalation.severity];

    if (escalation.resolved) return null;

    return (
        <div className={`${colors.bg} ${colors.border} border rounded-sm p-4`}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`${colors.icon} mt-0.5`}>
                    <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <p className={`text-sm font-medium ${colors.text}`}>
                        {escalation.severity === 'blocking' ? 'Action Required' : 'Notice'}
                    </p>
                    <p className="text-sm text-zinc-600 mt-1">
                        {escalation.message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {escalation.severity === 'blocking' ? (
                        <button
                            onClick={() => onResolve(escalation.id)}
                            className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-sm hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                        >
                            <Check size={12} />
                            Approve
                        </button>
                    ) : (
                        <button
                            onClick={() => onDismiss?.(escalation.id)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-sm transition-colors"
                            title="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Modal Variant (for blocking escalations)
// ============================================

interface CodraEscalationModalProps {
    escalation: CodraEscalation;
    onConfirm: () => void;
    onCancel: () => void;
}

export function CodraEscalationModal({ escalation, onConfirm, onCancel }: CodraEscalationModalProps) {
    const Icon = ESCALATION_ICONS[escalation.type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-sm shadow-xl max-w-md w-full mx-4 p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-full">
                        <Icon size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                            Codra
                        </p>
                        <p className="text-xs text-zinc-500">
                            System Intervention
                        </p>
                    </div>
                </div>

                {/* Message */}
                <p className="text-sm text-zinc-700 mb-6 leading-relaxed">
                    {escalation.message}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-sm hover:bg-zinc-800 transition-colors"
                    >
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </div>
    );
}
