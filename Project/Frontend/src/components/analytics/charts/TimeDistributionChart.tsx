import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeDistribution } from '@/services/analytics.service';

interface TimeDistributionChartProps {
  data: TimeDistribution;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981']; // Purple, Blue, Green

export function TimeDistributionChart({ data }: TimeDistributionChartProps) {
  const chartData = [
    { name: 'Morning', value: data.morning },
    { name: 'Afternoon', value: data.afternoon },
    { name: 'Evening', value: data.evening },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Distribution</h3>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              formatter={(value: unknown) => [`${value ? Number(value) : 0}%`, 'Time Spent']}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
