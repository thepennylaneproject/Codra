/**
 * LINT COMPONENTS
 * Scans component files for forbidden patterns and design system violations.
 * Exits with code 1 if violations are found.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns to detect
const ARBITRARY_VALUE_PATTERN = /className=["'][^"']*\[([^\]]+)\][^"']*["']/g;
const HARDCODED_COLOR_PATTERN = /(#[0-9A-Fa-f]{3,6}|rgb\(|rgba\()/;
const FORBIDDEN_FONT_SIZES = /text-(2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|lg)/;
const FORBIDDEN_FONT_WEIGHTS = /font-(thin|extralight|light|bold|extrabold|black)/;

let violations = [];

async function scanDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, dist, and other non-source directories
      if (!['node_modules', 'dist', '.git', '.github', 'coverage'].includes(entry.name)) {
        await scanDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      await scanFile(fullPath);
    }
  }
}

async function scanFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for arbitrary Tailwind values
    const arbitraryMatches = [...line.matchAll(ARBITRARY_VALUE_PATTERN)];
    if (arbitraryMatches.length > 0) {
      arbitraryMatches.forEach(match => {
        violations.push({
          file: filePath,
          line: lineNumber,
          type: 'arbitrary-value',
          value: match[1],
          message: `Arbitrary Tailwind value: [${match[1]}]`
        });
      });
    }
    
    // Check for hardcoded colors in className
    if (line.includes('className') && HARDCODED_COLOR_PATTERN.test(line)) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: 'hardcoded-color',
        message: 'Hardcoded color value detected in className'
      });
    }
    
    // Check for forbidden font sizes
    if (FORBIDDEN_FONT_SIZES.test(line)) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: 'forbidden-font-size',
        message: 'Non-approved font size (use xs, sm, base, xl only)'
      });
    }
    
    // Check for forbidden font weights
    if (FORBIDDEN_FONT_WEIGHTS.test(line)) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: 'forbidden-font-weight',
        message: 'Non-approved font weight (use normal, medium, semibold only)'
      });
    }
  });
}

async function lintComponents() {
  console.log('🔍 Scanning components for design system violations...\n');
  
  const srcPath = path.join(__dirname, '../src');
  await scanDirectory(srcPath);
  
  if (violations.length > 0) {
    console.error(`❌ Found ${violations.length} design system violation(s):\n`);
    
    // Group by file
    const byFile = violations.reduce((acc, v) => {
      if (!acc[v.file]) acc[v.file] = [];
      acc[v.file].push(v);
      return acc;
    }, {});
    
    Object.entries(byFile).forEach(([file, fileViolations]) => {
      const relativePath = path.relative(process.cwd(), file);
      console.error(`📄 ${relativePath}`);
      fileViolations.forEach(v => {
        console.error(`   Line ${v.line}: ${v.message}`);
        if (v.value) {
          console.error(`   Value: ${v.value}`);
        }
      });
      console.error('');
    });
    
    console.error('❌ Component lint FAILED');
    console.error('   Please use only approved design tokens\n');
    process.exit(1);
  }
  
  console.log('✅ Component lint passed - no design system violations found');
}

lintComponents().catch(err => {
  console.error('Component linting failed:', err);
  process.exit(1);
});
