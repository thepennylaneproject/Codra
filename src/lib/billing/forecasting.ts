
export interface DailyUsage {
    date: string;
    cost: number;
}

export interface ForecastResult {
    predictedTotal: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    dailyAverage: number;
    confidence: number;
}

export class CostForecaster {

    forecastMonthlySpend(history: DailyUsage[]): ForecastResult {
        if (!history || history.length === 0) {
            return {
                predictedTotal: 0,
                trend: 'stable',
                dailyAverage: 0,
                confidence: 0
            };
        }

        // 1. Calculate Daily Average
        const totalCost = history.reduce((sum, day) => sum + day.cost, 0);
        const dailyAverage = totalCost / history.length;

        // 2. Simple Projection to end of month (assuming 30 days)
        const daysInMonth = 30;
        const predictedTotal = dailyAverage * daysInMonth;

        // 3. Detect Trend (Simple comparison of first half vs second half)
        let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
        if (history.length >= 2) {
            const midpoint = Math.floor(history.length / 2);
            const firstHalf = history.slice(0, midpoint);
            const secondHalf = history.slice(midpoint);

            const firstAvg = firstHalf.reduce((s, d) => s + d.cost, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((s, d) => s + d.cost, 0) / secondHalf.length;

            if (secondAvg > firstAvg * 1.1) trend = 'increasing';
            else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
        }

        return {
            predictedTotal,
            trend,
            dailyAverage,
            confidence: Math.min(0.9, history.length / 10) // More data = higher confidence, max 0.9
        };
    }
}

export const costForecaster = new CostForecaster();
