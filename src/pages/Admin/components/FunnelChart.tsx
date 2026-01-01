import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';

interface FunnelStep {
  name: string;
  count: number;
}

interface FunnelChartProps {
  data: FunnelStep[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  // Add drop-off percentage calculation
  const chartData = data.map((step, index) => {
    const prevCount = index > 0 ? data[index - 1].count : step.count;
    const dropOff = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 100;
    
    return {
      ...step,
      percentage: dropOff,
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1AA' }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
            {chartData.map((_entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`rgba(99, 102, 241, ${1 - index * 0.2})`} 
              />
            ))}
            <LabelList 
                dataKey="count" 
                position="right" 
                style={{ fontSize: 10, fontWeight: 800, fill: '#18181B' }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
