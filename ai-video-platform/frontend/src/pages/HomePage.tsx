import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLS45LTItMi0ySDI2Yy0xLjEgMC0yIC45LTIgMnYxMmMwIDEuMS45IDIgMiAyaDhjMS4xIDAgMi0uOSAyLTJWMTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            AI视频生成平台
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            接入全球领先AI视频模型，一句话生成专业级视频。
            支持Runway、Pika、Kling等多种模型，让创意即刻呈现。
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/generate" className="px-8 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium text-lg transition-colors">
                开始生成
              </Link>
            ) : (
              <>
                <Link to="/register" className="px-8 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium text-lg transition-colors">
                  免费注册
                </Link>
                <Link to="/login" className="px-8 py-3 border border-white/30 hover:bg-white/10 rounded-lg font-medium text-lg transition-colors">
                  登录
                </Link>
              </>
            )}
            <Link to="/gallery" className="px-8 py-3 border border-white/30 hover:bg-white/10 rounded-lg font-medium text-lg transition-colors">
              作品广场
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📝', title: '文生视频', desc: '输入文字描述，AI自动生成匹配的视频内容，支持多种风格和场景。' },
              { icon: '🖼️', title: '图生视频', desc: '上传静态图片，让AI将其转化为动态视频，赋予画面生命力。' },
              { icon: '⚡', title: '多模型切换', desc: '支持Runway、Pika、Kling等主流模型，根据需求选择最佳方案。' },
              { icon: '💰', title: '积分系统', desc: '灵活的积分消费模式，新用户注册即送免费积分体验。' },
              { icon: '📊', title: '进度追踪', desc: '实时查看视频生成进度，完成后即时通知，支持下载分享。' },
              { icon: '🔒', title: '安全可靠', desc: '完善的用户权限管理，保障您的数据和创作内容安全。' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">支持的AI模型</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {['Runway Gen-3', 'Pika 2.0', '可灵 Kling', 'SVD', '更多...'].map((m, i) => (
              <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 font-medium text-gray-700 hover:border-primary-300 transition-colors">
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
