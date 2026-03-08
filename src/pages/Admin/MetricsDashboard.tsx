import { useMetrics } from '@/hooks/useMetrics';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { MetricCard } from './components/MetricCard';
import { FunnelChart } from './components/FunnelChart';
import { FlowMetrics } from './components/FlowMetrics';
import { Layout } from 'lucide-react';

export function MetricsDashboard() {
  const { isAdmin, isLoading: isAdminLoading } = useAdminCheck();
  const { 
    decisionCount,
    onboardingFunnel,
    accentViolations,
    flowMetrics,
    isLoading
  } = useMetrics();
  
  if (isAdminLoading || isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">Access Denied</h1>
          <p className="text-zinc-500">This dashboard is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                Product Metrics
            </h1>
            <p className="text-sm text-zinc-500">
                Performance and health monitoring for Codra
            </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-xs font-semibold text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Live Monitor
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
            title="Decision Points"
            current={decisionCount.current}
            target={10}
            status={decisionCount.current <= 10 ? 'healthy' : 'warning'}
            description="Active decision nodes across current project"
        />
        
        <MetricCard
            title="Time to First Spread"
            current={`${flowMetrics.avgTimeToFirstSpread}s`}
            target="<60s"
            status={flowMetrics.avgTimeToFirstSpread < 60 ? 'healthy' : 'warning'}
            description="Average duration from start to first generation"
        />

        <MetricCard
            title="Accent Violations"
            current={accentViolations.count}
            target={0}
            status={accentViolations.count === 0 ? 'healthy' : 'critical'}
            description="Detected direct coral color overrides"
        />

        <MetricCard
            title="Active Users"
            current={42}
            target={100}
            status="healthy"
            description="Users active in the last 24 hours"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <h2 className="text-xs font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                <Layout size={14} />
                Onboarding Funnel
            </h2>
            <FunnelChart
                data={[
                    { name: 'Step 1: Info', count: onboardingFunnel.step1 },
                    { name: 'Step 2: Context', count: onboardingFunnel.step2 },
                    { name: 'Step 3: Generate', count: onboardingFunnel.step3 },
                    { name: 'Completed', count: onboardingFunnel.completed },
                ]}
            />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <h2 className="text-xs font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                <Layout size={14} />
                Flow Completion %
            </h2>
            <FlowMetrics
                flows={[
                    { name: 'Start Project', rate: flowMetrics.startCompletion },
                    { name: 'Run Task', rate: flowMetrics.taskCompletion },
                    { name: 'Export', rate: flowMetrics.exportCompletion },
                ]}
            />
        </div>
      </div>
    </div>
  );
}
