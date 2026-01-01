/**
 * ALERT SEGMENT
 * Inline warning/error display (replaces progress segment when active)
 */

import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { Alert } from './hooks';

interface AlertSegmentProps {
    alert: Alert;
    onDetailsClick?: () => void;
}

export function AlertSegment({ alert, onDetailsClick }: AlertSegmentProps) {
    const { type, message } = alert;

    // Determine icon and styling based on type
    const Icon =
        type === 'error' ? XCircle :
        type === 'warning' ? AlertTriangle :
        Info;

    const bgClass =
        type === 'error' ? 'bg-[#EF4444]/10' :
        type === 'warning' ? 'bg-[#F59E0B]/10' :
        'bg-[#3B82F6]/10';

    const iconColor =
        type === 'error' ? 'text-[#EF4444]' :
        type === 'warning' ? 'text-[#F59E0B]' :
        'text-[#3B82F6]';

    return (
        <div className={`flex items-center gap-2 px-4 ${bgClass}`}>
            <Icon size={14} className={iconColor} />
            <span className="text-sm text-zinc-300 font-medium flex-1">
                {message}
            </span>
            {alert.details && (
                <button
                    onClick={onDetailsClick}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline transition-colors"
                >
                    Details
                </button>
            )}
        </div>
    );
}
