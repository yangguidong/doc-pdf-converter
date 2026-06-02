import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listVideos } from '../api/videos';
import type { Video } from '../types/video';
import { formatDate, statusLabel } from '../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0 });

  useEffect(() => {
    listVideos({ page: 1, per_page: 6 }).then((res) => {
      setRecentVideos(res.items);
    });
    listVideos({ page: 1, per_page: 100 }).then((res) => {
      const completed = res.items.filter((v) => v.status === 'completed').length;
      const failed = res.items.filter((v) => v.status === 'failed').length;
      setStats({ total: res.total, completed, failed });
    });
  }, []);

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">欢迎回来，{user?.username}</h1>
        <p className="text-gray-500 mt-1">这是你的AI视频生成工作台</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '总生成数', value: stats.total, icon: '🎬' },
          { label: '已完成', value: stats.completed, icon: '✅' },
          { label: '可用积分', value: user?.credits ?? 0, icon: '💰' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">最近视频</h2>
        <Link to="/videos" className="text-sm text-primary-600 hover:underline">查看全部</Link>
      </div>

      {recentVideos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🎥</div>
          <p className="text-gray-500 mb-4">还没有生成任何视频</p>
          <Link to="/generate" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
            开始生成第一个视频
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {recentVideos.map((v) => (
            <Link key={v.id} to={`/videos/${v.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {v.output_thumbnail_path ? (
                  <img src={`/files/${v.output_thumbnail_path}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🎬</span>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium text-sm truncate">{v.title || v.prompt}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(v.status)}`}>{statusLabel(v.status)}</span>
                  <span className="text-xs text-gray-400">{formatDate(v.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
