import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startOfMonth } from 'date-fns';
import { useSettingsStore } from '../lib/store/useSettingsStore';
import { useToast } from '../new/components/Toast';
import { analytics } from '../lib/analytics';
import { useEffect, useState } from 'react';

export function useBudget() {
    const budgetLimit = useSettingsStore((state) => state.budgetDefaults.dailyBudgetLimit);
    const toast = useToast();
    const [warnedThresholds, setWarnedThresholds] = useState<Set<number>>(new Set());

    const { data, isLoading } = useQuery({
        queryKey: ['budget'],
        queryFn: async () => {
            const start = startOfMonth(new Date()).toISOString();
            
            const { data: runs, error } = await supabase
                .from('ai_runs')
                .select('actual_cost_usd, workspace_id, model_id, created_at')
                .gte('created_at', start);

            if (error) throw error;

            const spent = (runs || []).reduce((sum, r) => sum + (r.actual_cost_usd || 0), 0);
            const limit = budgetLimit || 50;
            const percentage = (spent / limit) * 100;

            // Grouping
            const byDesk: Record<string, number> = {};
            const byModel: Record<string, number> = {};
            
            (runs || []).forEach(r => {
                const desk = r.workspace_id || 'unassigned';
                const model = r.model_id || 'unknown';
                byDesk[desk] = (byDesk[desk] || 0) + (r.actual_cost_usd || 0);
                byModel[model] = (byModel[model] || 0) + (r.actual_cost_usd || 0);
            });

            // Forecast
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const currentDay = Math.max(1, now.getDate());
            const forecast = (spent / currentDay) * daysInMonth;

            return {
                spent,
                limit,
                percentage,
                byDesk,
                byModel,
                forecast,
                runs: runs || []
            };
        },
        refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    });

    const budget = data || {
        spent: 0,
        limit: budgetLimit || 50,
        percentage: 0,
        byDesk: {},
        byModel: {},
        forecast: 0,
        runs: []
    };

    // Threshold Warnings
    useEffect(() => {
        if (!data) return;

        const thresholds = [100, 80, 50];
        for (const threshold of thresholds) {
            if (budget.percentage >= threshold && !warnedThresholds.has(threshold)) {
                const message = threshold === 100 
                    ? 'Budget exceeded! Review your spending.' 
                    : `${threshold}% of budget used.`;
                
                toast.warning(message);
                setWarnedThresholds(prev => {
                    const next = new Set(prev);
                    next.add(threshold);
                    return next;
                });
                analytics.track('budget_threshold_reached', { threshold, percentage: budget.percentage });
                break; // Only show the highest threshold reached
            }
        }
    }, [budget.percentage, data, toast, warnedThresholds]);

    return { ...budget, isLoading };
}
