
import React from 'react';
import { DailyUsage } from '../../lib/billing/forecasting';

interface CostTrendChartProps {
    data: DailyUsage[];
}

export const CostTrendChart: React.FC<CostTrendChartProps> = ({ data }) => {
    if (!data || data.length === 0) return <div>No data available</div>;

    const maxCost = Math.max(...data.map(d => d.cost));
    const maxHeight = 100; // pixels

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Cost Trend (Last 7 Days)</h3>

            <div className="flex items-end justify-between h-[100px] gap-2">
                {data.map((day, index) => {
                    const height = maxCost > 0 ? (day.cost / maxCost) * maxHeight : 0;
                    return (
                        <div key={index} className="flex flex-col items-center w-full group">
                            <div className="relative w-full flex justify-center">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                    ${day.cost.toFixed(2)}
                                </div>
                                <div
                                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                                    style={{ height: `${Math.max(4, height)}px` }}
                                ></div>
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">
                                {new Date(day.date).getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
