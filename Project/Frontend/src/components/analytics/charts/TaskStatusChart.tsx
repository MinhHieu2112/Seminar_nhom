import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnalyticsSummary } from '@/services/analytics.service';

interface TaskStatusChartProps {
  summary: AnalyticsSummary;
}

export function TaskStatusChart({ summary }: TaskStatusChartProps) {
  const completed = summary.individualTasks.completed + summary.teamTasks.completed;
  const overdue = summary.individualTasks.overdue + summary.teamTasks.overdue;
  const total = summary.individualTasks.total + summary.teamTasks.total;
  const pending = Math.max(total - completed - overdue, 0);

  const data = [
    {
      name: 'Tasks',
      Completed: completed,
      Pending: pending,
      Overdue: overdue,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Status Distribution</h3>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" hide />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} />
            <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Overdue" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
