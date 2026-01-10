/**
 * scripts/test-resolver.mjs
 * 
 * Verifies the ImageResolver utility against the live enriched index.
 */

import { resolveImageByRole } from '../src/utils/image-resolver.js';

async function test() {
  console.log('--- Testing Image Resolver ---');

  const tests = [
    { role: 'spot_illustration', productFamily: 'relevnt_core' },
    { role: 'hero', productFamily: 'pro' },
    { role: 'background-soft', aspect: 'landscape' },
    { role: 'feature_card', productFamily: 'starter' },
  ];

  for (const t of tests) {
    console.log(`\nResolving: role=${t.role}, family=${t.productFamily || 'any'}, aspect=${t.aspect || 'any'}`);
    try {
      const result = await resolveImageByRole(t);
      if (result.success) {
        console.log(`  [SUCCESS] Found: ${result.assetId}`);
        console.log(`  URL: ${result.url}`);
        console.log(`  Reason: ${result.reason}`);
      } else {
        console.log(`  [FAILED] ${result.reason}`);
      }
    } catch (err) {
      console.error(`  [ERROR] ${err.message}`);
    }
  }

  console.log('\n--- Test Complete ---');
}

test();
