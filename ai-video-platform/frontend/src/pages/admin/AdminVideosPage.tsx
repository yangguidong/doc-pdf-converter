import { useEffect, useState } from 'react';
import { listAllVideos, adminDeleteVideo } from '../../api/admin';
import { useToast } from '../../components/common/Toast';
import type { Video } from '../../types/video';
import { formatDate, statusLabel } from '../../utils/format';

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    listAllVideos({ page, per_page: 20, status: statusFilter || undefined })
      .then(setVideos)
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const handleDelete = async (video: Video) => {
    if (!confirm('确定删除这个视频吗？此操作不可逆。')) return;
    try {
      await adminDeleteVideo(video.id);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
      toast('视频已删除', 'success');
    } catch {
      toast('删除失败', 'error');
    }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">视频管理</h1>

      <div className="flex gap-3 mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">全部状态</option>
          <option value="completed">已完成</option>
          <option value="processing">生成中</option>
          <option value="pending">等待中</option>
          <option value="failed">失败</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">标题</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">用户ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">模型</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">消耗</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">时间</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{v.id}</td>
                  <td className="px-4 py-3 max-w-48 truncate">{v.title || v.prompt}</td>
                  <td className="px-4 py-3">{v.user_id}</td>
                  <td className="px-4 py-3 text-gray-500">{v.model_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(v.status)}`}>{statusLabel(v.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{v.credits_cost}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(v.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(v)} className="text-xs text-red-600 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
