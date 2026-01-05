
import { costEngine } from './cost';
import { smartRouter } from './smart-router';
import { budgetController } from '../billing/budget';
import { costForecaster } from '../billing/forecasting';

async function verify() {
    console.log('--- Verifying Cost Engine ---');
    const costGPT4 = costEngine.estimateCost('gpt-4', 1000);
    console.log('GPT-4 Cost (1k tokens):', costGPT4);

    const costDeepSeek = costEngine.estimateCost('deepseek-coder', 1000);
    console.log('DeepSeek Cost (1k tokens):', costDeepSeek);

    const comparison = costEngine.compareModels('Write a complex react component', ['gpt-4', 'gpt-3-turbo', 'claude-3-haiku']);
    console.log('Comparison Top 3:', comparison.map(c => `${c.model}: ${c.recommendation} ($${c.estimatedCost})`));

    console.log('\n--- Verifying Smart Router ---');
    const result1 = smartRouter.routeRequest('Write a React component for a Todo List');
    console.log(`Prompt: "Write a React component..." -> Model: ${result1.model} (${result1.reasoning})`);

    const result2 = smartRouter.routeRequest('Explain the meaning of life');
    console.log(`Prompt: "Explain..." -> Model: ${result2.model} (${result2.reasoning})`);

    console.log('\n--- Verifying Budget Controls ---');
    const workspaceId = 'test-workspace';
    await budgetController.updateBudgetConfig(workspaceId, { limit: 10, hardLimitEnabled: true });
    // mock usage high
    // Wait, budgetController uses `getUsage` which calls Supabase. 
    // This script might fail if Supabase credentials aren't loaded in this context.
    // I should mock getUsage or handle error.
    try {
        const status = await budgetController.getBudgetStatus(workspaceId);
        console.log('Budget Status:', status);
    } catch (e) {
        console.log('Budget Status Check failed (expected if no DB access):', e);
    }

    console.log('\n--- Verifying Forecasting ---');
    const history = [
        { date: '2024-01-01', cost: 1.0 },
        { date: '2024-01-02', cost: 1.2 },
        { date: '2024-01-03', cost: 1.5 }, // Increasing
    ];
    const forecast = costForecaster.forecastMonthlySpend(history);
    console.log('Forecast Trend:', forecast.trend);
    console.log('Predicted Total:', forecast.predictedTotal);

}

verify().catch(console.error);
