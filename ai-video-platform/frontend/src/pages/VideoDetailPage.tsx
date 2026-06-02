import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getVideo, deleteVideo, getVideoDownloadUrl } from '../api/videos';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import type { Video } from '../types/video';
import { formatDate, formatFileSize, formatDuration, statusLabel } from '../utils/format';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getVideo(parseInt(id))
        .then(setVideo)
        .catch(() => navigate('/videos'))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!video || !confirm('确定删除这个视频吗？')) return;
    try {
      await deleteVideo(video.id);
      toast('视频已删除', 'success');
      navigate('/videos');
    } catch {
      toast('删除失败', 'error');
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">加载中...</div>;
  if (!video) return null;

  const isOwner = user?.id === video.user_id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/videos" className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; 返回视频列表</Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            {video.status === 'completed' && video.output_video_path ? (
              <video controls className="w-full h-full" src={getVideoDownloadUrl(video.id)} />
            ) : video.status === 'processing' ? (
              <div className="text-center text-white">
                <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-lg">生成中 {video.progress}%</p>
              </div>
            ) : video.status === 'failed' ? (
              <div className="text-center text-red-400">
                <p className="text-lg">生成失败</p>
                <p className="text-sm mt-2">{video.error_message}</p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-lg">等待生成...</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="font-semibold text-lg mb-4">{video.title || '未命名视频'}</h1>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">状态</span><span>{statusLabel(video.status)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">模型</span><span>{video.model_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">类型</span><span>{video.generation_type === 'text_to_video' ? '文生视频' : video.generation_type === 'image_to_video' ? '图生视频' : '视频编辑'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">分辨率</span><span>{video.resolution || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">时长</span><span>{formatDuration(video.duration_seconds)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">大小</span><span>{formatFileSize(video.file_size_bytes)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">积分消耗</span><span>{video.credits_cost}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">创建时间</span><span>{formatDate(video.created_at)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-2">提示词</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{video.prompt}</p>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              {video.status === 'completed' && (
                <a href={getVideoDownloadUrl(video.id)} className="flex-1 text-center py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                  下载视频
                </a>
              )}
              <button onClick={handleDelete} className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                删除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
