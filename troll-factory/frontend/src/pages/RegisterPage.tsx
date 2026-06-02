import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const fetchUser = useAuthStore((s) => s.fetchUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register({ username, email, password })
      localStorage.setItem('troll_token', res.access_token)
      await fetchUser()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card">
        <h1 className="text-2xl font-bold text-center mb-2">加入整活工厂</h1>
        <p className="text-center text-gray-400 text-sm mb-6">开始你的整蛊之旅</p>
        {error && <div className="bg-red-500/20 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">用户名</label>
            <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="你的昵称" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">邮箱</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">密码</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="至少6位密码" minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '注册中...' : '立即注册'}
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-4">
          已有账号？<Link to="/login" className="text-troll-accent hover:underline">登录</Link>
        </p>
      </div>
    </div>
  )
}
