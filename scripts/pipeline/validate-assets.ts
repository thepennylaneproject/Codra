#!/usr/bin/env tsx
/**
 * Validate Assets
 *
 * Validates asset metadata and reports issues.
 * Identifies assets ready for promotion to approved.
 *
 * Usage:
 *   tsx scripts/pipeline/validate-assets.ts [options]
 *
 * Options:
 *   --input <path>    Input registry file (default: ./out/asset-registry.json)
 *   --report          Generate detailed report (default: false)
 */

import { loadRegistryFromFile } from '../../src/pipeline/registry/index-generator';
import {
  validateAssets,
  getValidationSummary,
  canPromoteToApproved,
} from '../../src/pipeline/validation/lifecycle';
import fs from 'fs/promises';

interface Options {
  input: string;
  report: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: './out/asset-registry.json',
    report: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--input') options.input = args[++i];
    else if (arg === '--report') options.report = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: tsx scripts/pipeline/validate-assets.ts [options]

Options:
  --input <path>    Input registry file (default: ./out/asset-registry.json)
  --report          Generate detailed report (default: false)
  --help, -h        Show this help
`);
      process.exit(0);
    }
  }

  return options;
}

async function validateAssetsCommand() {
  const options = parseArgs();

  console.log('[Validation] Starting asset validation\n');
  console.log(`  Input: ${options.input}\n`);

  // Load registry
  const { assets } = await loadRegistryFromFile(options.input);
  console.log(`  Loaded ${assets.length} assets\n`);

  // Validate all assets
  const results = validateAssets(assets);
  const summary = getValidationSummary(results);

  // Print summary
  console.log('Validation Summary:');
  console.log(`  Total assets: ${summary.total}`);
  console.log(`  Valid: ${summary.valid} (${((summary.valid / summary.total) * 100).toFixed(1)}%)`);
  console.log(`  Invalid: ${summary.invalid}`);
  console.log(`  Can promote: ${summary.canPromote}`);
  console.log(`  Total errors: ${summary.totalErrors}`);
  console.log(`  Total warnings: ${summary.totalWarnings}`);

  // Check promotion eligibility
  console.log('\nPromotion Eligibility:');
  const eligible = assets.filter((a) => {
    const check = canPromoteToApproved(a);
    return check.can;
  });
  const ineligible = assets.filter((a) => {
    const check = canPromoteToApproved(a);
    return !check.can;
  });

  console.log(`  Eligible for approval: ${eligible.length}`);
  console.log(`  Not eligible: ${ineligible.length}`);

  // List draft assets by status
  const draftAssets = assets.filter((a) => a.lifecycle_status === 'draft');
  console.log(`\nDraft Assets: ${draftAssets.length}`);

  if (draftAssets.length > 0) {
    const readyDrafts = draftAssets.filter((a) =>
      canPromoteToApproved(a).can,
    );
    const pendingDrafts = draftAssets.filter(
      (a) => !canPromoteToApproved(a).can,
    );

    console.log(`  Ready for approval: ${readyDrafts.length}`);
    console.log(`  Pending enrichment: ${pendingDrafts.length}`);

    if (readyDrafts.length > 0 && readyDrafts.length <= 10) {
      console.log('\n  Ready assets:');
      readyDrafts.forEach((a) => {
        console.log(`    - ${a.public_id}`);
      });
    }
  }

  // Generate detailed report if requested
  if (options.report) {
    console.log('\n[Validation] Generating detailed report...');

    const report = {
      summary,
      eligible: eligible.map((a) => a.public_id),
      ineligible: ineligible.map((a) => ({
        public_id: a.public_id,
        reason: canPromoteToApproved(a).reason,
      })),
      validationResults: Array.from(results.entries()).map(
        ([publicId, result]) => ({
          public_id: publicId,
          valid: result.valid,
          can_promote: result.canPromote,
          errors: result.errors,
          warnings: result.warnings,
        }),
      ),
    };

    const reportPath = options.input.replace('.json', '-validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`  ✓ Report written to: ${reportPath}`);
  }

  // Exit with error if validation issues found
  if (summary.invalid > 0) {
    console.error('\n[Validation] ⚠️  Validation issues found');
    process.exit(1);
  }

  console.log('\n[Validation] ✓ All assets valid!');
}

// Run
validateAssetsCommand().catch((error) => {
  console.error('[Validation] Fatal error:', error);
  process.exit(1);
});
