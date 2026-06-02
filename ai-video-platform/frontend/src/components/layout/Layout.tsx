import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>AI视频生成平台 &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">支持多模型接入，一键生成高质量AI视频</p>
        </div>
      </footer>
    </div>
  );
}
