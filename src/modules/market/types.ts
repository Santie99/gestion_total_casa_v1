export type MarketPeriodStatus = "open" | "closed" | "historical";
export type MarketPurchaseType = "main" | "sporadic";

export type MarketPeriod = {
  id: string;
  family_id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  status: MarketPeriodStatus;
  notes: string | null;
  created_at: string;
};

export type ManualInvoice = {
  id: string;
  family_id: string;
  invoice_code: string;
  invoice_date: string | null;
  vendor: string | null;
  notes: string | null;
  created_at: string;
};

export type MarketPurchase = {
  id: string;
  family_id: string;
  market_period_id: string;
  invoice_id: string | null;
  purchased_on: string;
  vendor: string | null;
  purchase_type: MarketPurchaseType;
  notes: string | null;
  created_at: string;
};

export type MarketPurchaseItem = {
  id: string;
  family_id: string;
  market_purchase_id: string;
  product_name: string;
  category_name: string | null;
  quantity: number;
  unit: string;
  total_price: number;
  unit_price: number | null;
  updates_stock: boolean;
  created_at: string;
};

export type MarketPurchaseWithItems = MarketPurchase & {
  items: MarketPurchaseItem[];
  invoice?: ManualInvoice | null;
};
