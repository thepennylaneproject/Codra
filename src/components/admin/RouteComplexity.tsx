/**
 * Route Complexity Component
 *
 * Displays route analysis and complexity metrics.
 */

import { useMemo } from 'react';
import { generateRouteComplexityReport } from '../../lib/metrics/route-complexity';

export const RouteComplexity = () => {
  const report = useMemo(() => generateRouteComplexityReport(), []);

  return (
    <section className="bg-white border-2 border-[#1A1A1A]/10 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
          Route Complexity
        </h2>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black">
            {report.productionRoutes}
          </span>
          <span className="text-lg text-[#8A8A8A]">production route(s)</span>
          {report.meetsTarget ? (
            <span className="text-green-600 text-sm font-black">✅ MEETS TARGET</span>
          ) : (
            <span className="text-yellow-600 text-sm font-black">⚠️ MULTIPLE ROUTES</span>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
          <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
            Total Routes
          </div>
          <div className="text-2xl font-black">{report.totalRoutes}</div>
        </div>
        <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
          <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
            Production
          </div>
          <div className="text-2xl font-black">{report.productionRoutes}</div>
        </div>
        <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
          <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
            Total Decisions
          </div>
          <div className="text-2xl font-black">{report.totalDecisionPoints}</div>
        </div>
      </div>

      {/* Decision Points by Type */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-3">
          Decision Points by Route Type
        </h3>
        <div className="space-y-2">
          {Object.entries(report.decisionPointsByType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const total = report.routes.filter(r => r.type === type).length;
              const avgDecisions = (count / total).toFixed(1);

              return (
                <div
                  key={type}
                  className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-sm capitalize">{type}</span>
                    <span className="font-black">{count} decisions</span>
                  </div>
                  <div className="text-xs text-[#8A8A8A]">
                    {total} routes · {avgDecisions} avg decisions/route
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Production Routes Detail */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-3">
          Production Routes
        </h3>
        <div className="space-y-3">
          {report.routes
            .filter(r => r.type === 'production')
            .map((route) => (
              <div
                key={route.path}
                className="border-l-4 border-[#FF6B6B] bg-[#FFFAF0] pl-4 py-3 pr-4 rounded-r"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-black text-sm">{route.name}</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-red-100 text-red-800">
                    {route.decisionPoints} decisions
                  </span>
                </div>
                <div className="text-xs text-[#8A8A8A] font-mono">
                  {route.path}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* All Routes */}
      <div>
        <details className="group">
          <summary className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-3 cursor-pointer hover:text-[#1A1A1A] transition-colors">
            All Routes ({report.totalRoutes}) ▾
          </summary>
          <div className="space-y-2 mt-3">
            {report.routes.map((route) => {
              const icon = route.type === 'production' ? '🏭' :
                           route.type === 'onboarding' ? '🚀' :
                           route.type === 'settings' ? '⚙️' : '🌐';
              const protectedIcon = route.isProtected ? '🔒' : '🔓';

              return (
                <div
                  key={route.path}
                  className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded px-4 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{protectedIcon}</span>
                      <span className="font-mono text-xs">{route.path}</span>
                    </div>
                    <span className="text-xs font-black text-[#8A8A8A]">
                      {route.decisionPoints} decisions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </div>
    </section>
  );
};
