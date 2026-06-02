import apiClient from './client';
import type { CreditBalance, CreditTransactionList, CreditPackage } from '../types/credit';

export async function getBalance(): Promise<CreditBalance> {
  const res = await apiClient.get('/credits/balance');
  return res.data;
}

export async function getTransactions(params: {
  page?: number;
  per_page?: number;
  transaction_type?: string;
}): Promise<CreditTransactionList> {
  const res = await apiClient.get('/credits/transactions', { params });
  return res.data;
}

export async function getPackages(): Promise<CreditPackage[]> {
  const res = await apiClient.get('/credits/packages');
  return res.data;
}

export async function purchaseCredits(packageId: number): Promise<{ message: string; credits: number }> {
  const res = await apiClient.post('/credits/purchase', { package_id: packageId });
  return res.data;
}
