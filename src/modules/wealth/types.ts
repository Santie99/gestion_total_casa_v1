export type DebtType = "credit_card" | "personal_loan" | "vehicle_loan" | "mortgage" | "family_loan" | "other";

export type DebtStatus = "active" | "paid" | "paused";

export type AssetType = "cash" | "bank_account" | "investment" | "vehicle" | "real_estate" | "home_item" | "other";

export type AssetStatus = "active" | "sold" | "inactive";

export type Debt = {
  id: string;
  family_id: string;
  name: string;
  debt_type: DebtType;
  entity: string | null;
  current_balance: number;
  monthly_payment: number | null;
  interest_rate: number | null;
  due_day: number | null;
  responsible_member_id: string | null;
  status: DebtStatus;
  notes: string | null;
  created_at: string;
  family_members?: { full_name: string } | null;
};

export type DebtPayment = {
  id: string;
  family_id: string;
  debt_id: string;
  paid_on: string;
  amount: number;
  principal_amount: number | null;
  interest_amount: number | null;
  notes: string | null;
  created_at: string;
  debts?: Pick<Debt, "name"> | null;
};

export type Asset = {
  id: string;
  family_id: string;
  name: string;
  asset_type: AssetType;
  estimated_value: number;
  valuation_date: string;
  owner_member_id: string | null;
  status: AssetStatus;
  notes: string | null;
  created_at: string;
  family_members?: { full_name: string } | null;
};

export type WealthSummary = {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  monthlyDebtPayments: number;
  debtToAssetRatio: number;
};
