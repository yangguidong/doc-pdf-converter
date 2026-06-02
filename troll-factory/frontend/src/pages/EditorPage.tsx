import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEditorStore } from '../store/editorStore'
import { createGame, getGame, updateGame, publishGame } from '../api/games'
import type { ModuleType } from '../types/game'
import ModuleSelector from '../components/editor/ModuleSelector'
import ModuleParamsEditor from '../components/editor/ModuleParamsEditor'
import SkinPicker from '../components/editor/SkinPicker'
import GamePreview from '../components/editor/GamePreview'
import PublishPanel from '../components/editor/PublishPanel'

const STEPS = [
  { num: 1, title: '选择模组', emoji: '🎯' },
  { num: 2, title: '配置参数', emoji: '⚙️' },
  { num: 3, title: '预览发布', emoji: '🚀' },
]

export default function EditorPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const store = useEditorStore()
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
  }, [user, navigate])

  // If editing existing game, load it
  useEffect(() => {
    if (!gameId) return
    const id = parseInt(gameId)
    if (isNaN(id)) return
    getGame(id).then((game) => {
      store.setModuleType(game.module_type as ModuleType)
      store.setTitle(game.title)
      store.setDescription(game.description || '')
      try { store.setParams(JSON.parse(game.params_json)) } catch {}
      store.setPunishmentType(game.punishment_type)
      try { store.setPunishmentConfig(JSON.parse(game.punishment_config)) } catch {}
      store.setGameId(game.id)
      if (game.share_code) store.setShareCode(game.share_code)
    }).catch(() => setError('游戏不存在'))
  }, [gameId])

  // Pre-select module from URL query param
  useEffect(() => {
    const moduleParam = searchParams.get('module')
    if (moduleParam && ['avoidance', 'clicker', 'match3', 'quiz'].includes(moduleParam)) {
      store.setModuleType(moduleParam as ModuleType)
      store.setStep(1)
    }
  }, [searchParams])

  const handleSelectModule = (type: ModuleType) => {
    store.setModuleType(type)
    store.setStep(1)
  }

  const handleNext = async () => {
    if (store.step === 0 && !store.moduleType) {
      setError('请先选择一个游戏模组')
      return
    }
    if (store.step === 1) {
      if (!store.title.trim()) {
        setError('请输入游戏标题')
        return
      }
      // Save draft on step 2→3
      setSaving(true)
      try {
        const payload = store.getCreatePayload()
        if (store.gameId) {
          await updateGame(store.gameId, payload)
        } else {
          const game = await createGame(payload)
          store.setGameId(game.id)
          store.setShareCode(game.share_code)
        }
      } catch (e: any) {
        setError(e.response?.data?.detail || '保存失败')
        setSaving(false)
        return
      }
      setSaving(false)
    }
    setError('')
    store.setStep(store.step + 1)
  }

  const handleBack = () => {
    setError('')
    store.setStep(store.step - 1)
  }

  const handlePublish = async () => {
    if (!store.gameId) return
    setPublishing(true)
    setError('')
    try {
      const game = await publishGame(store.gameId)
      store.setShareCode(game.share_code)
    } catch (e: any) {
      setError(e.response?.data?.detail || '发布失败')
    }
    setPublishing(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">🧪 整蛊游戏编辑器</h1>

      {/* Step indicator */}
      <div className="flex justify-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
              store.step >= i ? 'bg-troll-accent/20 text-troll-accent' : 'bg-gray-800 text-gray-500'
            }`}>
              <span>{s.emoji}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${store.step > i ? 'bg-troll-accent' : 'bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
      )}

      {/* Step 0: Module Selection */}
      {store.step === 0 && (
        <ModuleSelector selected={store.moduleType} onSelect={handleSelectModule} />
      )}

      {/* Step 1: Params + Skin */}
      {store.step === 1 && store.moduleType && (
        <div className="space-y-6">
          <ModuleParamsEditor
            moduleType={store.moduleType}
            params={store.params}
            title={store.title}
            description={store.description}
            onChange={store.setParams}
            onTitleChange={store.setTitle}
            onDescriptionChange={store.setDescription}
          />
          <div className="border-t border-gray-700 pt-4">
            <SkinPicker selected={store.skin} onSelect={store.setSkin} />
          </div>
        </div>
      )}

      {/* Step 2: Preview + Publish */}
      {store.step === 2 && (
        <div className="space-y-6">
          <GamePreview shareCode={store.shareCode} />
          <PublishPanel
            shareCode={store.shareCode}
            onPublish={handlePublish}
            publishing={publishing}
          />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={store.step === 0 ? () => navigate('/dashboard') : handleBack}
          className="btn-secondary text-sm"
        >
          {store.step === 0 ? '取消' : '← 上一步'}
        </button>
        {store.step < 2 && (
          <button onClick={handleNext} disabled={saving} className="btn-primary text-sm">
            {saving ? '保存中...' : '下一步 →'}
          </button>
        )}
      </div>
    </div>
  )
}
