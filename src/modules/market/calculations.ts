import type { MarketPeriod, MarketPurchase, MarketPurchaseItem, PriceHistoryRow, StockItem } from "./types";

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

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getPriceHistoryRows(items: MarketPurchaseItem[], periods: MarketPeriod[] = []): PriceHistoryRow[] {
  const periodById = new Map(periods.map((period) => [period.id, period.name]));
  const comparableItems = items
    .filter((item) => Number(item.quantity) > 0 && Number(item.unit_price ?? 0) > 0)
    .map((item) => {
      const purchasedOn = item.market_purchases?.purchased_on ?? item.created_at.slice(0, 10);
      const periodId = item.market_purchases?.market_period_id ?? null;
      return {
        ...item,
        normalizedKey: `${normalizeText(item.product_name)}::${normalizeText(item.unit)}`,
        purchasedOn,
        periodName: periodId ? periodById.get(periodId) ?? null : null,
      };
    })
    .sort((a, b) => a.purchasedOn.localeCompare(b.purchasedOn) || a.created_at.localeCompare(b.created_at));

  const grouped = comparableItems.reduce<Record<string, typeof comparableItems>>((acc, item) => {
    acc[item.normalizedKey] = [...(acc[item.normalizedKey] ?? []), item];
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([key, group]) => {
      const records = group.map((item, index) => {
        const unitPrice = Number(item.unit_price ?? 0);
        const previous = index > 0 ? group[index - 1] : null;
        const previousUnitPrice = previous ? Number(previous.unit_price ?? 0) : null;
        const variationAmount = previousUnitPrice === null ? null : unitPrice - previousUnitPrice;
        const variationPercent = previousUnitPrice && previousUnitPrice > 0 ? variationAmount! / previousUnitPrice : null;

        return {
          id: item.id,
          purchasedOn: item.purchasedOn,
          periodName: item.periodName,
          quantity: Number(item.quantity ?? 0),
          unit: item.unit,
          totalPrice: Number(item.total_price ?? 0),
          unitPrice,
          variationAmount,
          variationPercent,
        };
      });

      const latest = group[group.length - 1];
      const previous = group.length > 1 ? group[group.length - 2] : null;
      const latestPrice = Number(latest.unit_price ?? 0);
      const previousPrice = previous ? Number(previous.unit_price ?? 0) : null;
      const variationAmount = previousPrice === null ? null : latestPrice - previousPrice;
      const variationPercent = previousPrice && previousPrice > 0 ? variationAmount! / previousPrice : null;

      return {
        key,
        productName: latest.product_name,
        unit: latest.unit,
        categoryName: latest.category_name,
        previousPrice,
        latestPrice,
        previousDate: previous?.purchasedOn ?? null,
        latestDate: latest.purchasedOn,
        variationAmount,
        variationPercent,
        records,
      };
    })
    .sort((a, b) => Math.abs(b.variationPercent ?? 0) - Math.abs(a.variationPercent ?? 0));
}

export function getStockStats(items: StockItem[]) {
  const activeItems = items.filter((item) => item.is_active);
  const lowItems = activeItems.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.min_quantity));
  const emptyItems = activeItems.filter((item) => Number(item.quantity) <= 0);
  const healthyItems = activeItems.filter((item) => Number(item.quantity) > Number(item.min_quantity));

  return {
    total: activeItems.length,
    low: lowItems.length,
    empty: emptyItems.length,
    healthy: healthyItems.length,
  };
}
