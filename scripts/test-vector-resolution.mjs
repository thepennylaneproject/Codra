/**
 * scripts/test-vector-resolution.mjs
 * 
 * Verifies class-aware resolution for Raster vs Vector.
 */

import { executeImagePolicy } from '../src/lib/image-policy/policy-executor.js';
import { loadSnapshot } from '../src/lib/image-policy/canonical-registry.js';
import { EnrichmentEngine } from '../src/lib/image-policy/enrichment-engine.js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config({ path: '.env.local' });

async function test() {
  console.log('--- Testing Vector Resolution ---');

  // Load registry
  const snapshot = await loadSnapshot('latest');
  console.log(`Registry loaded: ${snapshot.assets.length} assets`);

  const context = {
    template: {
      templateId: 'test-template'
    }
  };

  // Scenario 1: Resolve a high-res RASTER background
  console.log('\n[Scenario 1] Requesting High-Res Raster Background...');
  const rasterResult = await executeImagePolicy({
    mode: 'canonical-only',
    selection: {
      role: 'background-soft',
      assetClass: 'raster',
      minWidth: 1024,
      maxAssets: 1
    }
  }, context);

  if (rasterResult.success && rasterResult.canonicalAssets.length > 0) {
    const asset = rasterResult.canonicalAssets[0];
    console.log(`  [SUCCESS] Found: ${asset.cloudinaryPublicId}`);
    console.log(`  Reason: ${asset.reason}`);
  } else {
    console.log('  [FAILED] No match');
  }

  // Scenario 2: Resolve a VECTOR (any role)
  console.log('\n[Scenario 2] Requesting Vector (any role)...');
  const vectorResult = await executeImagePolicy({
    mode: 'canonical-only',
    selection: {
      role: 'any',
      assetClass: 'vector',
      minWidth: 5000, // Ridiculous width, should be ignored for vectors
      maxAssets: 1
    }
  }, context);

  if (vectorResult.success && vectorResult.canonicalAssets.length > 0) {
    const asset = vectorResult.canonicalAssets[0];
    console.log(`  [SUCCESS] Found: ${asset.cloudinaryPublicId}`);
    console.log(`  Reason: ${asset.reason}`);
  } else {
    console.log('  [FAILED] No match (unmet: ' + vectorResult.errorDetails?.unmetConstraints?.join(', ') + ')');
  }

  console.log('\n--- Test Complete ---');
}

test();
