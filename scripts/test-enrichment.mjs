/**
 * scripts/test-enrichment.mjs
 * 
 * Verifies the EnrichmentEngine on a single live asset.
 */

import { EnrichmentEngine } from '../src/lib/image-policy/enrichment-engine.js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config({ path: '.env.local' });

async function test() {
  console.log('--- Testing Enrichment Engine ---');

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error('ANTHROPIC_API_KEY missing');
    process.exit(1);
  }

  const engine = new EnrichmentEngine(anthropicKey);

  // Pick a dormant asset from the index
  const index = JSON.parse(fs.readFileSync('./out/assets-index-enriched.json', 'utf8'));
  const dormant = index.find(a => a.role === 'other');
  
  if (!dormant) {
    console.log('No dormant assets found to test.');
    return;
  }

  console.log(`Target Asset: ${dormant.cloudinaryPublicId} (Role: ${dormant.role})`);
  console.log('Processing (Dry Run)...');

  try {
    const result = await engine.processAsset(dormant.cloudinaryPublicId, { dryRun: true });
    
    if (result.success) {
      console.log('  [SUCCESS]');
      console.log('  Mapped Metadata:', JSON.stringify(result.metadata, null, 2));
      console.log('  Tags:', result.tags.slice(0, 10).join(', '));
      console.log('  Promoted:', result.promoted);
    } else {
      console.error('  [FAILED]', result.error);
    }
  } catch (err) {
    console.error('  [ERROR]', err.message);
  }

  console.log('\n--- Test Complete ---');
}

test();
