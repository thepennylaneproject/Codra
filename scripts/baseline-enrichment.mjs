/**
 * scripts/baseline-enrichment.mjs
 * 
 * High-throughput bulk runner for the EnrichmentEngine.
 * Applies the class-aware taxonomy (Vision AI + Heuristics) to all assets in Cloudinary.
 * 
 * Usage: tsx scripts/baseline-enrichment.mjs [--limit=N] [--offset=M] [--dry-run]
 * 
 * UPDATED: Uses Search API to avoid Admin API rate limits.
 */

import { v2 as cloudinary } from 'cloudinary';
import { EnrichmentEngine } from '../src/lib/image-policy/enrichment-engine.js';
import dotenv from 'dotenv';
import pLimit from 'p-limit';

dotenv.config({ path: '.env.local' });

// Configuration
const BATCH_SIZE = 100; // Cloudinary pagination
const CONCURRENCY = 5;  // To avoid hitting Claude rate limits too hard
const limit = pLimit(CONCURRENCY);

const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicKey) {
  console.error('ANTHROPIC_API_KEY missing');
  process.exit(1);
}

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const engine = new EnrichmentEngine(anthropicKey);

async function runEnrichment() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const maxAssets = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

  console.log('=== Baseline Enrichment Runner (Search API) ===');
  if (dryRun) console.log('[MODE: DRY RUN]');
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  let processedCount = 0;
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let nextCursor = null;

  try {
    do {
      // 1. Fetch assets from Cloudinary Search API (Rate limit: 5000/hr)
      // We request context, undefined tags, and structured metadata to pass to engine
      let query = cloudinary.search
        .expression('resource_type:image')
        .max_results(BATCH_SIZE)
        .with_field('context')
        .with_field('tags')
        .with_field('metadata');

      if (nextCursor) {
        query = query.next_cursor(nextCursor);
      }

      const response = await query.execute();
      const resources = response.resources;
      nextCursor = response.next_cursor;

      console.log(`Fetched batch of ${resources.length} assets...`);

      // 2. Process batch in parallel with concurrency limit
      const tasks = resources.map(resource => {
        return limit(async () => {
          if (processedCount >= maxAssets) return;
          
          processedCount++;
          const publicId = resource.public_id;
          
          // Optional: Check if already enriched to skip (save Claude tokens)
          const isEnriched = resource.metadata?.role && 
                             resource.metadata?.asset_class;

          if (isEnriched && !dryRun) { // In dry run, we might want to see what happens
             // console.log(`[${processedCount}] Skipping ${publicId} (Already Enriched)`);
             // skippedCount++;
             // return;
             // User asked for "baseline... same data", so we probably force re-run?
             // Or at least check if versions mismatch. For now, let's process all as requested.
          }
          
          console.log(`[${processedCount}] Processing ${publicId}...`);
          
          // Pass the existing resource to avoid Admin API read
          const result = await engine.processAsset(publicId, { 
              dryRun, 
              existingResource: resource 
          });
          
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`  [FAILED] ${publicId}: ${result.error}`);
          }
        });
      });

      await Promise.all(tasks);

      if (processedCount >= maxAssets) {
        console.log(`\nReached limit of ${maxAssets} assets.`);
        break;
      }

    } while (nextCursor);

    console.log('\n=== Enrichment Complete ===');
    console.log(`Total Processed: ${processedCount}`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Failed:  ${failCount}`);

  } catch (error) {
    console.error('\n[FATAL ERROR]', error);
  }
}

runEnrichment();
