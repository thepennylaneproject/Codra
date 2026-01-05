#!/usr/bin/env tsx
/**
 * Accent Color Audit CLI
 *
 * Scans the codebase for accent color usage and generates a report.
 * Checks for #FF6B6B, var(--color-accent), and related patterns.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import {
  findAccentUsagesInFile,
  generateAccentReport,
  printAccentReport,
  type AccentUsage
} from '../src/lib/metrics/accent-audit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scanFiles(): Promise<AccentUsage[]> {
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.css',
    'src/**/*.scss',
  ];

  const allUsages: AccentUsage[] = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: path.join(__dirname, '..'),
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/metrics/**'  // Don't scan the metrics code itself
      ]
    });

    for (const file of files) {
      const fullPath = path.join(__dirname, '..', file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const usages = findAccentUsagesInFile(fullPath, content);
      allUsages.push(...usages);
    }
  }

  return allUsages;
}

async function main() {
  console.log('Scanning codebase for accent color usage...\n');

  const usages = await scanFiles();
  const report = generateAccentReport(usages);

  printAccentReport(report);

  // Optional: fail CI if justification rate is too low
  if (process.argv.includes('--strict') && !report.meetsTarget) {
    console.error('\n❌ Accent usage does not meet 100% justification target');
    console.error('Please review unjustified accent usages.\n');
    process.exit(1);
  }

  if (report.meetsTarget) {
    console.log('\n✅ All accent usages are justified\n');
  } else {
    console.log(`\nℹ️  Review needed: ${report.unjustifiedUsages} unjustified usages found\n`);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Error running accent audit:', error);
  process.exit(1);
});
