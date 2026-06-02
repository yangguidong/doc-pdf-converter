import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const MODULES = [
  { type: 'avoidance', emoji: '🏃', name: '躲避', desc: '左右横跳躲避障碍，是男人就坚持30秒！', color: 'from-blue-500 to-cyan-500' },
  { type: 'clicker', emoji: '👆', name: '点击爆发', desc: '疯狂点击屏幕，戳破老板画的大饼！', color: 'from-red-500 to-pink-500' },
  { type: 'match3', emoji: '💎', name: '三消', desc: '消除恋爱脑、消除周一、消除加班！', color: 'from-purple-500 to-indigo-500' },
  { type: 'quiz', emoji: '❓', name: '问答', desc: '灵魂拷问，答错就社死！', color: 'from-green-500 to-teal-500' },
]

export default function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center py-8 md:py-16">
        <h1 className="text-4xl md:text-6xl font-black mb-4">
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            整活工厂
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-2">
          🎮 一分钟造个游戏，坑完兄弟坑闺蜜
        </p>
        <p className="text-gray-500 mb-8 text-sm md:text-base">
          选择模组→换皮→配恶搞→生成链接分享→朋友打开即玩→不服反坑
        </p>
        <div className="flex gap-4 justify-center">
          <Link to={user ? '/editor' : '/register'} className="btn-primary text-lg px-8 py-4">
            🚀 开始整活
          </Link>
          <Link to="/gallery" className="btn-secondary text-lg px-8 py-4">
            🕹️ 逛游戏大厅
          </Link>
        </div>
      </div>

      {/* Module show */}
      <h2 className="text-2xl font-bold text-center mb-6">四种游戏模组，任你组合</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {MODULES.map((m) => (
          <Link
            key={m.type}
            to={user ? `/editor?module=${m.type}` : '/register'}
            className="card hover:border-troll-accent/50 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                {m.emoji}
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-troll-accent transition-colors">{m.name}</h3>
                <p className="text-gray-400 text-sm">{m.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Steps */}
      <h2 className="text-2xl font-bold text-center mb-6">三步完成整蛊</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { step: '1', emoji: '🎯', title: '选模组', desc: '从四种玩法中选一个，配置难度和参数' },
          { step: '2', emoji: '🎨', title: '换皮肤', desc: '套上答辩、打工人、幽灵等热梗皮肤' },
          { step: '3', emoji: '📤', title: '分享坑人', desc: '生成链接发给朋友，看TA被整蛊' },
        ].map((s) => (
          <div key={s.step} className="card text-center">
            <div className="text-4xl mb-3">{s.emoji}</div>
            <div className="text-sm text-troll-accent font-bold mb-1">STEP {s.step}</div>
            <h3 className="font-bold text-lg mb-1">{s.title}</h3>
            <p className="text-gray-400 text-sm">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
