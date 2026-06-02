import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="bg-troll-card/90 backdrop-blur border-b border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🏭</span>
          <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            整活工厂
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/gallery" className="text-gray-300 hover:text-white transition-colors">
            游戏大厅
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                我的游戏
              </Link>
              <Link to="/editor" className="btn-primary text-sm py-1.5 px-4">
                + 创建游戏
              </Link>
              <span className="text-gray-400 ml-2">{user.username}</span>
              <button onClick={() => { logout(); navigate('/') }} className="text-gray-400 hover:text-white text-xs">
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                登录
              </Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-4">
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
