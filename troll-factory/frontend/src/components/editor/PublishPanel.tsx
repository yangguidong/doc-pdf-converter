import { useState } from 'react'

interface Props {
  shareCode: string | null
  onPublish: () => Promise<void>
  publishing: boolean
}

export default function PublishPanel({ shareCode, onPublish, publishing }: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl = shareCode ? `${window.location.origin}/p/${shareCode}` : ''

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {!shareCode ? (
        <div className="card text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="font-bold text-lg mb-2">一切就绪！</h3>
          <p className="text-gray-400 text-sm mb-4">发布后生成分享链接，发给你要整蛊的朋友</p>
          <button onClick={onPublish} disabled={publishing} className="btn-primary">
            {publishing ? '发布中...' : '🎯 发布游戏'}
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-bold text-lg text-green-400">发布成功！</h3>
            <p className="text-gray-400 text-sm">复制链接发给朋友，TA点开即玩</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl p-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-300 px-2 outline-none"
            />
            <button onClick={handleCopy} className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
              {copied ? '已复制 ✅' : '📋 复制链接'}
            </button>
          </div>
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">直接发给微信/QQ好友，对方无需下载即可游玩</p>
          </div>
        </div>
      )}
    </div>
  )
}
