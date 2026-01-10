#!/usr/bin/env npx tsx
/**
 * Run Model Evaluations Script
 * 
 * Executes the eval suite against all active/candidate models.
 * Can be run manually or scheduled (e.g., weekly cron job).
 * 
 * Usage:
 *   npx tsx scripts/run-model-evals.ts
 *   npx tsx scripts/run-model-evals.ts --model=gpt-4o
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
    // Dynamic imports AFTER dotenv has loaded
    const { getEvalRunner } = await import('../src/lib/models/evals/eval-runner');
    const { getRegistryService } = await import('../src/lib/models/registry/registry-service');
    
    const args = process.argv.slice(2);
    const modelArg = args.find(a => a.startsWith('--model='));
    const specificModel = modelArg ? modelArg.split('=')[1] : null;

    console.log('='.repeat(60));
    console.log('Model Evaluation Runner');
    console.log('='.repeat(60));
    console.log(`Started at: ${new Date().toISOString()}`);
    
    if (specificModel) {
        console.log(`Target model: ${specificModel}`);
    } else {
        console.log('Running on all active/candidate models');
    }
    console.log('');

    try {
        const evalRunner = getEvalRunner();
        const registryService = getRegistryService();

        if (specificModel) {
            // Find the specific model
            const models = await registryService.getModels(['active', 'candidate']);
            const model = models.find(m => m.model_key === specificModel);
            
            if (!model) {
                console.error(`Model not found: ${specificModel}`);
                process.exit(1);
            }

            console.log(`Evaluating ${model.provider}:${model.model_key}...`);
            const result = await evalRunner.runModel(model);
            printResult(result);
        } else {
            // Run all models
            const results = await evalRunner.runAllModels();
            
            console.log('');
            console.log('='.repeat(60));
            console.log('Results Summary');
            console.log('='.repeat(60));
            
            for (const result of results) {
                printResult(result);
                console.log('-'.repeat(40));
            }
        }

        console.log('');
        console.log(`Finished at: ${new Date().toISOString()}`);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

function printResult(result: {
    provider: string;
    model_key: string;
    overall_score: number;
    coding_edit_score: number | null;
    tool_use_score: number | null;
    retrieval_score: number | null;
    json_validity_score: number | null;
}) {
    console.log(`Model: ${result.provider}:${result.model_key}`);
    console.log(`  Overall Score: ${(result.overall_score * 100).toFixed(1)}%`);
    console.log(`  Coding Edit:   ${result.coding_edit_score !== null ? (result.coding_edit_score * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`  Tool Use:      ${result.tool_use_score !== null ? (result.tool_use_score * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`  Retrieval:     ${result.retrieval_score !== null ? (result.retrieval_score * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`  JSON Validity: ${result.json_validity_score !== null ? (result.json_validity_score * 100).toFixed(1) + '%' : 'N/A'}`);
}

main();
