/**
 * AUDIT TAILWIND CONFIG
 * Validates that Tailwind configuration only includes approved design tokens.
 * Exits with code 1 if violations are found.
 */

import config from '../tailwind.config.js';

// Approved design tokens
const allowedFontSizes = ['xs', 'sm', 'base', 'xl'];
const allowedFontWeights = ['normal', 'medium', 'semibold'];
const allowedSpacing = ['0', '1', '2', '3', '4', '6', '8', '12'];

let hasViolations = false;

// Check font sizes
const configFontSizes = Object.keys(config.theme?.fontSize || {});
const fontSizeViolations = configFontSizes.filter(size => !allowedFontSizes.includes(size));

if (fontSizeViolations.length > 0) {
  console.error('❌ Tailwind config has unauthorized font sizes:', fontSizeViolations.join(', '));
  console.error('   Allowed font sizes:', allowedFontSizes.join(', '));
  hasViolations = true;
}

// Check font weights
const configFontWeights = Object.keys(config.theme?.fontWeight || {});
const fontWeightViolations = configFontWeights.filter(weight => !allowedFontWeights.includes(weight));

if (fontWeightViolations.length > 0) {
  console.error('❌ Tailwind config has unauthorized font weights:', fontWeightViolations.join(', '));
  console.error('   Allowed font weights:', allowedFontWeights.join(', '));
  hasViolations = true;
}

// Check spacing
const configSpacing = Object.keys(config.theme?.spacing || {});
const spacingViolations = configSpacing.filter(space => !allowedSpacing.includes(space));

if (spacingViolations.length > 0) {
  console.error('❌ Tailwind config has unauthorized spacing values:', spacingViolations.join(', '));
  console.error('   Allowed spacing:', allowedSpacing.join(', '));
  hasViolations = true;
}

if (hasViolations) {
  console.error('\n❌ Tailwind config audit FAILED');
  console.error('   Please use only approved design tokens');
  process.exit(1);
}

console.log('✅ Tailwind config audit passed');
console.log(`   Font sizes: ${configFontSizes.length} (all approved)`);
console.log(`   Font weights: ${configFontWeights.length} (all approved)`);
console.log(`   Spacing values: ${configSpacing.length} (all approved)`);
