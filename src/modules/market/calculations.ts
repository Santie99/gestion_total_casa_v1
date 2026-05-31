import type { MarketPurchase, MarketPurchaseItem } from "./types";

export function sumMarketItems(items: Pick<MarketPurchaseItem, "total_price">[]) {
  return items.reduce((total, item) => total + Number(item.total_price ?? 0), 0);
}

export function countItemsByPurchase(items: MarketPurchaseItem[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.market_purchase_id] = (acc[item.market_purchase_id] ?? 0) + 1;
    return acc;
  }, {});
}

export function sumItemsByPurchase(items: MarketPurchaseItem[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.market_purchase_id] = (acc[item.market_purchase_id] ?? 0) + Number(item.total_price ?? 0);
    return acc;
  }, {});
}

export function getPurchaseMix(purchases: MarketPurchase[]) {
  return purchases.reduce(
    (acc, purchase) => {
      if (purchase.purchase_type === "sporadic") acc.sporadic += 1;
      else acc.main += 1;
      return acc;
    },
    { main: 0, sporadic: 0 },
  );
}
