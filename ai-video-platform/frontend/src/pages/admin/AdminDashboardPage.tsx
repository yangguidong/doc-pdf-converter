import { useEffect, useState } from 'react';
import { getDashboard, getDailyStats } from '../../api/admin';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);

  useEffect(() => {
    getDashboard().then(setStats);
    getDailyStats(30).then(setDailyStats);
  }, []);

  if (!stats) return <div className="text-gray-500">加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理概览</h1>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: '总用户', value: stats.total_users, icon: '👥', color: 'from-blue-400 to-blue-600' },
          { label: '总视频', value: stats.total_videos, icon: '🎬', color: 'from-green-400 to-green-600' },
          { label: '今日视频', value: stats.today_videos, icon: '📹', color: 'from-purple-400 to-purple-600' },
          { label: '今日活跃', value: stats.active_today, icon: '🔥', color: 'from-orange-400 to-orange-600' },
          { label: '积分消耗', value: stats.total_credits_used, icon: '💰', color: 'from-red-400 to-red-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} text-white rounded-xl p-5`}>
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
            <div className="text-sm opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">最近30天数据</h2>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">日期</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">新增用户</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">新增视频</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((d, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="px-4 py-2">{d.date}</td>
                  <td className="px-4 py-2 text-right">{d.new_users}</td>
                  <td className="px-4 py-2 text-right">{d.new_videos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
