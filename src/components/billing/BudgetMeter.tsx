
import React, { useState, useEffect } from 'react';
import { budgetController, BudgetStatus, BudgetConfig } from '../../lib/billing/budget';

interface BudgetMeterProps {
    workspaceId: string;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({ workspaceId }) => {
    const [status, setStatus] = useState<BudgetStatus | null>(null);
    const [config, setConfig] = useState<BudgetConfig | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const s = await budgetController.getBudgetStatus(workspaceId);
            const c = await budgetController.getBudgetConfig(workspaceId);
            setStatus(s);
            setConfig(c);
        };
        fetchStatus();
    }, [workspaceId]);

    if (!status || !config) return <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>;

    const percent = Math.min(100, Math.max(0, status.percentUsed * 100));
    let color = 'bg-green-500';
    if (status.percentUsed > 0.8) color = 'bg-yellow-500';
    if (status.percentUsed >= 1.0) color = 'bg-red-500';

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly Budget</h3>
                    <p className="text-xs text-gray-500">
                        {status.isExceeded ? 'Limit Exceeded' : `${status.remaining.toFixed(2)} ${config.currency} remaining`}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ${status.currentSpend.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500"> / ${config.limit}</span>
                </div>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>

            {status.percentUsed > 0.8 && (
                <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    ⚠️ {status.percentUsed >= 1.0 ? 'Budget limit reached. Requests may be blocked.' : 'You are approaching your budget limit.'}
                </div>
            )}
        </div>
    );
};
