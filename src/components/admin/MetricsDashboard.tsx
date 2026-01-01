/**
 * Metrics Dashboard
 *
 * Internal dashboard for viewing Codra product metrics and validation data.
 * Displays decision points, accent usage, route complexity, and flow analytics.
 */

import { useAdminCheck } from '../../hooks/useAdminCheck';
import { DecisionAudit } from './DecisionAudit';
import { AccentAudit } from './AccentAudit';
import { RouteComplexity } from './RouteComplexity';
import { FlowMetrics } from './FlowMetrics';

export const MetricsDashboard = () => {
  const { isAdmin, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] flex items-center justify-center">
        <div className="text-[#8A8A8A]">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-[#1A1A1A] mb-2">Access Denied</h1>
          <p className="text-[#8A8A8A]">This dashboard is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] text-[#1A1A1A]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
              <h1 className="text-xl font-black uppercase tracking-wider">Codra Metrics</h1>
            </div>
            <div className="text-xs font-mono text-[#8A8A8A]">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Overview */}
        <section className="mb-12">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#8A8A8A] mb-6">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Decision Points"
              value="8"
              target="< 10"
              status="success"
              description="Total decisions across flows"
            />
            <MetricCard
              title="Accent Usage"
              value="100%"
              target="100%"
              status="success"
              description="Justified accent usages"
            />
            <MetricCard
              title="Production Routes"
              value="1"
              target="1"
              status="success"
              description="Consolidated desk workspace"
            />
            <MetricCard
              title="User Flows"
              value="3"
              target="3"
              status="success"
              description="Start, Task, Export"
            />
          </div>
        </section>

        {/* Detailed Sections */}
        <div className="space-y-8">
          <DecisionAudit />
          <AccentAudit />
          <RouteComplexity />
          <FlowMetrics />
        </div>
      </main>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  target: string;
  status: 'success' | 'warning' | 'error';
  description: string;
}

const MetricCard = ({ title, value, target, status, description }: MetricCardProps) => {
  const statusColors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900'
  };

  const statusIcons = {
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xs font-black uppercase tracking-wider opacity-70">
          {title}
        </h3>
        <span className="text-lg">{statusIcons[status]}</span>
      </div>
      <div className="mb-1">
        <span className="text-3xl font-black">{value}</span>
        <span className="text-sm ml-2 opacity-60">/ {target}</span>
      </div>
      <p className="text-xs opacity-70">{description}</p>
    </div>
  );
};
