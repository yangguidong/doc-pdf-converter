import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { getModels } from '../api/models';
import { generateVideo, getVideoStatus } from '../api/videos';
import type { ModelConfig } from '../types/model';
import type { Video } from '../types/video';

export default function GeneratePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [genType, setGenType] = useState('text_to_video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('720p');
  const [isPublic, setIsPublic] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval>>();
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  const selectedModelConfig = models.find((m) => m.model_key === selectedModel);
  const cost = selectedModelConfig?.credits_per_generation ?? 0;

  useEffect(() => {
    getModels().then(setModels).catch(() => toast('加载模型列表失败', 'error'));
  }, []);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) setSelectedModel(models[0].model_key);
  }, [models, selectedModel]);

  const startPolling = useCallback((videoId: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await getVideoStatus(videoId);
        setProgress(status.progress);
        if (status.status === 'completed') {
          clearInterval(pollingRef.current);
          setGenerating(false);
          setStatusText('生成完成！');
          refreshUser();
          toast('视频生成成功！', 'success');
          setTimeout(() => navigate(`/videos/${videoId}`), 1500);
        } else if (status.status === 'failed') {
          clearInterval(pollingRef.current);
          setGenerating(false);
          setStatusText(`失败: ${status.error_message || '未知错误'}`);
          toast('视频生成失败，积分已退还', 'error');
          refreshUser();
        } else {
          setStatusText('正在生成中...');
        }
      } catch {
        clearInterval(pollingRef.current);
        setGenerating(false);
        setStatusText('状态查询异常');
      }
    }, 2000);
  }, [navigate, refreshUser, toast]);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast('请输入提示词', 'error'); return; }
    if (!selectedModel) { toast('请选择一个模型', 'error'); return; }
    if (cost > (user?.credits ?? 0)) { toast('积分不足', 'error'); return; }

    setGenerating(true);
    setProgress(0);
    setStatusText('提交生成任务...');

    try {
      const video = await generateVideo({
        model_key: selectedModel,
        generation_type: genType,
        prompt: prompt.trim(),
        duration,
        resolution,
        is_public: isPublic,
      });
      setTaskId(video.id);
      startPolling(video.id);
    } catch (err: any) {
      setGenerating(false);
      toast(err.response?.data?.detail || '生成请求失败', 'error');
      refreshUser();
    }
  };

  const genTypes = [
    { key: 'text_to_video', label: '📝 文生视频' },
    { key: 'image_to_video', label: '🖼️ 图生视频' },
    { key: 'video_edit', label: '✂️ 视频编辑' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">生成AI视频</h1>

      {generating && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-primary-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full" />
            <span className="font-medium">{statusText || '处理中...'}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-2">{progress}%</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">选择模型</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {models.map((m) => (
                <button
                  key={m.model_key}
                  onClick={() => setSelectedModel(m.model_key)}
                  disabled={generating}
                  className={`p-3 rounded-lg border-2 text-center text-sm transition-all ${
                    selectedModel === m.model_key
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{m.display_name}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.credits_per_generation} 积分</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">生成类型</h2>
            <div className="flex gap-3">
              {genTypes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setGenType(t.key)}
                  disabled={generating}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    genType === t.key ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {(genType === 'image_to_video' || genType === 'video_edit') && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">上传源文件</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept={genType === 'image_to_video' ? 'image/*' : 'video/*'}
                  onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                {sourceFile && <p className="mt-2 text-sm text-green-600">已选择: {sourceFile.name}</p>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">提示词</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              placeholder="描述你想要生成的视频内容，例如：一只猫在霓虹灯闪烁的东京街头漫步，电影质感..."
            />
            <p className="text-xs text-gray-400 mt-1">{prompt.length}/2000</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="font-semibold mb-4">生成设置</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">时长（秒）</label>
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={generating} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  {[3, 4, 5, 8, 10].map((d) => <option key={d} value={d}>{d}秒</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">分辨率</label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={generating} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} disabled={generating} className="rounded" />
                公开到作品广场
              </label>
            </div>

            <hr className="my-4" />

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-600">预估消耗</span>
              <span className="font-bold text-primary-600">{cost} 积分</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-600">当前积分</span>
              <span className={user && user.credits < cost ? 'text-red-500 font-medium' : ''}>{user?.credits ?? 0}</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || !selectedModel}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? '生成中...' : '🚀 开始生成'}
            </button>

            {user && user.credits < cost && (
              <p className="text-red-500 text-xs mt-2 text-center">
                积分不足，请前往<button onClick={() => navigate('/credits')} className="text-primary-600 hover:underline ml-1">积分中心</button>获取更多积分
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
