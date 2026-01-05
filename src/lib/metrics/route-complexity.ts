/**
 * Route Complexity Analysis
 *
 * Analyzes and reports on route complexity across the application.
 * Target: 1 production route (consolidated desk workspace)
 */

export interface RouteInfo {
  path: string;
  name: string;
  type: 'production' | 'onboarding' | 'settings' | 'public';
  decisionPoints: number;
  isProtected: boolean;
}

/**
 * All routes in the Codra application
 * Based on App.tsx routing configuration
 */
export const APP_ROUTES: RouteInfo[] = [
  // PUBLIC ROUTES
  {
    path: '/',
    name: 'Home (redirects to /projects)',
    type: 'public',
    decisionPoints: 0,
    isProtected: false
  },
  {
    path: '/pricing',
    name: 'Pricing Page',
    type: 'public',
    decisionPoints: 1, // Tier selection
    isProtected: false
  },
  {
    path: '/blueprints',
    name: 'Blueprint Gallery',
    type: 'public',
    decisionPoints: 1, // Blueprint selection
    isProtected: false
  },
  {
    path: '/login',
    name: 'Login',
    type: 'public',
    decisionPoints: 0,
    isProtected: false
  },
  {
    path: '/signup',
    name: 'Sign Up',
    type: 'public',
    decisionPoints: 0,
    isProtected: false
  },
  {
    path: '/auth/callback',
    name: 'Auth Callback',
    type: 'public',
    decisionPoints: 0,
    isProtected: false
  },

  // ONBOARDING ROUTES
  {
    path: '/new',
    name: 'Onboarding Flow (Streamlined)',
    type: 'onboarding',
    decisionPoints: 2, // Project info + optional context
    isProtected: true
  },
  {
    path: '/onboarding/new-project',
    name: 'New Project Onboarding (Legacy)',
    type: 'onboarding',
    decisionPoints: 5, // Multiple steps
    isProtected: true
  },

  // PRODUCTION ROUTES (DESKS)
  {
    path: '/p/:projectId/production',
    name: 'Desk Workspace (Production)',
    type: 'production',
    decisionPoints: 3, // Desk selection + task launch + model selection
    isProtected: true
  },

  // OTHER PROTECTED ROUTES
  {
    path: '/projects',
    name: 'Projects List',
    type: 'settings',
    decisionPoints: 1, // Select project
    isProtected: true
  },
  {
    path: '/settings',
    name: 'Settings',
    type: 'settings',
    decisionPoints: 2, // Theme + AI preferences
    isProtected: true
  },
  {
    path: '/p/:projectId/spread',
    name: 'Spread Page (Legacy)',
    type: 'production',
    decisionPoints: 2,
    isProtected: true
  },
  {
    path: '/p/:projectId/context',
    name: 'Project Context',
    type: 'settings',
    decisionPoints: 1,
    isProtected: true
  },
  {
    path: '/coherence-scan',
    name: 'Coherence Scan',
    type: 'settings',
    decisionPoints: 2, // Scan type + options
    isProtected: true
  }
];

/**
 * Get production routes (main work contexts)
 */
export function getProductionRoutes(): RouteInfo[] {
  return APP_ROUTES.filter(r => r.type === 'production');
}

/**
 * Get total decision points across all routes
 */
export function getTotalDecisionPoints(): number {
  return APP_ROUTES.reduce((sum, route) => sum + route.decisionPoints, 0);
}

/**
 * Get decision points by route type
 */
export function getDecisionPointsByType(): Record<string, number> {
  const byType: Record<string, number> = {};

  APP_ROUTES.forEach(route => {
    if (!byType[route.type]) {
      byType[route.type] = 0;
    }
    byType[route.type] += route.decisionPoints;
  });

  return byType;
}

/**
 * Generate route complexity report
 */
export interface RouteComplexityReport {
  totalRoutes: number;
  productionRoutes: number;
  totalDecisionPoints: number;
  decisionPointsByType: Record<string, number>;
  routes: RouteInfo[];
  meetsTarget: boolean; // Target: 1 production route
}

export function generateRouteComplexityReport(): RouteComplexityReport {
  const productionRoutes = getProductionRoutes();

  return {
    totalRoutes: APP_ROUTES.length,
    productionRoutes: productionRoutes.length,
    totalDecisionPoints: getTotalDecisionPoints(),
    decisionPointsByType: getDecisionPointsByType(),
    routes: APP_ROUTES,
    meetsTarget: productionRoutes.length <= 1
  };
}

/**
 * CLI-friendly output
 */
export function printRouteComplexityReport(): void {
  const report = generateRouteComplexityReport();

  console.log('\n=== Route Complexity Report ===\n');
  console.log(`Total Routes: ${report.totalRoutes}`);
  console.log(`Production Routes: ${report.productionRoutes} (Target: 1)`);
  console.log(`Status: ${report.meetsTarget ? '✅ MEETS TARGET' : '⚠️  MULTIPLE PRODUCTION ROUTES'}\n`);

  console.log('Decision Points by Type:');
  Object.entries(report.decisionPointsByType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  console.log('\nProduction Routes:');
  getProductionRoutes().forEach(route => {
    console.log(`  • ${route.name}`);
    console.log(`    Path: ${route.path}`);
    console.log(`    Decision Points: ${route.decisionPoints}\n`);
  });

  console.log('All Routes:');
  report.routes.forEach(route => {
    const icon = route.type === 'production' ? '🏭' :
                 route.type === 'onboarding' ? '🚀' :
                 route.type === 'settings' ? '⚙️' : '🌐';
    const protected_marker = route.isProtected ? '🔒' : '🔓';
    console.log(`  ${icon} ${protected_marker} ${route.name}`);
    console.log(`     ${route.path} (${route.decisionPoints} decisions)`);
  });
}
