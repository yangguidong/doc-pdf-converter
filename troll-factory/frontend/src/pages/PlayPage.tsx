import { useParams } from 'react-router-dom'

export default function PlayPage() {
  const { shareCode } = useParams<{ shareCode: string }>()

  return (
    <div className="w-full h-[calc(100vh-3.5rem)]">
      <iframe
        src={`/p/${shareCode}`}
        className="w-full h-full border-0"
        title="整活工厂游戏"
        allow="autoplay"
      />
    </div>
  )
}
