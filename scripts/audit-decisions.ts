#!/usr/bin/env tsx
/**
 * Decision Point Audit CLI
 *
 * Scans the application for decision points and generates a report.
 * Exits with code 1 if decision count exceeds target (10).
 */

import { printDecisionReport, generateDecisionReport } from '../src/lib/metrics/decision-audit';

function main() {
  const report = generateDecisionReport();

  printDecisionReport();

  // Output just the count for CI parsing
  if (process.argv.includes('--count-only')) {
    console.log(report.total);
    process.exit(0);
  }

  // Exit with error if exceeds target
  if (report.exceedsTarget) {
    console.error(`\n❌ Decision count (${report.total}) exceeds target (${report.targetCount})`);
    console.error('Please reduce decision points before merging.\n');
    process.exit(1);
  }

  console.log(`\n✅ Decision count within target (${report.total}/${report.targetCount})\n`);
  process.exit(0);
}

main();
