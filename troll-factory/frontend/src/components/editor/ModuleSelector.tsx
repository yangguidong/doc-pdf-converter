import type { ModuleType } from '../../types/game'

const MODULES: { type: ModuleType; emoji: string; name: string; desc: string; color: string }[] = [
  { type: 'avoidance', emoji: '🏃', name: '躲避游戏', desc: '左右横跳躲避障碍物，坚持到时间结束就赢！适合做"躲避甲方需求"、"绕开同事甩锅"', color: 'from-blue-500 to-cyan-500' },
  { type: 'clicker', emoji: '👆', name: '点击爆发', desc: '疯狂点击出现的靶子，达到目标分数！适合做"戳破大饼"、"暴打柠檬茶"', color: 'from-red-500 to-pink-500' },
  { type: 'match3', emoji: '💎', name: '三消游戏', desc: '交换相邻方块，三个连成一线消除！适合做"消除恋爱脑"、"消除周一"', color: 'from-purple-500 to-indigo-500' },
  { type: 'quiz', emoji: '❓', name: '问答游戏', desc: '限时选择题，答对N题通关！适合做"室友灵魂拷问"、"社死问答"', color: 'from-green-500 to-teal-500' },
]

interface Props {
  selected: ModuleType | null
  onSelect: (type: ModuleType) => void
}

export default function ModuleSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">选择游戏模组</h2>
      <p className="text-gray-400 text-sm mb-4">选择一种核心玩法，这是你的整蛊游戏的基础逻辑</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODULES.map((m) => (
          <button
            key={m.type}
            onClick={() => onSelect(m.type)}
            className={`card text-left transition-all duration-200 hover:border-troll-accent/50 ${
              selected === m.type ? 'border-troll-accent ring-1 ring-troll-accent bg-troll-accent/5' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-xl flex-shrink-0`}>
                {m.emoji}
              </div>
              <div>
                <h3 className="font-bold">{m.name}</h3>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{m.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
