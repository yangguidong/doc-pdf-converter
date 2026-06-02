import { useEffect, useState } from 'react';
import { getAdminModels, updateModelConfig } from '../../api/admin';
import { useToast } from '../../components/common/Toast';
import type { ModelConfig } from '../../types/model';

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getAdminModels()
      .then(setModels)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (model: ModelConfig) => {
    try {
      const updated = await updateModelConfig(model.id, { is_enabled: !model.is_enabled });
      setModels((prev) => prev.map((m) => (m.id === model.id ? updated : m)));
      toast('更新成功', 'success');
    } catch {
      toast('更新失败', 'error');
    }
  };

  const handleUpdateCost = async (model: ModelConfig) => {
    const newCost = prompt('设置每次生成消耗积分:', String(model.credits_per_generation));
    if (!newCost) return;
    try {
      const updated = await updateModelConfig(model.id, { credits_per_generation: parseInt(newCost) });
      setModels((prev) => prev.map((m) => (m.id === model.id ? updated : m)));
      toast('积分更新成功', 'success');
    } catch {
      toast('更新失败', 'error');
    }
  };

  if (loading) return <div className="text-gray-500">加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">模型配置</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">模型标识</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">显示名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">提供商</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">支持类型</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">积分消耗</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{m.model_key}</td>
                <td className="px-4 py-3 font-medium">{m.display_name}</td>
                <td className="px-4 py-3 text-gray-500">{m.provider}</td>
                <td className="px-4 py-3 text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {m.supported_types.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{t === 'text_to_video' ? '文生视频' : t === 'image_to_video' ? '图生视频' : '视频编辑'}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{m.credits_per_generation}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {m.is_enabled ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleUpdateCost(m)} className="text-xs text-primary-600 hover:underline mr-2">积分</button>
                  <button onClick={() => handleToggle(m)} className={`text-xs ${m.is_enabled ? 'text-red-600' : 'text-green-600'} hover:underline`}>
                    {m.is_enabled ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
