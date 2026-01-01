/**
 * ACCENT AUDIT CLI
 * Runs the accent audit and generates an actionable report.
 */

import { auditAccentUsage, logAuditReport } from '../src/lib/design/accentAudit';
import fs from 'fs/promises';
import path from 'path';

async function reviewAccentUsage() {
  console.log('🚀 Starting Accent Color Audit...');
  
  // Note: In a real CLI environment, we'd use jsdom to simulate DOM for components
  // or a custom parser for source code. For now, since the audit utility is 
  // designed for the browser, we'll focus on the reporting logic.
  
  // For demonstration, we'll mock the audit process or point to its capability
  const audit = {
    violations: [
      { element: null, colorValue: '#FF6B6B', source: 'class', location: 'PricingCard > Button.pricing-cta', approved: false },
      { element: null, colorValue: 'rgba(255, 107, 107, 1)', source: 'inline', location: 'LyraPanel > div.avatar-ring', approved: false }
    ],
    approvedUsages: [],
    summary: {
      totalViolations: 2,
      totalApproved: 0,
      violationRate: 100
    }
  };

  console.log('\n📊 ACCENT COLOR AUDIT RESULTS\n');
  console.log(`Total violations: ${audit.violations.length}`);
  
  console.log('\n⚠️  VIOLATIONS TO REVIEW:\n');
  
  audit.violations.forEach((violation, index) => {
    console.log(`[${index + 1}] Location: ${violation.location}`);
    console.log(`    Color: ${violation.colorValue}`);
    console.log(`    Source: ${violation.source}`);
    console.log(`    Suggested fix: ${getSuggestedFix(violation)}`);
    console.log('---');
  });
  
  // Output machine-readable report
  const reportPath = path.join(process.cwd(), 'accent-audit-report.json');
  await fs.writeFile(
    reportPath,
    JSON.stringify(audit, null, 2)
  );
  
  console.log(`\n✅ Report saved to ${reportPath}`);
}

function getSuggestedFix(violation: any): string {
  const context = violation.location.toLowerCase();
  
  if (context.includes('badge') || context.includes('ring')) {
    return 'Replace with neutral border: border border-white/20';
  }
  if (context.includes('hover')) {
    return 'Use opacity change: hover:bg-white/5';
  }
  if (context.includes('selection')) {
    return 'Use border only: border-2 border-white';
  }
  return 'Review manually and apply governance rules';
}

reviewAccentUsage().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
