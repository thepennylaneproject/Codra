
import React, { useEffect, useState } from 'react';
import { getUsage } from '../../lib/billing/usage';

interface UsageMeterProps {
    userId: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ userId }) => {
    const [usage, setUsage] = useState<{ count: number; limit: number; plan: string } | null>(null);

    useEffect(() => {
        getUsage(userId).then(setUsage);
    }, [userId]);

    if (!usage) return <div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>;

    const percentage = Math.min((usage.count / usage.limit) * 100, 100);
    const color = percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">Usage</span>
                <span className="text-gray-500">{usage.count} / {usage.limit} requests</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="text-xs text-gray-400 mt-1 capitalize text-right">
                {usage.plan} Plan
            </div>
        </div>
    );
};
