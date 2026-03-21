/**
 * Accent Color Audit System
 *
 * Scans the codebase for accent color usage (#FF6B6B or var(--color-accent))
 * to ensure accent colors are only used for justified, high-priority elements.
 * Target: 100% justified usage
 */

export interface AccentUsage {
  file: string;
  line: number;
  context: string;
  isJustified: boolean;  // Manual annotation required
  usage: string;         // The actual color usage found
}

/**
 * Known justified accent usages
 * These are pre-approved and should be the only accent usages in the codebase
 */
const JUSTIFIED_USAGES: Record<string, string[]> = {
  // Primary CTA buttons
  'src/new/routes/onboarding/StepProjectInfo.tsx': ['Primary action button'],
  'src/new/components/panels/TaskLaunchPanel.tsx': ['Launch task button'],

  // Critical alerts/notifications
  'src/components/codra/LyraAssistant.tsx': ['Critical error state'],

  // Active state indicators (sparingly)
  'src/new/components/desks/DeskSwitcher.tsx': ['Active desk indicator'],

  // High-priority notifications
  'src/lib/notifications.ts': ['Critical notification badge']
};

/**
 * Patterns to search for accent color usage
 */
const ACCENT_PATTERNS = [
  /#FF6B6B/gi,                           // Hex color
  /#ff6b6b/gi,                           // Hex color lowercase
  /var\(--color-accent\)/gi,             // CSS variable
  /var\(--accent\)/gi,                   // Short form
  /\$accent/gi,                          // SCSS variable
  /accent-500/gi,                        // Tailwind-style
  /bg-accent/gi,                         // CSS class
  /text-accent/gi,                       // CSS class
  /border-accent/gi,                     // CSS class
];

/**
 * Find all accent color usages in a file
 */
export function findAccentUsagesInFile(
  filePath: string,
  content: string
): AccentUsage[] {
  const usages: AccentUsage[] = [];
  const lines = content.split('\n');

  const justifiedReasons = JUSTIFIED_USAGES[filePath.replace('/home/user/Codra/', '')] || [];

  lines.forEach((lineContent, index) => {
    ACCENT_PATTERNS.forEach(pattern => {
      const matches = lineContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          usages.push({
            file: filePath,
            line: index + 1,
            context: lineContent.trim(),
            isJustified: justifiedReasons.length > 0,
            usage: match
          });
        });
      }
    });
  });

  return usages;
}

/**
 * Generate accent usage report
 */
export interface AccentReport {
  totalUsages: number;
  justifiedUsages: number;
  unjustifiedUsages: number;
  justificationRate: number;
  usagesByFile: Record<string, number>;
  usages: AccentUsage[];
  meetsTarget: boolean;
}

export function generateAccentReport(usages: AccentUsage[]): AccentReport {
  const justified = usages.filter(usage => usage.isJustified);
  const unjustified = usages.filter(usage => !usage.isJustified);

  const usagesByFile = usages.reduce((fileUsageMap, usage) => {
    const shortPath = usage.file.replace('/home/user/Codra/', '');
    fileUsageMap[shortPath] = (fileUsageMap[shortPath] || 0) + 1;
    return fileUsageMap;
  }, {} as Record<string, number>);

  const justificationRate = usages.length > 0
    ? (justified.length / usages.length) * 100
    : 100;

  return {
    totalUsages: usages.length,
    justifiedUsages: justified.length,
    unjustifiedUsages: unjustified.length,
    justificationRate,
    usagesByFile,
    usages,
    meetsTarget: justificationRate === 100
  };
}

/**
 * CLI-friendly output for CI
 */
export function printAccentReport(report: AccentReport): void {
  console.log('\n=== Accent Color Audit ===\n');
  console.log(`Total Usages: ${report.totalUsages}`);
  console.log(`Justified: ${report.justifiedUsages}`);
  console.log(`Unjustified: ${report.unjustifiedUsages}`);
  console.log(`Justification Rate: ${report.justificationRate.toFixed(1)}%`);
  console.log(`Target: 100% justified`);
  console.log(`Status: ${report.meetsTarget ? '✅ MEETS TARGET' : '❌ NEEDS REVIEW'}\n`);

  if (report.unjustifiedUsages > 0) {
    console.log('⚠️  Unjustified Accent Usages:\n');
    report.usages
      .filter(usage => !usage.isJustified)
      .forEach(usage => {
        const shortPath = usage.file.replace('/home/user/Codra/', '');
        console.log(`  ${shortPath}:${usage.line}`);
        console.log(`    ${usage.context}`);
        console.log(`    Usage: ${usage.usage}\n`);
      });
  }

  console.log('Usages by File:');
  Object.entries(report.usagesByFile)
    .sort(([, countA], [, countB]) => countB - countA)
    .forEach(([file, count]) => {
      const justified = report.usages.filter(usage =>
        usage.file.endsWith(file) && usage.isJustified
      ).length;
      const marker = justified === count ? '✅' : '⚠️';
      console.log(`  ${marker} ${file}: ${justified}/${count} justified`);
    });
}

/**
 * Export helper for use in scripts
 */
export function auditAccentColor(): AccentUsage[] {
  // This will be populated by the CLI script that scans files
  return [];
}
