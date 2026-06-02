import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'
import GalleryPage from './pages/GalleryPage'
import PlayPage from './pages/PlayPage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:gameId" element={<EditorPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/play/:shareCode" element={<PlayPage />} />
        <Route path="/leaderboard/:shareCode" element={<LeaderboardPage />} />
      </Route>
    </Routes>
  )
}
