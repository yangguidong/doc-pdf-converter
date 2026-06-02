import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <span className="text-2xl">🎬</span>
              <span>AI视频生成</span>
            </Link>
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">工作台</Link>
                <Link to="/generate" className="text-sm text-gray-600 hover:text-gray-900">生成视频</Link>
                <Link to="/videos" className="text-sm text-gray-600 hover:text-gray-900">我的视频</Link>
                <Link to="/credits" className="text-sm text-gray-600 hover:text-gray-900">积分中心</Link>
                <Link to="/gallery" className="text-sm text-gray-600 hover:text-gray-900">作品广场</Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/credits" className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700 font-medium">
                  <span>💰</span>
                  <span>{user?.credits ?? 0}</span>
                </Link>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 text-sm hover:opacity-80">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-gray-700">{user?.username}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>个人中心</Link>
                      {isAdmin && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>管理后台</Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">退出登录</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">登录</Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">注册</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
