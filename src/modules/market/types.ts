export type MarketPeriodStatus = "open" | "closed" | "historical";
export type MarketPurchaseType = "main" | "sporadic";
export type StockMovementType = "initial" | "purchase_in" | "consume" | "adjustment";

export type MarketProduct = {
  id: string;
  family_id: string;
  name: string;
  default_category: string | null;
  default_unit: string | null;
  is_active: boolean;
  is_stockable: boolean;
  created_at: string;
};

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
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  quantity: number;
  unit: string;
  total_price: number;
  unit_price: number | null;
  updates_stock: boolean;
  created_at: string;
  market_purchases?: Pick<MarketPurchase, "purchased_on" | "market_period_id"> | null;
  market_products?: Pick<MarketProduct, "name" | "default_category" | "default_unit"> | null;
};

export type MarketPurchaseWithItems = MarketPurchase & {
  items: MarketPurchaseItem[];
  invoice?: ManualInvoice | null;
};

export type PriceHistoryRecord = {
  id: string;
  purchasedOn: string;
  periodName: string | null;
  quantity: number;
  unit: string;
  totalPrice: number;
  unitPrice: number;
  variationAmount: number | null;
  variationPercent: number | null;
};

export type PriceHistoryRow = {
  key: string;
  productName: string;
  unit: string;
  categoryName: string | null;
  previousPrice: number | null;
  latestPrice: number;
  previousDate: string | null;
  latestDate: string;
  variationAmount: number | null;
  variationPercent: number | null;
  records: PriceHistoryRecord[];
};

export type StockItem = {
  id: string;
  family_id: string;
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  unit: string;
  quantity: number;
  min_quantity: number;
  is_active: boolean;
  last_updated_at: string;
  created_at: string;
};

export type StockMovement = {
  id: string;
  family_id: string;
  stock_item_id: string;
  movement_type: StockMovementType;
  quantity_delta: number;
  quantity_after: number;
  source_purchase_item_id: string | null;
  notes: string | null;
  occurred_on: string;
  created_at: string;
  stock_items?: Pick<StockItem, "product_name" | "unit"> | null;
};
