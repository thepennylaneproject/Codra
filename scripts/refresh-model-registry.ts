#!/usr/bin/env npx tsx
/**
 * Refresh Model Registry Script
 * 
 * Discovers models from all configured providers and updates the registry.
 * Can be run manually or scheduled (e.g., daily cron job).
 * 
 * Usage:
 *   npx tsx scripts/refresh-model-registry.ts
 */

// Load environment variables FIRST before any other imports
// Using dynamic import to ensure dotenv runs before other modules load
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
    // Dynamic import AFTER dotenv has loaded
    const { getRegistryService } = await import('../src/lib/models/registry/registry-service');
    
    console.log('='.repeat(60));
    console.log('Model Registry Refresh');
    console.log('='.repeat(60));
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    try {
        const registryService = getRegistryService();
        const result = await registryService.refreshRegistry();

        console.log('');
        console.log('='.repeat(60));
        console.log('Refresh Complete');
        console.log('='.repeat(60));
        console.log(`Registry Version: ${result.version}`);
        console.log(`Models Discovered: ${result.discovered}`);
        console.log(`Models Updated: ${result.updated}`);
        console.log(`Models Deprecated: ${result.deprecated}`);
        
        if (result.errors.length > 0) {
            console.log('');
            console.log('Errors:');
            result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
        }

        console.log('');
        console.log(`Finished at: ${new Date().toISOString()}`);
        
        // Exit with error code if there were errors
        if (result.errors.length > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
