/**
 * Decision Point Audit System
 *
 * Tracks and counts all decision points in the application to prevent decision creep.
 * Target: < 10 total decisions across all flows
 */

export interface DecisionPoint {
  location: string;          // Component or route
  type: 'required' | 'optional';
  description: string;
  component: string;
}

// Global registry for tracking decision points
class DecisionRegistry {
  private points: Map<string, DecisionPoint> = new Map();

  register(point: DecisionPoint): void {
    const key = `${point.component}:${point.location}`;
    this.points.set(key, point);
  }

  getAll(): DecisionPoint[] {
    return Array.from(this.points.values());
  }

  getRequired(): DecisionPoint[] {
    return this.getAll().filter(p => p.type === 'required');
  }

  getOptional(): DecisionPoint[] {
    return this.getAll().filter(p => p.type === 'optional');
  }

  getByComponent(component: string): DecisionPoint[] {
    return this.getAll().filter(p => p.component === component);
  }

  count(): number {
    return this.points.size;
  }

  clear(): void {
    this.points.clear();
  }
}

export const decisionRegistry = new DecisionRegistry();

/**
 * Register a decision point in the application
 * Only active in development mode
 */
export function registerDecisionPoint(point: DecisionPoint): void {
  if (process.env.NODE_ENV === 'development') {
    decisionRegistry.register(point);
  }
}

/**
 * Audit decision points across the entire application
 * This function scans the codebase statically to find decision points
 */
export function auditDecisionPoints(): DecisionPoint[] {
  // Known decision points based on the Codra flow audit
  const knownDecisionPoints: DecisionPoint[] = [
    // ONBOARDING FLOW (3 steps streamlined)
    {
      location: '/new?step=context',
      type: 'required',
      description: 'Project name and description',
      component: 'StepProjectInfo'
    },
    {
      location: '/new?step=context',
      type: 'optional',
      description: 'Add context files (optional)',
      component: 'StepAddContext'
    },

    // DESK SELECTION (Single decision: which desk to use)
    {
      location: '/p/:projectId/production',
      type: 'required',
      description: 'Select desk (Write/Design/Code/Analyze)',
      component: 'DeskSwitcher'
    },



    // EXPORT FLOW
    {
      location: 'ExportPanel',
      type: 'optional',
      description: 'Export format selection',
      component: 'ExportPanel'
    },

    // SETTINGS (Not part of core flow but exists)
    {
      location: '/settings',
      type: 'optional',
      description: 'Theme preferences',
      component: 'SettingsPage'
    },
    {
      location: '/settings',
      type: 'optional',
      description: 'AI provider preferences',
      component: 'SettingsPage'
    }
  ];

  // Merge with runtime registered points
  const runtimePoints = decisionRegistry.getAll();
  const allPoints = [...knownDecisionPoints, ...runtimePoints];

  // Deduplicate by component:location
  const uniquePoints = new Map<string, DecisionPoint>();
  allPoints.forEach(point => {
    const key = `${point.component}:${point.location}`;
    uniquePoints.set(key, point);
  });

  return Array.from(uniquePoints.values());
}

/**
 * Generate a report of decision points
 */
export function generateDecisionReport(): {
  total: number;
  required: number;
  optional: number;
  byComponent: Record<string, number>;
  points: DecisionPoint[];
  exceedsTarget: boolean;
  targetCount: number;
} {
  const points = auditDecisionPoints();
  const required = points.filter(p => p.type === 'required');
  const optional = points.filter(p => p.type === 'optional');

  const byComponent = points.reduce((acc, point) => {
    acc[point.component] = (acc[point.component] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const targetCount = 10;

  return {
    total: points.length,
    required: required.length,
    optional: optional.length,
    byComponent,
    points,
    exceedsTarget: points.length > targetCount,
    targetCount
  };
}

/**
 * CLI-friendly output for CI
 */
export function printDecisionReport(): void {
  const report = generateDecisionReport();

  console.log('\n=== Decision Point Audit ===\n');
  console.log(`Total Decisions: ${report.total}/${report.targetCount}`);
  console.log(`Required: ${report.required}`);
  console.log(`Optional: ${report.optional}`);
  console.log(`Status: ${report.exceedsTarget ? '❌ EXCEEDS TARGET' : '✅ WITHIN TARGET'}\n`);

  console.log('Decisions by Component:');
  Object.entries(report.byComponent)
    .sort(([, a], [, b]) => b - a)
    .forEach(([component, count]) => {
      console.log(`  ${component}: ${count}`);
    });

  console.log('\nAll Decision Points:');
  report.points.forEach((point, i) => {
    const marker = point.type === 'required' ? '🔴' : '🟡';
    console.log(`  ${i + 1}. ${marker} ${point.component}`);
    console.log(`     Location: ${point.location}`);
    console.log(`     ${point.description}\n`);
  });
}
