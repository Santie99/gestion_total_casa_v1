export type ShoppingListStatus = "draft" | "active" | "completed";
export type ShoppingItemSource = "menu" | "low_stock" | "manual";
export type ShoppingItemPriority = "low" | "normal" | "high";

export type ShoppingList = {
  id: string;
  family_id: string;
  name: string;
  period_start: string;
  period_end: string;
  status: ShoppingListStatus;
  notes: string | null;
  converted_market_purchase_id: string | null;
  converted_at: string | null;
  created_at: string;
};

export type ShoppingListItem = {
  id: string;
  family_id: string;
  shopping_list_id: string;
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  needed_quantity: number | null;
  current_stock_quantity: number | null;
  suggested_purchase_quantity: number;
  actual_purchase_quantity: number | null;
  actual_unit: string | null;
  actual_total_price: number | null;
  preferred_vendor: string | null;
  converted_to_market_item_id: string | null;
  unit: string;
  source: ShoppingItemSource;
  priority: ShoppingItemPriority;
  is_purchased: boolean;
  notes: string | null;
  created_at: string;
};

export type ShoppingListWithItems = ShoppingList & {
  items: ShoppingListItem[];
};

export type ShoppingSuggestionInput = {
  productId: string | null;
  productName: string;
  categoryName: string | null;
  neededQuantity: number;
  currentStockQuantity: number;
  suggestedPurchaseQuantity: number;
  unit: string;
  source: ShoppingItemSource;
  priority: ShoppingItemPriority;
  notes: string | null;
};
