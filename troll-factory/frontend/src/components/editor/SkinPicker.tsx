import { useEffect, useState } from 'react'
import { listSkins } from '../../api/games'
import type { GameSkin } from '../../types/game'

interface Props {
  selected: GameSkin | null
  onSelect: (skin: GameSkin) => void
}

const SKIN_EMOJIS: Record<string, string> = {
  default: '🎨', poop: '💩', office: '💼', ghost: '👻',
}

export default function SkinPicker({ selected, onSelect }: Props) {
  const [skins, setSkins] = useState<GameSkin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSkins().then(setSkins).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-4 text-gray-400 text-sm">加载皮肤中...</div>
  }

  return (
    <div>
      <h3 className="font-bold mb-2">选择皮肤主题</h3>
      <p className="text-gray-400 text-sm mb-3">给游戏穿上不同的"皮"</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {skins.map((skin) => (
          <button
            key={skin.id}
            onClick={() => onSelect(skin)}
            className={`flex-shrink-0 w-28 p-3 rounded-xl border-2 transition-all duration-200 text-center ${
              selected?.id === skin.id
                ? 'border-troll-accent bg-troll-accent/5'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
            }`}
          >
            <div className="text-3xl mb-1">{SKIN_EMOJIS[skin.slug] || '🎨'}</div>
            <div className="text-sm font-medium">{skin.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{skin.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
