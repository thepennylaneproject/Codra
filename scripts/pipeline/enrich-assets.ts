#!/usr/bin/env tsx
/**
 * Enrich Assets Pipeline Runner
 *
 * Runs the enrichment engine on all draft assets.
 *
 * Usage:
 *   tsx scripts/pipeline/enrich-assets.ts [options]
 *
 * Options:
 *   --folder <folder>      Cloudinary folder to process (default: codra)
 *   --limit <n>            Process only N assets
 *   --concurrency <n>      AI API concurrency (default: 3)
 *   --rpm <n>              Requests per minute limit (default: 10)
 *   --skip-enriched        Skip assets already enriched (default: true)
 *   --dry-run              Show what would be done without executing
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { EnrichmentEngine } from '../../src/pipeline/enrichment/engine';
import { getCloudinary } from '../../src/pipeline/config/cloudinary';

interface Options {
  folder: string;
  limit: number;
  concurrency: number;
  rpm: number;
  skipEnriched: boolean;
  dryRun: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    folder: 'codra',
    limit: 0,
    concurrency: 3,
    rpm: 10,
    skipEnriched: true,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--folder') options.folder = args[++i];
    else if (arg === '--limit') options.limit = parseInt(args[++i], 10);
    else if (arg === '--concurrency')
      options.concurrency = parseInt(args[++i], 10);
    else if (arg === '--rpm') options.rpm = parseInt(args[++i], 10);
    else if (arg === '--skip-enriched') options.skipEnriched = true;
    else if (arg === '--no-skip-enriched') options.skipEnriched = false;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: tsx scripts/pipeline/enrich-assets.ts [options]

Options:
  --folder <folder>      Cloudinary folder to process (default: codra)
  --limit <n>            Process only N assets
  --concurrency <n>      AI API concurrency (default: 3)
  --rpm <n>              Requests per minute limit (default: 10)
  --skip-enriched        Skip assets already enriched (default: true)
  --no-skip-enriched     Re-enrich all assets
  --dry-run              Show what would be done without executing
  --help, -h             Show this help
`);
      process.exit(0);
    }
  }

  return options;
}

async function enrichAssets() {
  const options = parseArgs();

  console.log('[Enrichment] Starting asset enrichment pipeline\n');
  console.log(`  Folder: ${options.folder}`);
  console.log(`  Concurrency: ${options.concurrency}`);
  console.log(`  Requests/minute: ${options.rpm}`);
  console.log(`  Skip enriched: ${options.skipEnriched}`);
  if (options.limit > 0) console.log(`  Limit: ${options.limit} assets`);
  if (options.dryRun) console.log(`  DRY RUN MODE`);
  console.log('');

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      '[Enrichment] ✗ ANTHROPIC_API_KEY not found in environment',
    );
    process.exit(1);
  }

  // Fetch ALL assets from Cloudinary (with pagination)
  console.log('[Enrichment] Fetching assets from Cloudinary...');
  const cloudinary = getCloudinary();

  let assets: any[] = [];
  let nextCursor: string | undefined = undefined;
  let batchNum = 0;

  do {
    batchNum++;
    const response: any = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: options.folder,
      max_results: 500,
      metadata: true,
      tags: true,
      next_cursor: nextCursor,
    });

    const batch = response.resources;
    assets.push(...batch);
    nextCursor = response.next_cursor;
    
    console.log(`  Batch ${batchNum}: fetched ${batch.length} assets (${assets.length} total)`);
  } while (nextCursor);

  // Filter to rasters only (skip vectors for AI)
  assets = assets.filter((r: any) => r.format !== 'svg');
  console.log(`  Filtered to ${assets.length} raster assets (SVGs excluded)`);

  // Apply limit
  if (options.limit > 0) {
    assets = assets.slice(0, options.limit);
  }

  console.log(`  Found ${assets.length} raster assets to process\n`);

  if (options.dryRun) {
    console.log('[Enrichment] DRY RUN - would process:');
    assets.slice(0, 10).forEach((a: any, i: number) => {
      console.log(`  ${i + 1}. ${a.public_id}`);
    });
    if (assets.length > 10) {
      console.log(`  ... and ${assets.length - 10} more`);
    }
    process.exit(0);
  }

  // Initialize enrichment engine
  const engine = new EnrichmentEngine({
    aiEnricherOptions: {
      apiKey,
      model: 'claude-3-haiku-20240307',
      maxConcurrency: options.concurrency,
      maxRequestsPerMinute: options.rpm,
      retryAttempts: 5,
      timeoutMs: 60000,
    },
    skipIfEnriched: options.skipEnriched,
    enrichmentVersion: 1,
  });

  await engine.initialize();

  // Enrich assets
  const inputs = assets.map((r: any) => ({
    public_id: r.public_id,
    cloudinary_url: r.secure_url,
    existing_metadata: r.metadata || {},
  }));

  console.log('[Enrichment] Processing assets...\n');

  const startTime = Date.now();
  const results = await engine.enrichAssets(inputs);
  const duration = Date.now() - startTime;

  await engine.finalize();

  // Report results
  const stats = engine.getStats();

  console.log('\n[Enrichment] ✓ Complete\n');
  console.log('Summary:');
  console.log(`  Total processed: ${stats.engine.processed}`);
  console.log(`  Enriched (AI): ${stats.engine.enriched}`);
  console.log(`  Cached: ${stats.engine.cached}`);
  console.log(`  Skipped: ${stats.engine.skipped}`);
  console.log(`  Failed: ${stats.engine.failed}`);
  console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log('\nAI Stats:');
  console.log(`  Requests made: ${stats.ai.requestsMade}`);
  console.log(`  Succeeded: ${stats.ai.requestsSucceeded}`);
  console.log(`  Failed: ${stats.ai.requestsFailed}`);
  console.log(`  Total tokens: ${stats.ai.totalCost}`);

  if (stats.engine.failed > 0) {
    console.error('\n[Enrichment] ⚠️  Some assets failed to enrich');
    process.exit(1);
  }
}

// Run
enrichAssets().catch((error) => {
  console.error('[Enrichment] Fatal error:', error);
  process.exit(1);
});
