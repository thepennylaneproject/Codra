
import { getUsage } from './usage';

export interface BudgetConfig {
    limit: number;
    currency: string;
    period: 'monthly';
    alertThresholds: number[]; // e.g. [0.5, 0.8, 0.95] for 50%, 80%, 95%
    hardLimitEnabled: boolean;
}

export interface BudgetStatus {
    currentSpend: number; // in currency
    limit: number;
    remaining: number;
    percentUsed: number;
    isExceeded: boolean;
    forecastedSpend: number;
}

const DEFAULT_BUDGET: BudgetConfig = {
    limit: 50.00, // $50 default
    currency: 'USD',
    period: 'monthly',
    alertThresholds: [0.8, 1.0],
    hardLimitEnabled: false
};

export class BudgetController {

    // In a real app, this would be fetched from DB
    // For now we simulate per-workspace config
    private mockConfigStore: Map<string, BudgetConfig> = new Map();

    async getBudgetConfig(workspaceId: string): Promise<BudgetConfig> {
        // Attempt to fetch from DB settings
        // const { data } = await supabase.from('workspace_settings').select('budget_config').eq('id', workspaceId).single();
        // return data?.budget_config || DEFAULT_BUDGET;

        return this.mockConfigStore.get(workspaceId) || DEFAULT_BUDGET;
    }

    async updateBudgetConfig(workspaceId: string, config: Partial<BudgetConfig>): Promise<void> {
        const current = await this.getBudgetConfig(workspaceId);
        const newConfig = { ...current, ...config };
        this.mockConfigStore.set(workspaceId, newConfig);

        // await supabase.from('workspace_settings').update({ budget_config: newConfig }).eq('id', workspaceId);
    }

    async getBudgetStatus(workspaceId: string): Promise<BudgetStatus> {
        const config = await this.getBudgetConfig(workspaceId);

        // Get usage. logic in usage.ts returns count of requests, but we need cost.
        // We'll need to upgrade usage tracking to track tokens/cost, 
        // OR estimate based on count * avg cost (naive).
        // Let's assume we can query a 'usage_logs' table for sum(cost).

        let currentSpend = 0;

        // Simulation: Get token usage count and multiply by avg cost of GPT-3.5
        // This is a placeholder until we have real cost tracking in DB
        const usage = await getUsage(workspaceId); // Assuming userId same as workspaceId for simplicity
        const avgCostPerRequest = 0.01; // $0.01
        currentSpend = usage.count * avgCostPerRequest;

        // Or use Supabase aggregation if table exists
        /*
        const { data } = await supabase.rpc('calculate_period_spend', { workspace_id: workspaceId });
        currentSpend = data || 0;
        */

        const percentUsed = currentSpend / config.limit;

        return {
            currentSpend,
            limit: config.limit,
            remaining: Math.max(0, config.limit - currentSpend),
            percentUsed,
            isExceeded: currentSpend >= config.limit,
            forecastedSpend: currentSpend * 1.5 // naive forecast
        };
    }

    async checkBudget(workspaceId: string): Promise<{ allowed: boolean; reason?: string }> {
        const config = await this.getBudgetConfig(workspaceId);
        const status = await this.getBudgetStatus(workspaceId);

        if (config.hardLimitEnabled && status.isExceeded) {
            return {
                allowed: false,
                reason: `Budget limit of $${config.limit} exceeded.`
            };
        }

        return { allowed: true };
    }
}

export const budgetController = new BudgetController();
