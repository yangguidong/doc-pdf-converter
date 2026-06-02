import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import client from '../api/client'
import type { PlayRecord } from '../types/game'
import Spinner from '../components/common/Spinner'

export default function LeaderboardPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const [records, setRecords] = useState<PlayRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shareCode) return
    client.get(`/share/${shareCode}/leaderboard`)
      .then((res) => setRecords(res.data))
      .finally(() => setLoading(false))
  }, [shareCode])

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🏆 排行榜</h1>
      {records.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">👻</div>
          <p className="text-gray-400">还没有人玩过这个游戏</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r, i) => (
            <div key={r.id} className={`card flex items-center justify-between ${i === 0 ? 'border-troll-gold/30 bg-troll-gold/5' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold w-8 ${i < 3 ? ['text-yellow-400', 'text-gray-300', 'text-orange-400'][i] : 'text-gray-500'}`}>
                  #{i + 1}
                </span>
                <div>
                  <span className="font-medium">{r.player_name}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${r.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {r.result === 'win' ? '通关' : '失败'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg">{r.score}</span>
                <span className="text-gray-400 text-xs ml-1">分</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
