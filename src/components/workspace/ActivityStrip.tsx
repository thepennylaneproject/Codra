/**
 * ACTIVITY STRIP
 * Fixed bottom status bar showing progress, budget, and alerts
 */

import React from 'react';
import { Activity, DollarSign, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertItem {
  type: 'info' | 'warning' | 'error';
  message: string;
}

interface ActivityStripProps {
  progress?: {
    current: number;
    total: number;
  };
  budget?: {
    used: number;
    total: number;
  };
  alerts?: AlertItem[];
}

export const ActivityStrip: React.FC<ActivityStripProps> = ({
  progress,
  budget,
  alerts = [],
}) => {
  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={14} />;
      case 'warning':
        return <AlertTriangle size={14} />;
      case 'info':
      default:
        return <Info size={14} />;
    }
  };

  const getAlertColor = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return 'var(--state-error)';
      case 'warning':
        return 'var(--state-warning)';
      case 'info':
      default:
        return 'var(--state-info)';
    }
  };

  return (
    <div
      className="h-10 shrink-0 flex items-center justify-between px-6 text-xs"
      style={{
        backgroundColor: 'var(--shell-surface-2)',
        borderTop: '1px solid var(--shell-border)',
        color: 'var(--shell-text-secondary)',
      }}
    >
      {/* Left: Progress */}
      <div className="flex items-center gap-6">
        {progress && (
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span className="font-medium">
              Progress: {progress.current}/{progress.total}
            </span>
            <div className="w-24 h-1.5 bg-[var(--shell-surface-0)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand-teal)] transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {budget && (
          <div className="flex items-center gap-2">
            <DollarSign size={14} />
            <span className="font-medium">
              Budget: ${budget.used.toFixed(2)} / ${budget.total.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Right: Alerts */}
      <div className="flex items-center gap-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{
              backgroundColor: `${getAlertColor(alert.type)}15`,
              color: getAlertColor(alert.type),
            }}
          >
            {getAlertIcon(alert.type)}
            <span className="font-medium text-[10px]">{alert.message}</span>
          </div>
        ))}
        {alerts.length === 0 && (
          <span className="text-[10px] opacity-60">All systems operational</span>
        )}
      </div>
    </div>
  );
};
