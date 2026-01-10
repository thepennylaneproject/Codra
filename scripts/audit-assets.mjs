#!/usr/bin/env node

/**
 * scripts/audit-assets.mjs
 * 
 * Provides a health report on the computable asset registry.
 * Identifies coverage gaps and assets requiring enrichment.
 */

import fs from 'node:fs';
import path from 'node:path';

const INDEX_FILE = './out/assets-index-enriched.json';

async function audit() {
  console.log('--- Codra Asset Registry Audit ---');

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Registry not found: ${INDEX_FILE}`);
    process.exit(1);
  }

  const assets = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const total = assets.length;

  const stats = {
    lifecycle: {},
    role: {},
    productFamily: {},
    aspect: {},
    assetClass: {},
    vectorType: {},
    complexity: {},
    transparency: { true: 0, false: 0 },
  };

  const computable = [];
  const dormant = [];

  for (const a of assets) {
    // Collect stats
    stats.lifecycle[a.lifecycleStatus] = (stats.lifecycle[a.lifecycleStatus] || 0) + 1;
    stats.role[a.role] = (stats.role[a.role] || 0) + 1;
    stats.productFamily[a.productFamily] = (stats.productFamily[a.productFamily] || 0) + 1;
    stats.aspect[a.aspectClass] = (stats.aspect[a.aspectClass] || 0) + 1;
    stats.assetClass[a.assetClass] = (stats.assetClass[a.assetClass] || 0) + 1;
    stats.transparency[String(!!a.transparent)]++;

    if (a.assetClass === 'vector') {
        stats.vectorType[a.vectorType] = (stats.vectorType[a.vectorType] || 0) + 1;
        stats.complexity[a.complexity] = (stats.complexity[a.complexity] || 0) + 1;
    }

    // Criteria for "Computable" (Template-Ready)
    const isApproved = a.lifecycleStatus === 'approved';
    const hasRole = a.role && a.role !== 'other';
    const hasFamily = a.productFamily && a.productFamily !== 'other';

    if (isApproved && hasRole && hasFamily) {
        computable.push(a);
    } else {
        dormant.push(a);
    }
  }

  console.log(`\nRegistry Version: Latest`);
  console.log(`Total Assets:     ${total}`);
  console.log(`Computable:       ${computable.length} (${Math.round(computable.length/total*100)}%)`);
  console.log(`Dormant:          ${dormant.length} (${Math.round(dormant.length/total*100)}%)`);

  console.log('\n--- Distribution by Role ---');
  Object.entries(stats.role).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(25)}: ${String(v).padStart(5)}`);
  });

  console.log('\n--- Distribution by Asset Class ---');
  Object.entries(stats.assetClass).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(25)}: ${String(v).padStart(5)}`);
  });

  if (stats.assetClass.vector > 0) {
    console.log('\n--- Vector Specifics ---');
    console.log('  Types:');
    Object.entries(stats.vectorType).forEach(([k, v]) => console.log(`    ${k.padEnd(23)}: ${String(v).padStart(5)}`));
    console.log('  Complexity:');
    Object.entries(stats.complexity).forEach(([k, v]) => console.log(`    ${k.padEnd(23)}: ${String(v).padStart(5)}`));
  }

  console.log('\n--- Distribution by Family ---');
  Object.entries(stats.productFamily).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(25)}: ${String(v).padStart(5)}`);
  });

  console.log('\n--- Lifecycle Status ---');
  Object.entries(stats.lifecycle).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(25)}: ${String(v).padStart(5)}`);
  });

  if (dormant.length > 0) {
    console.log(`\n--- Audit Recommendations ---`);
    console.log(`- Action Required: Enforce enrichment on ${dormant.length} dormant assets.`);
    console.log(`- Priority: Resolve ${stats.role.other || 0} assets marked as 'other' role.`);
    if (stats.assetClass.vector > 0 && stats.vectorType.mixed > 0) {
        console.log(`- Vector Focus: Normalize ${stats.vectorType.mixed} vectors currently marked as 'mixed' type.`);
    }
  }

  console.log('\n--- Audit Complete ---');
}

audit();
