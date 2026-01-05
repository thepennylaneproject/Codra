/**
 * Flow Metrics Component
 *
 * Displays analytics for the 3 main user flows:
 * 1. Start (Create Spread)
 * 2. Run Task
 * 3. Export
 */

export const FlowMetrics = () => {
  // In a real implementation, this would fetch analytics data from PostHog or database
  const flowData = {
    start: {
      totalSessions: 0,
      completed: 0,
      avgDuration: 0,
      completionRate: 0
    },
    task: {
      totalSessions: 0,
      completed: 0,
      avgDuration: 0,
      completionRate: 0
    },
    export: {
      totalSessions: 0,
      completed: 0,
      avgDuration: 0,
      completionRate: 0
    }
  };

  return (
    <section className="bg-white border-2 border-[#1A1A1A]/10 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
          User Flow Metrics
        </h2>
        <p className="text-sm text-[#8A8A8A]">
          Analytics for the 3 core user flows: Start, Task, Export
        </p>
      </div>

      <div className="space-y-4">
        {/* Flow 1: Start */}
        <FlowCard
          icon="🚀"
          title="Flow 1: Start"
          description="Create new spread/project"
          data={flowData.start}
          targetDuration={60000} // 60 seconds
        />

        {/* Flow 2: Task */}
        <FlowCard
          icon="⚡"
          title="Flow 2: Run Task"
          description="Execute task on desk"
          data={flowData.task}
          targetDuration={120000} // 2 minutes
        />

        {/* Flow 3: Export */}
        <FlowCard
          icon="📦"
          title="Flow 3: Export"
          description="Export output to format"
          data={flowData.export}
          targetDuration={5000} // 5 seconds
        />
      </div>

      {/* Analytics Integration Info */}
      <div className="mt-6 pt-6 border-t border-[#1A1A1A]/10">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] mb-3">
          Analytics Integration
        </h3>
        <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <div className="font-black text-sm mb-1">PostHog Analytics</div>
              <div className="text-xs text-[#8A8A8A] space-y-1">
                <p>Flow events are tracked using the analytics library:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>flow_start_began / flow_start_completed</li>
                  <li>flow_task_began / flow_task_completed</li>
                  <li>flow_export_began / flow_export_completed</li>
                </ul>
                <p className="mt-2">
                  View detailed analytics in your PostHog dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracked Events */}
      <div className="mt-4">
        <details className="group">
          <summary className="text-xs font-black uppercase tracking-wider text-[#8A8A8A] cursor-pointer hover:text-[#1A1A1A] transition-colors">
            Tracked Events ▾
          </summary>
          <div className="mt-3 space-y-3">
            <EventCard
              event="flow_start_began"
              description="User starts creating a new spread"
              properties={['flowId', 'projectId', 'timestamp']}
            />
            <EventCard
              event="flow_start_completed"
              description="Spread creation completed"
              properties={['flowId', 'projectId', 'spreadId', 'durationMs']}
            />
            <EventCard
              event="flow_task_began"
              description="User launches a task on a desk"
              properties={['flowId', 'taskId', 'deskId', 'projectId']}
            />
            <EventCard
              event="flow_task_completed"
              description="Task execution completed"
              properties={['flowId', 'taskId', 'success', 'durationMs', 'outputCount']}
            />
            <EventCard
              event="flow_export_began"
              description="User starts export process"
              properties={['flowId', 'outputId', 'format', 'deskId']}
            />
            <EventCard
              event="flow_export_completed"
              description="Export completed successfully"
              properties={['flowId', 'outputId', 'success', 'durationMs', 'fileSize']}
            />
          </div>
        </details>
      </div>
    </section>
  );
};

interface FlowCardProps {
  icon: string;
  title: string;
  description: string;
  data: {
    totalSessions: number;
    completed: number;
    avgDuration: number;
    completionRate: number;
  };
  targetDuration: number;
}

const FlowCard = ({ icon, title, description, data, targetDuration }: FlowCardProps) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const meetsTarget = data.avgDuration > 0 && data.avgDuration <= targetDuration;

  return (
    <div className="bg-[#FFFAF0] border-2 border-[#1A1A1A]/10 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-black text-sm mb-0.5">{title}</h3>
          <p className="text-xs text-[#8A8A8A]">{description}</p>
        </div>
        {data.totalSessions > 0 && (
          <div className={`text-xs font-black px-2 py-1 rounded ${
            meetsTarget ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {meetsTarget ? '✅ On Target' : '⚠️ Review'}
          </div>
        )}
      </div>

      {data.totalSessions > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-[#8A8A8A] mb-0.5">Sessions</div>
            <div className="font-black">{data.totalSessions}</div>
          </div>
          <div>
            <div className="text-xs text-[#8A8A8A] mb-0.5">Completed</div>
            <div className="font-black">{data.completed}</div>
          </div>
          <div>
            <div className="text-xs text-[#8A8A8A] mb-0.5">Avg Duration</div>
            <div className="font-black">{formatDuration(data.avgDuration)}</div>
          </div>
          <div>
            <div className="text-xs text-[#8A8A8A] mb-0.5">Completion</div>
            <div className="font-black">{data.completionRate}%</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-[#8A8A8A]">
          No data yet. Events will appear here once users complete this flow.
        </div>
      )}
    </div>
  );
};

interface EventCardProps {
  event: string;
  description: string;
  properties: string[];
}

const EventCard = ({ event, description, properties }: EventCardProps) => {
  return (
    <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded p-3">
      <div className="font-mono text-xs font-black mb-1">{event}</div>
      <div className="text-xs text-[#8A8A8A] mb-2">{description}</div>
      <div className="flex flex-wrap gap-1">
        {properties.map(prop => (
          <span
            key={prop}
            className="text-[10px] font-mono bg-white border border-[#1A1A1A]/10 rounded px-1.5 py-0.5"
          >
            {prop}
          </span>
        ))}
      </div>
    </div>
  );
};
