interface Props {
  shareCode: string | null
}

export default function GamePreview({ shareCode }: Props) {
  if (!shareCode) {
    return (
      <div className="card text-center py-8">
        <div className="text-4xl mb-3">👀</div>
        <p className="text-gray-400 text-sm">发布游戏后可以在这里预览</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-bold mb-2">游戏预览</h3>
      <div className="bg-black rounded-xl overflow-hidden border border-gray-700" style={{ height: 500 }}>
        <iframe src={`/p/${shareCode}`} className="w-full h-full border-0" title="游戏预览" />
      </div>
    </div>
  )
}
