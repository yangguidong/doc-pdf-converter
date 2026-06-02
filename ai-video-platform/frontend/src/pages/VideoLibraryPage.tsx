import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVideos } from '../api/videos';
import type { Video } from '../types/video';
import { formatDate, statusLabel } from '../utils/format';

export default function VideoLibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listVideos({ page, per_page: 12, status: statusFilter || undefined, generation_type: typeFilter || undefined })
      .then((res) => { setVideos(res.items); setTotal(res.total); })
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter]);

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
    };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">我的视频</h1>
        <Link to="/generate" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">生成新视频</Link>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">全部状态</option>
          <option value="completed">已完成</option>
          <option value="processing">生成中</option>
          <option value="pending">等待中</option>
          <option value="failed">失败</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">全部类型</option>
          <option value="text_to_video">文生视频</option>
          <option value="image_to_video">图生视频</option>
          <option value="video_edit">视频编辑</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-4">📹</div>
          <p className="text-gray-500">暂无视频</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((v) => (
              <Link key={v.id} to={`/videos/${v.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {v.output_thumbnail_path ? (
                    <img src={`/files/${v.output_thumbnail_path}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎬</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate">{v.title || v.prompt}</div>
                  <div className="text-xs text-gray-400 mt-1">{v.model_name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(v.status)}`}>{statusLabel(v.status)}</span>
                    <span className="text-xs text-gray-400">{formatDate(v.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {total > 12 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
              <span className="text-sm text-gray-500">第 {page} 页</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 12 >= total} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
