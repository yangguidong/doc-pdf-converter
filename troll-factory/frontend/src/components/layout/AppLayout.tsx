import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import { useAuthStore } from '../../store/authStore'

export default function AppLayout() {
  const fetchUser = useAuthStore((s) => s.fetchUser)

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="text-center text-gray-500 text-xs py-4 border-t border-gray-800">
        整活工厂 · 一分钟造个游戏，坑完兄弟坑闺蜜 🎮
      </footer>
    </div>
  )
}
