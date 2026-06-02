import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin', label: '概览', icon: '📊' },
  { path: '/admin/users', label: '用户管理', icon: '👥' },
  { path: '/admin/videos', label: '视频管理', icon: '🎬' },
  { path: '/admin/models', label: '模型配置', icon: '⚙️' },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-60 bg-gray-900 text-white flex-shrink-0">
        <div className="p-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>🛡️</span> 管理后台
          </h2>
        </div>
        <nav className="px-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}
