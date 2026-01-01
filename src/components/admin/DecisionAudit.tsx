/**
 * Decision Audit Component
 *
 * Displays decision point analysis for the Codra application.
 */

import { useMemo } from 'react';
import { generateDecisionReport } from '../../lib/metrics/decision-audit';

export const DecisionAudit = () => {
  const report = useMemo(() => generateDecisionReport(), []);

  return (
    <section className="bg-white border-2 border-[#1A1A1A]/10 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
          Decision Point Audit
        </h2>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black">
            {report.total}
          </span>
          <span className="text-lg text-[#8A8A8A]">/ {report.targetCount} decisions</span>
          {report.exceedsTarget ? (
            <span className="text-red-600 text-sm font-black">❌ EXCEEDS TARGET</span>
          ) : (
            <span className="text-green-600 text-sm font-black">✅ WITHIN TARGET</span>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
          <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
            Required
          </div>
          <div className="text-2xl font-black">{report.required}</div>
        </div>
        <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
          <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
            Optional
          </div>
          <div className="text-2xl font-black">{report.optional}</div>
        </div>
      </div>

      {/* Decisions by Component */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-3">
          By Component
        </h3>
        <div className="space-y-2">
          {Object.entries(report.byComponent)
            .sort(([, a], [, b]) => b - a)
            .map(([component, count]) => (
              <div
                key={component}
                className="flex items-center justify-between bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded px-4 py-2"
              >
                <span className="font-mono text-sm">{component}</span>
                <span className="font-black">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* All Decision Points */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-3">
          All Decision Points
        </h3>
        <div className="space-y-3">
          {report.points.map((point, i) => (
            <div
              key={`${point.component}-${point.location}`}
              className="border-l-4 border-[#1A1A1A]/20 pl-4 py-2"
              style={{
                borderLeftColor: point.type === 'required' ? '#FF6B6B' : '#FFA500'
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-black text-sm">
                  {i + 1}. {point.component}
                </span>
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                  point.type === 'required'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {point.type}
                </span>
              </div>
              <div className="text-xs text-[#8A8A8A] font-mono mb-1">
                {point.location}
              </div>
              <div className="text-sm">
                {point.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
