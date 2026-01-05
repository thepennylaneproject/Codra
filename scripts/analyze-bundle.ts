#!/usr/bin/env tsx
/**
 * Bundle Size Analysis CLI
 *
 * Analyzes the build output and generates a size report.
 * Use this to compare before/after bundle sizes when removing features.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BundleAnalysis {
  totalSize: number;
  gzippedSize?: number;
  files: Array<{
    name: string;
    size: number;
    type: 'js' | 'css' | 'asset';
  }>;
  breakdown: {
    js: number;
    css: number;
    assets: number;
  };
}

function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function analyzeBuild(): Promise<BundleAnalysis> {
  const distDir = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distDir)) {
    throw new Error('Build directory not found. Run "npm run build" first.');
  }

  const jsFiles = await glob('**/*.js', { cwd: distDir });
  const cssFiles = await glob('**/*.css', { cwd: distDir });
  const assetFiles = await glob('**/*.{png,jpg,jpeg,svg,woff,woff2,ico}', { cwd: distDir });

  const files: BundleAnalysis['files'] = [];
  let totalSize = 0;

  // Analyze JS files
  for (const file of jsFiles) {
    const fullPath = path.join(distDir, file);
    const size = getFileSize(fullPath);
    files.push({ name: file, size, type: 'js' });
    totalSize += size;
  }

  // Analyze CSS files
  for (const file of cssFiles) {
    const fullPath = path.join(distDir, file);
    const size = getFileSize(fullPath);
    files.push({ name: file, size, type: 'css' });
    totalSize += size;
  }

  // Analyze asset files
  for (const file of assetFiles) {
    const fullPath = path.join(distDir, file);
    const size = getFileSize(fullPath);
    files.push({ name: file, size, type: 'asset' });
    totalSize += size;
  }

  // Calculate breakdown
  const breakdown = {
    js: files.filter(f => f.type === 'js').reduce((sum, f) => sum + f.size, 0),
    css: files.filter(f => f.type === 'css').reduce((sum, f) => sum + f.size, 0),
    assets: files.filter(f => f.type === 'asset').reduce((sum, f) => sum + f.size, 0),
  };

  return {
    totalSize,
    files: files.sort((a, b) => b.size - a.size),
    breakdown
  };
}

function printReport(analysis: BundleAnalysis): void {
  console.log('\n=== Bundle Size Analysis ===\n');
  console.log(`Total Size: ${formatBytes(analysis.totalSize)}`);
  console.log('\nBreakdown:');
  console.log(`  JavaScript: ${formatBytes(analysis.breakdown.js)}`);
  console.log(`  CSS: ${formatBytes(analysis.breakdown.css)}`);
  console.log(`  Assets: ${formatBytes(analysis.breakdown.assets)}`);

  console.log('\nLargest Files:');
  analysis.files.slice(0, 10).forEach((file, i) => {
    const icon = file.type === 'js' ? '📦' : file.type === 'css' ? '🎨' : '🖼️';
    console.log(`  ${i + 1}. ${icon} ${file.name}`);
    console.log(`     ${formatBytes(file.size)}`);
  });

  // Save report to JSON for comparison
  const reportPath = path.join(__dirname, '..', 'bundle-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\nReport saved to: bundle-report.json`);
}

function compareReports(before: string, after: string): void {
  const beforeData: BundleAnalysis = JSON.parse(fs.readFileSync(before, 'utf-8'));
  const afterData: BundleAnalysis = JSON.parse(fs.readFileSync(after, 'utf-8'));

  const diff = afterData.totalSize - beforeData.totalSize;
  const percentChange = ((diff / beforeData.totalSize) * 100).toFixed(2);

  console.log('\n=== Bundle Size Comparison ===\n');
  console.log(`Before: ${formatBytes(beforeData.totalSize)}`);
  console.log(`After:  ${formatBytes(afterData.totalSize)}`);
  console.log(`Change: ${diff > 0 ? '+' : ''}${formatBytes(diff)} (${percentChange}%)`);

  if (diff > 0) {
    console.log('\n⚠️  Bundle size increased');
  } else if (diff < 0) {
    console.log('\n✅ Bundle size decreased');
  } else {
    console.log('\n➡️  Bundle size unchanged');
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--compare')) {
    const beforeIdx = args.indexOf('--before');
    const afterIdx = args.indexOf('--after');

    if (beforeIdx === -1 || afterIdx === -1) {
      console.error('Usage: --compare --before <file> --after <file>');
      process.exit(1);
    }

    const beforeFile = args[beforeIdx + 1];
    const afterFile = args[afterIdx + 1];

    compareReports(beforeFile, afterFile);
  } else {
    const analysis = await analyzeBuild();
    printReport(analysis);
  }
}

main().catch(error => {
  console.error('Error analyzing bundle:', error);
  process.exit(1);
});
