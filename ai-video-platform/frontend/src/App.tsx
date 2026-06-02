import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GeneratePage from './pages/GeneratePage';
import VideoLibraryPage from './pages/VideoLibraryPage';
import VideoDetailPage from './pages/VideoDetailPage';
import GalleryPage from './pages/GalleryPage';
import CreditsPage from './pages/CreditsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminVideosPage from './pages/admin/AdminVideosPage';
import AdminModelsPage from './pages/admin/AdminModelsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/generate" element={<ProtectedRoute><GeneratePage /></ProtectedRoute>} />
        <Route path="/videos" element={<ProtectedRoute><VideoLibraryPage /></ProtectedRoute>} />
        <Route path="/videos/:id" element={<ProtectedRoute><VideoDetailPage /></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><CreditsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="videos" element={<AdminVideosPage />} />
          <Route path="models" element={<AdminModelsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
