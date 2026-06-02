import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
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
      const res = await login({ email, password })
      localStorage.setItem('troll_token', res.access_token)
      await fetchUser()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card">
        <h1 className="text-2xl font-bold text-center mb-6">登录整活工厂</h1>
        {error && <div className="bg-red-500/20 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">邮箱</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">密码</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="输入密码" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-4">
          还没有账号？<Link to="/register" className="text-troll-accent hover:underline">立即注册</Link>
        </p>
      </div>
    </div>
  )
}
