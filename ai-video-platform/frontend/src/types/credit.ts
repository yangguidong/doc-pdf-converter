export interface CreditBalance {
  credits: number;
  total_used: number;
}

export interface CreditTransaction {
  id: number;
  user_id: number;
  amount: number;
  balance_after: number;
  transaction_type: string;
  reference_type: string | null;
  reference_id: number | null;
  description: string | null;
  created_at: string | null;
}

export interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price_cents: number;
  is_active: boolean;
}

export interface CreditTransactionList {
  items: CreditTransaction[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
