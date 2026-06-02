import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublicGames } from '../api/games'
import type { GameListItem } from '../types/game'
import Spinner from '../components/common/Spinner'

const MODULE_NAMES: Record<string, string> = {
  avoidance: '🏃 躲避', clicker: '👆 点击', match3: '💎 三消', quiz: '❓ 问答',
}

export default function GalleryPage() {
  const [games, setGames] = useState<GameListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublicGames().then(setGames).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🕹️ 游戏大厅</h1>

      {games.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">👻</div>
          <h2 className="text-xl font-bold mb-2">还没有公开游戏</h2>
          <p className="text-gray-400 mb-6">成为第一个发布整蛊游戏的人！</p>
          <Link to="/editor" className="btn-primary">创建游戏</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {games.map((game) => (
            <Link
              key={game.id}
              to={`/play/${game.share_code}`}
              className="card hover:border-troll-accent/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{MODULE_NAMES[game.module_type]?.split(' ')[0] || '🎮'}</span>
                <div className="min-w-0">
                  <h3 className="font-bold truncate group-hover:text-troll-accent transition-colors">{game.title}</h3>
                  <p className="text-gray-400 text-xs">
                    {MODULE_NAMES[game.module_type]} · 已玩{game.play_count}次
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
