import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { updateMe, changePassword } from '../api/auth';
import { formatDate } from '../utils/format';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMe({ username });
      refreshUser();
      toast('资料更新成功', 'success');
    } catch (err: any) {
      toast(err.response?.data?.detail || '更新失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      await changePassword({ old_password: oldPw, new_password: newPw });
      toast('密码修改成功', 'success');
      setOldPw('');
      setNewPw('');
    } catch (err: any) {
      toast(err.response?.data?.detail || '密码修改失败', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">基本信息</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">用户名</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">邮箱</label>
                <input value={user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-400" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">角色</label>
                <input value={user?.role === 'admin' ? '管理员' : '普通用户'} disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-400" />
              </div>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存修改'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">修改密码</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">原密码</label>
                <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required minLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">新密码</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button type="submit" disabled={changingPw} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {changingPw ? '修改中...' : '修改密码'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
            <h3 className="text-center font-semibold">{user?.username}</h3>
            <p className="text-center text-sm text-gray-500 mt-1">{user?.email}</p>

            <hr className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">积分</span>
                <span className="font-medium">{user?.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">已使用</span>
                <span className="font-medium">{user?.total_credits_used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">注册时间</span>
                <span className="font-medium">{formatDate(user?.created_at || null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">上次登录</span>
                <span className="font-medium">{formatDate(user?.last_login_at || null)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
