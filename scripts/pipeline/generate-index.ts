#!/usr/bin/env tsx
/**
 * Generate Asset Registry Index
 *
 * Generates the canonical asset registry from Cloudinary.
 * This is the read-only cache that resolvers use.
 *
 * Usage:
 *   tsx scripts/pipeline/generate-index.ts [options]
 *
 * Options:
 *   --folder <folder>           Cloudinary folder (default: codra)
 *   --output <path>             Output file path (default: ./out/asset-registry.json)
 *   --max <n>                   Max assets to fetch (default: 500)
 *   --include-deprecated        Include deprecated assets (default: false)
 *   --materialize-slots         Also generate slot mappings (default: false)
 */

import { generateRegistryIndex } from '../../src/pipeline/registry/index-generator';
import { materializeSlots } from '../../src/pipeline/registry/slot-materializer';
import { loadRegistryFromFile } from '../../src/pipeline/registry/index-generator';

interface Options {
  folder: string;
  output: string;
  max: number;
  includeDeprecated: boolean;
  materializeSlots: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    folder: 'codra',
    output: './out/asset-registry.json',
    max: 500,
    includeDeprecated: false,
    materializeSlots: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--folder') options.folder = args[++i];
    else if (arg === '--output') options.output = args[++i];
    else if (arg === '--max') options.max = parseInt(args[++i], 10);
    else if (arg === '--include-deprecated') options.includeDeprecated = true;
    else if (arg === '--materialize-slots') options.materializeSlots = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: tsx scripts/pipeline/generate-index.ts [options]

Options:
  --folder <folder>           Cloudinary folder (default: codra)
  --output <path>             Output file path (default: ./out/asset-registry.json)
  --max <n>                   Max assets to fetch (default: 500)
  --include-deprecated        Include deprecated assets (default: false)
  --materialize-slots         Also generate slot mappings (default: false)
  --help, -h                  Show this help
`);
      process.exit(0);
    }
  }

  return options;
}

async function generateIndex() {
  const options = parseArgs();

  console.log('[IndexGenerator] Starting registry generation\n');
  console.log(`  Folder: ${options.folder}`);
  console.log(`  Output: ${options.output}`);
  console.log(`  Max results: ${options.max}`);
  console.log(
    `  Include deprecated: ${options.includeDeprecated ? 'yes' : 'no'}`,
  );
  console.log(
    `  Materialize slots: ${options.materializeSlots ? 'yes' : 'no'}`,
  );
  console.log('');

  // Generate index
  const result = await generateRegistryIndex({
    folder: options.folder,
    outputPath: options.output,
    maxResults: options.max,
    includeDeprecated: options.includeDeprecated,
  });

  console.log('\n[IndexGenerator] ✓ Registry generated\n');
  console.log('Details:');
  console.log(`  Version: ${result.version}`);
  console.log(`  Generated: ${result.generatedAt}`);
  console.log(`  Total assets: ${result.total}`);
  console.log(`    - Approved: ${result.approved}`);
  console.log(`    - Draft: ${result.draft}`);
  console.log(`    - Deprecated: ${result.deprecated}`);
  console.log(`  Output: ${result.outputPath}`);

  // Materialize slots if requested
  if (options.materializeSlots) {
    console.log('\n[IndexGenerator] Materializing slot mappings...');

    const { assets } = await loadRegistryFromFile(options.output);
    const slotsOutput = options.output.replace('.json', '-slots.json');

    await materializeSlots(assets, slotsOutput);

    console.log(`  ✓ Slot mappings written to: ${slotsOutput}`);
  }

  console.log('\n[IndexGenerator] ✓ Complete!');
  console.log('\nNext steps:');
  console.log('  1. Use the resolver to test asset selection');
  console.log('  2. Run validation: tsx scripts/pipeline/validate-assets.ts');
  console.log(
    '  3. Deploy the registry to your application for runtime resolution',
  );
}

// Run
generateIndex().catch((error) => {
  console.error('[IndexGenerator] Fatal error:', error);
  process.exit(1);
});
