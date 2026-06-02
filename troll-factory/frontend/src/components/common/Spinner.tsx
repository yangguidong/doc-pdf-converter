export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <div className="w-10 h-10 border-4 border-gray-600 border-t-troll-accent rounded-full animate-spin" />
    </div>
  )
}
