import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicVideos } from '../api/videos';
import type { Video } from '../types/video';
import { formatDate } from '../utils/format';

export default function GalleryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPublicVideos({ page, per_page: 12 })
      .then((res) => setVideos(res.items))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">作品广场</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-gray-500">暂无公开作品</p>
          <Link to="/generate" className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">成为第一个创作者</Link>
        </div>
      ) : (
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
                <div className="text-xs text-gray-400">{formatDate(v.created_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
