import type { ModuleType } from '../../types/game'

interface Props {
  moduleType: ModuleType
  params: Record<string, any>
  title: string
  description: string
  onChange: (params: Record<string, any>) => void
  onTitleChange: (title: string) => void
  onDescriptionChange: (desc: string) => void
}

export default function ModuleParamsEditor({ moduleType, params, title, description, onChange, onTitleChange, onDescriptionChange }: Props) {
  const update = (key: string, value: any) => {
    onChange({ ...params, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">游戏标题 *</label>
        <input
          type="text"
          className="input-field"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="如：整蛊小李的答辩躲避大战"
          maxLength={100}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">游戏描述</label>
        <input
          type="text"
          className="input-field"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="简单描述一下这个游戏..."
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">难度</label>
          <select className="input-field" value={params.difficulty || 'normal'} onChange={(e) => update('difficulty', e.target.value)}>
            <option value="easy">简单 😊</option>
            <option value="normal">普通 😐</option>
            <option value="hard">困难 💀</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">游戏时长 (秒)</label>
          <input type="number" className="input-field" value={params.duration || 30} onChange={(e) => update('duration', parseInt(e.target.value) || 30)} min={10} max={120} />
        </div>
      </div>

      {moduleType === 'avoidance' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">玩家速度</label>
              <input type="range" min={1} max={5} value={params.playerSpeed || 3} onChange={(e) => update('playerSpeed', parseInt(e.target.value))} className="w-full" />
              <div className="text-xs text-gray-500 text-right">{params.playerSpeed || 3} / 5</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">障碍生成速度</label>
              <input type="range" min={1} max={5} value={params.spawnRate || 2} onChange={(e) => update('spawnRate', parseInt(e.target.value))} className="w-full" />
              <div className="text-xs text-gray-500 text-right">{params.spawnRate || 2} / 5</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">障碍类型</label>
            <div className="flex flex-wrap gap-2">
              {['poop', 'water', 'smoke', 'rock'].map((type) => (
                <label key={type} className="flex items-center gap-1 bg-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={(params.obstacleTypes || ['poop']).includes(type)}
                    onChange={(e) => {
                      const current = params.obstacleTypes || ['poop']
                      const next = e.target.checked ? [...current, type] : current.filter((t: string) => t !== type)
                      update('obstacleTypes', next.length ? next : ['poop'])
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {{ poop: '💩 答辩', water: '💧 水流', smoke: '💨 烟雾', rock: '🪨 石头' }[type]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {moduleType === 'clicker' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">目标分数</label>
            <input type="number" className="input-field" value={params.targetScore || 100} onChange={(e) => update('targetScore', parseInt(e.target.value) || 100)} min={20} max={500} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">同时出现靶子数</label>
            <select className="input-field" value={params.clickZones || 1} onChange={(e) => update('clickZones', parseInt(e.target.value))}>
              <option value={1}>1个</option>
              <option value={2}>2个</option>
              <option value={3}>3个</option>
              <option value={4}>4个</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.speedRamp || false} onChange={(e) => update('speedRamp', e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-300">加速模式（时间越少靶子出现越快）</span>
            </label>
          </div>
        </div>
      )}

      {moduleType === 'match3' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">棋盘大小</label>
            <select className="input-field" value={params.boardSize || 6} onChange={(e) => update('boardSize', parseInt(e.target.value))}>
              <option value={4}>4x4</option>
              <option value={5}>5x5</option>
              <option value={6}>6x6</option>
              <option value={8}>8x8</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">方块种类</label>
            <select className="input-field" value={params.pieceTypes || 4} onChange={(e) => update('pieceTypes', parseInt(e.target.value))}>
              <option value={3}>3种 (简单)</option>
              <option value={4}>4种 (普通)</option>
              <option value={5}>5种 (困难)</option>
              <option value={6}>6种 (地狱)</option>
            </select>
          </div>
        </div>
      )}

      {moduleType === 'quiz' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">题目数量</label>
            <input type="number" className="input-field" value={params.questionCount || 10} onChange={(e) => update('questionCount', parseInt(e.target.value) || 10)} min={3} max={30} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">每题时间 (秒)</label>
            <input type="number" className="input-field" value={params.timePerQuestion || 10} onChange={(e) => update('timePerQuestion', parseInt(e.target.value) || 10)} min={3} max={30} />
          </div>
        </div>
      )}
    </div>
  )
}
