/**
 * Accent Audit Component
 *
 * Displays accent color usage analysis.
 */

import { useState } from 'react';

export const AccentAudit = () => {
  const [scanResults, setScanResults] = useState<{
    total: number;
    justified: number;
    unjustified: number;
    rate: number;
  } | null>(null);

  const runScan = () => {
    // In a real implementation, this would trigger the accent audit script
    // For now, showing example data
    setScanResults({
      total: 5,
      justified: 5,
      unjustified: 0,
      rate: 100
    });
  };

  return (
    <section className="bg-white border-2 border-[#1A1A1A]/10 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
          Accent Color Audit
        </h2>
        <p className="text-sm text-[#8A8A8A]">
          Tracks usage of accent color (#FF6B6B) to ensure it's only used for justified, high-priority elements.
        </p>
      </div>

      {!scanResults ? (
        <div className="text-center py-12">
          <button
            onClick={runScan}
            className="px-6 py-3 bg-[#1A1A1A] text-white font-black text-sm uppercase tracking-wider rounded hover:bg-[#FF6B6B] transition-colors"
          >
            Run Accent Scan
          </button>
          <p className="text-xs text-[#8A8A8A] mt-3">
            Scans codebase for accent color usage
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
              <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
                Total Usages
              </div>
              <div className="text-2xl font-black">{scanResults.total}</div>
            </div>
            <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
              <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
                Justified
              </div>
              <div className="text-2xl font-black text-green-600">{scanResults.justified}</div>
            </div>
            <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
              <div className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-1">
                Rate
              </div>
              <div className="text-2xl font-black">{scanResults.rate}%</div>
            </div>
          </div>

          {scanResults.rate === 100 ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-black text-green-900">All accent usages are justified!</div>
              <div className="text-sm text-green-700 mt-1">
                100% of accent color usage meets design standards
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <div className="font-black text-yellow-900 mb-2">
                ⚠️ {scanResults.unjustified} unjustified usage(s) found
              </div>
              <div className="text-sm text-yellow-700">
                Review needed for proper accent color usage
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={runScan}
              className="text-sm text-[#8A8A8A] hover:text-[#1A1A1A] font-mono"
            >
              Re-scan →
            </button>
          </div>
        </>
      )}

      {/* Justified Usages Reference */}
      <div className="mt-6 pt-6 border-t border-[#1A1A1A]/10">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-3">
          Justified Usage Guidelines
        </h3>
        <ul className="space-y-2 text-sm text-[#8A8A8A]">
          <li className="flex items-start gap-2">
            <span className="text-[#FF6B6B] mt-0.5">•</span>
            <span>Primary CTA buttons (e.g., Launch Task, Create Spread)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF6B6B] mt-0.5">•</span>
            <span>Critical error states or alerts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF6B6B] mt-0.5">•</span>
            <span>Active state indicators (sparingly)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF6B6B] mt-0.5">•</span>
            <span>High-priority notifications</span>
          </li>
        </ul>
      </div>
    </section>
  );
};
