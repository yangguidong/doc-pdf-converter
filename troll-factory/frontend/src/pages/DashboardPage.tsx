import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listMyGames, deleteGame } from '../api/games'
import type { GameListItem } from '../types/game'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/common/Spinner'

const MODULE_NAMES: Record<string, string> = {
  avoidance: '🏃 躲避', clicker: '👆 点击', match3: '💎 三消', quiz: '❓ 问答',
}

export default function DashboardPage() {
  const [games, setGames] = useState<GameListItem[]>([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    listMyGames().then(setGames).finally(() => setLoading(false))
  }, [user, navigate])

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除这个游戏？')) return
    await deleteGame(id)
    setGames(games.filter((g) => g.id !== id))
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的整蛊游戏</h1>
        <Link to="/editor" className="btn-primary text-sm">+ 创建新游戏</Link>
      </div>

      {games.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-xl font-bold mb-2">还没有游戏</h2>
          <p className="text-gray-400 mb-6">快来创建你的第一个整蛊游戏吧！</p>
          <Link to="/editor" className="btn-primary">开始创建</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div key={game.id} className="card flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{MODULE_NAMES[game.module_type]?.split(' ')[0] || '🎮'}</span>
                <div>
                  <h3 className="font-bold">{game.title}</h3>
                  <p className="text-gray-400 text-xs">
                    {MODULE_NAMES[game.module_type]} · 游玩{game.play_count}次
                    {game.is_published ? ' · ✅ 已发布' : ' · 📝 草稿'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {game.is_published && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${game.share_code}`); alert('链接已复制！') }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    复制链接
                  </button>
                )}
                <Link to={`/editor/${game.id}`} className="btn-secondary text-xs py-1.5 px-3">编辑</Link>
                <button onClick={() => handleDelete(game.id)} className="text-red-400 hover:text-red-300 text-xs py-1.5 px-3">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
