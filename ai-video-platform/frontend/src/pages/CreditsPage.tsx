import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { getBalance, getPackages, getTransactions, purchaseCredits } from '../api/credits';
import type { CreditPackage, CreditTransaction } from '../types/credit';
import { formatDate, formatCredits } from '../utils/format';

export default function CreditsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState({ credits: 0, total_used: 0 });
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    getBalance().then(setBalance);
    getPackages().then(setPackages);
    getTransactions({ page: 1, per_page: 20 }).then((res) => setTransactions(res.items));
  }, [user?.credits]);

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasing(true);
    try {
      const result = await purchaseCredits(pkg.id);
      toast(result.message, 'success');
      refreshUser();
      getBalance().then(setBalance);
      getTransactions({ page: 1, per_page: 20 }).then((res) => setTransactions(res.items));
    } catch (err: any) {
      toast(err.response?.data?.detail || '购买失败', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const txTypeLabel = (t: string) => {
    const map: Record<string, string> = { usage: '消费', purchase: '购买', refund: '退款', grant: '赠送', bonus: '奖励' };
    return map[t] || t;
  };

  const txTypeColor = (t: string) => {
    const map: Record<string, string> = { usage: 'text-red-600', purchase: 'text-green-600', refund: 'text-blue-600', grant: 'text-green-600' };
    return map[t] || 'text-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">积分中心</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-xl p-6">
          <div className="text-sm opacity-80 mb-1">当前积分</div>
          <div className="text-4xl font-bold">{formatCredits(balance.credits)}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl p-6">
          <div className="text-sm opacity-80 mb-1">已使用</div>
          <div className="text-4xl font-bold">{formatCredits(balance.total_used)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-1">💰</div>
            <div className="text-sm text-gray-500">积分可用于生成AI视频</div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">积分套餐</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-primary-600">{formatCredits(pkg.credits)}</div>
            <div className="text-sm text-gray-500 mt-1">{pkg.name}</div>
            <div className="text-lg font-semibold mt-2">
              {pkg.price_cents > 0 ? `¥${(pkg.price_cents / 100).toFixed(2)}` : '免费'}
            </div>
            <button
              onClick={() => handlePurchase(pkg)}
              disabled={purchasing}
              className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              获取
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">积分明细</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">说明</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">类型</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">金额</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">余额</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{t.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 ${txTypeColor(t.transaction_type)}`}>
                      {txTypeLabel(t.transaction_type)}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount}
                  </td>
                  <td className="px-4 py-3 text-right">{t.balance_after}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
