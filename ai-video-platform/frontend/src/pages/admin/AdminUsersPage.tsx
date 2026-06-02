import { useEffect, useState } from 'react';
import { listUsers, updateUser } from '../../api/admin';
import { useToast } from '../../components/common/Toast';
import type { User } from '../../types/user';
import { formatDate } from '../../utils/format';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    listUsers({ page, per_page: 20, search: search || undefined, role: roleFilter || undefined })
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
      toast('操作成功', 'success');
    } catch {
      toast('操作失败', 'error');
    }
  };

  const handleUpdateCredits = async (user: User) => {
    const newCredits = prompt('设置新积分数量:', String(user.credits));
    if (!newCredits) return;
    try {
      const updated = await updateUser(user.id, { credits: parseInt(newCredits) });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast('积分更新成功', 'success');
    } catch {
      toast('操作失败', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索用户名或邮箱..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none w-64" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">全部角色</option>
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">用户名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">邮箱</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">角色</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">积分</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">注册时间</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{u.credits}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? '正常' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleUpdateCredits(u)} className="text-xs text-primary-600 hover:underline mr-2">积分</button>
                    <button onClick={() => handleToggleActive(u)} className={`text-xs ${u.is_active ? 'text-red-600' : 'text-green-600'} hover:underline`}>
                      {u.is_active ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
