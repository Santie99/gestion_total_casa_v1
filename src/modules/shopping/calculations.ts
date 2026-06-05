import type { MealPlanItem, MealPlanWithDetails } from "@/modules/menus/types";
import type { StockItem } from "@/modules/market/types";
import type { ShoppingItemPriority, ShoppingListItem, ShoppingListWithItems, ShoppingSuggestionInput } from "./types";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function comparableKey(params: { productId?: string | null; productName: string; unit: string }) {
  const unit = normalizeText(params.unit);
  if (params.productId) return `product:${params.productId}::${unit}`;
  return `name:${normalizeText(params.productName)}::${unit}`;
}

function fallbackKey(params: { productName: string; unit: string }) {
  return `name:${normalizeText(params.productName)}::${normalizeText(params.unit)}`;
}

function getStockQuantityForItem(item: Pick<MealPlanItem, "product_id" | "product_name" | "unit">, stockItems: StockItem[]) {
  const productKey = comparableKey({ productId: item.product_id, productName: item.product_name, unit: item.unit });
  const nameKey = fallbackKey({ productName: item.product_name, unit: item.unit });

  const stock = stockItems.find((stockItem) => {
    const stockProductKey = comparableKey({ productId: stockItem.product_id, productName: stockItem.product_name, unit: stockItem.unit });
    const stockNameKey = fallbackKey({ productName: stockItem.product_name, unit: stockItem.unit });
    return stockProductKey === productKey || stockNameKey === nameKey;
  });

  return Number(stock?.quantity ?? 0);
}

export function getShoppingSuggestionsFromMenus(params: {
  plans: MealPlanWithDetails[];
  stockItems: StockItem[];
  periodStart: string;
  periodEnd: string;
}): ShoppingSuggestionInput[] {
  const plannedItems = params.plans
    .filter((plan) => plan.planned_on >= params.periodStart && plan.planned_on <= params.periodEnd)
    .flatMap((plan) => plan.items.map((item) => ({ ...item, plannedOn: plan.planned_on, mealTitle: plan.title })));

  const grouped = plannedItems.reduce<Record<string, Array<MealPlanItem & { plannedOn: string; mealTitle: string }>>>((acc, item) => {
    const key = comparableKey({ productId: item.product_id, productName: item.product_name, unit: item.unit });
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});

  return Object.values(grouped)
    .map((items) => {
      const first = items[0];
      const neededQuantity = items.reduce((total, item) => total + Number(item.quantity ?? 0), 0);
      const currentStockQuantity = getStockQuantityForItem(first, params.stockItems);
      const suggestedPurchaseQuantity = Math.max(neededQuantity - currentStockQuantity, 0);
      const priority: ShoppingItemPriority = suggestedPurchaseQuantity >= neededQuantity ? "high" : suggestedPurchaseQuantity > 0 ? "normal" : "low";

      return {
        productId: first.product_id,
        productName: first.product_name,
        categoryName: first.market_products?.default_category ?? null,
        neededQuantity,
        currentStockQuantity,
        suggestedPurchaseQuantity,
        unit: first.unit,
        source: "menu" as const,
        priority,
        notes: `Calculado desde ${items.length} ítem(s) de menú entre ${params.periodStart} y ${params.periodEnd}.`,
      };
    })
    .filter((suggestion) => suggestion.suggestedPurchaseQuantity > 0)
    .sort((a, b) => b.suggestedPurchaseQuantity - a.suggestedPurchaseQuantity);
}

export function getLowStockSuggestions(stockItems: StockItem[]): ShoppingSuggestionInput[] {
  return stockItems
    .filter((item) => item.is_active && Number(item.min_quantity ?? 0) > 0 && Number(item.quantity ?? 0) <= Number(item.min_quantity ?? 0))
    .map((item) => {
      const quantity = Number(item.quantity ?? 0);
      const minQuantity = Number(item.min_quantity ?? 0);
      const suggestedPurchaseQuantity = Math.max(minQuantity * 2 - quantity, minQuantity - quantity, 0);
      return {
        productId: item.product_id,
        productName: item.product_name,
        categoryName: item.category_name,
        neededQuantity: minQuantity,
        currentStockQuantity: quantity,
        suggestedPurchaseQuantity,
        unit: item.unit,
        source: "low_stock" as const,
        priority: quantity <= 0 ? "high" as const : "normal" as const,
        notes: quantity <= 0 ? "Producto agotado según stock actual." : "Producto en o por debajo del stock mínimo.",
      };
    })
    .filter((suggestion) => suggestion.suggestedPurchaseQuantity > 0);
}

export function mergeShoppingSuggestions(suggestions: ShoppingSuggestionInput[]) {
  const grouped = suggestions.reduce<Record<string, ShoppingSuggestionInput>>((acc, suggestion) => {
    const key = comparableKey({ productId: suggestion.productId, productName: suggestion.productName, unit: suggestion.unit });
    const current = acc[key];
    if (!current) {
      acc[key] = { ...suggestion };
      return acc;
    }

    current.neededQuantity += suggestion.neededQuantity;
    current.suggestedPurchaseQuantity = Math.max(current.suggestedPurchaseQuantity, suggestion.suggestedPurchaseQuantity);
    current.currentStockQuantity = Math.max(current.currentStockQuantity, suggestion.currentStockQuantity);
    current.source = current.source === suggestion.source ? current.source : "manual";
    current.priority = current.priority === "high" || suggestion.priority === "high" ? "high" : "normal";
    current.notes = [current.notes, suggestion.notes].filter(Boolean).join(" | ");
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 } as const;
    return priorityOrder[a.priority] - priorityOrder[b.priority] || a.productName.localeCompare(b.productName);
  });
}

export function getShoppingListStats(lists: ShoppingListWithItems[]) {
  const activeLists = lists.filter((list) => list.status !== "completed");
  const allItems = lists.flatMap((list) => list.items);
  const pendingItems = allItems.filter((item) => !item.is_purchased);
  const purchasedItems = allItems.filter((item) => item.is_purchased);
  const highPriorityItems = pendingItems.filter((item) => item.priority === "high");

  return {
    activeLists: activeLists.length,
    totalItems: allItems.length,
    pendingItems: pendingItems.length,
    purchasedItems: purchasedItems.length,
    highPriorityItems: highPriorityItems.length,
  };
}

export function getShoppingPriorityLabel(priority: ShoppingListItem["priority"]) {
  const labels: Record<ShoppingListItem["priority"], string> = {
    high: "Alta",
    normal: "Normal",
    low: "Baja",
  };

  return labels[priority];
}

export function getShoppingSourceLabel(source: ShoppingListItem["source"]) {
  const labels: Record<ShoppingListItem["source"], string> = {
    menu: "Menús",
    low_stock: "Stock bajo",
    manual: "Manual",
  };

  return labels[source];
}
