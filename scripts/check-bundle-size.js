/**
 * CHECK BUNDLE SIZE
 * Monitors JavaScript bundle size to prevent performance regressions.
 * Warns if bundle size increases by >10% from baseline.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASELINE_SIZE_MB = 2.0; // 2MB baseline
const WARNING_THRESHOLD = 0.10; // 10% increase

async function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch (err) {
    // Directory might not exist
    return 0;
  }
  
  return totalSize;
}

async function checkBundleSize() {
  console.log('📦 Checking bundle size...\n');
  
  const distPath = path.join(__dirname, '../dist');
  
  try {
    await fs.access(distPath);
  } catch {
    console.error('❌ dist/ folder not found. Please run `npm run build` first.');
    process.exit(1);
  }
  
  const totalBytes = await getDirectorySize(distPath);
  const totalMB = totalBytes / (1024 * 1024);
  
  console.log(`Bundle size: ${totalMB.toFixed(2)} MB`);
  console.log(`Baseline:    ${BASELINE_SIZE_MB.toFixed(2)} MB`);
  
  const percentChange = ((totalMB - BASELINE_SIZE_MB) / BASELINE_SIZE_MB) * 100;
  
  if (percentChange > WARNING_THRESHOLD * 100) {
    console.warn(`\n⚠️  WARNING: Bundle size increased by ${percentChange.toFixed(1)}%`);
    console.warn(`   This is above the ${(WARNING_THRESHOLD * 100).toFixed(0)}% threshold.`);
    console.warn('   Consider:');
    console.warn('   - Code splitting for large dependencies');
    console.warn('   - Lazy loading for routes');
    console.warn('   - Tree shaking unused exports');
    console.warn('   - Analyzing bundle with `npm run build -- --analyze`\n');
  } else if (percentChange > 0) {
    console.log(`\n✓ Bundle size increased by ${percentChange.toFixed(1)}% (within threshold)`);
  } else {
    console.log(`\n✅ Bundle size decreased by ${Math.abs(percentChange).toFixed(1)}%`);
  }
  
  // Get breakdown of largest files
  const jsFiles = await findJsFiles(distPath);
  const sortedFiles = jsFiles
    .map(file => ({
      path: path.relative(distPath, file.path),
      size: file.size / 1024 // KB
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);
  
  if (sortedFiles.length > 0) {
    console.log('\nLargest files:');
    sortedFiles.forEach(file => {
      console.log(`  ${file.path.padEnd(40)} ${file.size.toFixed(1)} KB`);
    });
  }
}

async function findJsFiles(dirPath) {
  let jsFiles = [];
  
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      jsFiles = jsFiles.concat(await findJsFiles(fullPath));
    } else if (entry.isFile() && /\.(js|mjs)$/.test(entry.name)) {
      const stats = await fs.stat(fullPath);
      jsFiles.push({ path: fullPath, size: stats.size });
    }
  }
  
  return jsFiles;
}

checkBundleSize().catch(err => {
  console.error('Bundle size check failed:', err);
  process.exit(1);
});
