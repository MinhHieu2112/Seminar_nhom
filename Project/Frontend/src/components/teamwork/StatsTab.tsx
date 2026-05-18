import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import type { Task, Group } from '@/types/api';

interface StatsTabProps {
  group: Group;
  tasks: Task[];
  profiles: any[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B']; // Xong, Chờ duyệt, Chờ

export function StatsTab({ group, tasks, profiles }: StatsTabProps) {
  // 1. Dữ liệu biểu đồ tròn (Task theo trạng thái)
  const statusData = useMemo(() => {
    let done = 0;
    let review = 0;
    let pending = 0;
    let overdue = 0;

    tasks.forEach(t => {
      if (t.status === 'done') {
        done++;
      } else if (t.submittedForReview) {
        review++;
      } else {
        const isOverdue = t.dueTime && new Date(t.dueTime) < new Date();
        if (isOverdue) {
          overdue++;
        } else {
          pending++;
        }
      }
    });

    return [
      { name: 'Xong', value: done, color: '#10B981' },
      { name: 'Chờ duyệt', value: review, color: '#3B82F6' },
      { name: 'Chờ', value: pending, color: '#F59E0B' },
      { name: 'Trễ hạn', value: overdue, color: '#EF4444' }
    ].filter(d => d.value > 0); // Chỉ hiện những trạng thái có task
  }, [tasks]);

  // 2. Dữ liệu biểu đồ cột ngang (Mức độ đóng góp của thành viên)
  const memberData = useMemo(() => {
    const counts: Record<string, { total: number; done: number }> = {};
    
    // Khởi tạo tất cả thành viên (cho dù chưa có task)
    group.members?.forEach(m => {
      counts[m.userId] = { total: 0, done: 0 };
    });

    // Đếm task
    tasks.forEach(t => {
      if (t.assigneeId && counts[t.assigneeId]) {
        counts[t.assigneeId].total++;
        if (t.status === 'done') {
          counts[t.assigneeId].done++;
        }
      }
    });

    return Object.keys(counts).map(userId => {
      const p = profiles.find(profile => profile.id === userId);
      const name = p ? `${p.firstName} ${p.lastName}` : `User ${userId.substring(0, 4)}`;
      return {
        name,
        'Tổng task': counts[userId].total,
        'Đã hoàn thành': counts[userId].done,
      };
    }).sort((a, b) => b['Tổng task'] - a['Tổng task']); // Sắp xếp theo đóng góp nhiều nhất
  }, [tasks, group.members, profiles]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Biểu đồ tròn: Trạng thái công việc */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
        <h3 className="text-lg font-black text-slate-800 mb-6 self-start">Trạng thái công việc</h3>
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium h-[300px]">
            Chưa có công việc nào để thống kê
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} task`, 'Số lượng']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Biểu đồ cột ngang: Mức độ đóng góp */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
        <h3 className="text-lg font-black text-slate-800 mb-6">Mức độ đóng góp của thành viên</h3>
        {group.members?.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium h-[300px]">
            Nhóm chưa có thành viên
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={memberData}
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} iconType="circle" />
                <Bar dataKey="Tổng task" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="Đã hoàn thành" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
