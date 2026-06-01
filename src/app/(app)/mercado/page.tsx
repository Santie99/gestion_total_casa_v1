export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/formatters";
import { getCurrentFamily } from "@/modules/household/queries";
import { getPriceHistoryRows, getPurchaseMix, getStockStats, sumItemsByPurchase, sumMarketItems } from "@/modules/market/calculations";
import { ManualInvoiceForm } from "@/modules/market/components/manual-invoice-form";
import { MarketItemForm } from "@/modules/market/components/market-item-form";
import { MarketPeriodForm } from "@/modules/market/components/market-period-form";
import { MarketPeriodList } from "@/modules/market/components/market-period-list";
import { MarketProductForm } from "@/modules/market/components/market-product-form";
import { MarketProductList } from "@/modules/market/components/market-product-list";
import { MarketPurchaseForm } from "@/modules/market/components/market-purchase-form";
import { MarketPurchaseList } from "@/modules/market/components/market-purchase-list";
import { MarketSummaryCard } from "@/modules/market/components/market-summary-card";
import { PriceHistoryList } from "@/modules/market/components/price-history-list";
import { StockItemForm } from "@/modules/market/components/stock-item-form";
import { StockItemList } from "@/modules/market/components/stock-item-list";
import { StockMovementForm } from "@/modules/market/components/stock-movement-form";
import { StockMovementList } from "@/modules/market/components/stock-movement-list";
import { StockSummaryCard } from "@/modules/market/components/stock-summary-card";
import type { ManualInvoice, MarketPeriod, MarketProduct, MarketPurchase, MarketPurchaseItem, MarketPurchaseWithItems, StockItem, StockMovement } from "@/modules/market/types";

export default async function MercadoPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data: periodsData }, { data: invoicesData }, { data: productsData }, { data: stockData }, { data: stockMovementsData }] = await Promise.all([
    supabase
      .from("market_periods")
      .select("id, family_id, name, starts_on, ends_on, status, notes, created_at")
      .eq("family_id", context.familyId)
      .order("starts_on", { ascending: false }),
    supabase
      .from("manual_invoices")
      .select("id, family_id, invoice_code, invoice_date, vendor, notes, created_at")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("market_products")
      .select("id, family_id, name, default_category, default_unit, is_active, is_stockable, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("stock_items")
      .select("id, family_id, product_id, product_name, category_name, unit, quantity, min_quantity, is_active, last_updated_at, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("product_name", { ascending: true }),
    supabase
      .from("stock_movements")
      .select("id, family_id, stock_item_id, movement_type, quantity_delta, quantity_after, source_purchase_item_id, notes, occurred_on, created_at, stock_items(product_name, unit)")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const periods = (periodsData ?? []) as MarketPeriod[];
  const invoices = (invoicesData ?? []) as ManualInvoice[];
  const products = (productsData ?? []) as MarketProduct[];
  const stockItems = (stockData ?? []) as StockItem[];
  const stockMovements = (stockMovementsData ?? []) as unknown as StockMovement[];
  const selectedPeriodId = params.period && periods.some((period) => period.id === params.period)
    ? params.period
    : periods[0]?.id ?? null;
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? null;

  const { data: allPurchasesData } = await supabase
    .from("market_purchases")
    .select("id, family_id, market_period_id, invoice_id, purchased_on, vendor, purchase_type, notes, created_at")
    .eq("family_id", context.familyId)
    .order("purchased_on", { ascending: false });

  const allPurchases = (allPurchasesData ?? []) as MarketPurchase[];
  const allPurchaseIds = allPurchases.map((purchase) => purchase.id);
  const { data: allItemsData } = allPurchaseIds.length
    ? await supabase
        .from("market_purchase_items")
        .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at, market_purchases(purchased_on, market_period_id)")
        .eq("family_id", context.familyId)
        .in("market_purchase_id", allPurchaseIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const allItems = (allItemsData ?? []) as unknown as MarketPurchaseItem[];
  const totalsByPurchase = sumItemsByPurchase(allItems);
  const totalsByPeriod = allPurchases.reduce<Record<string, number>>((acc, purchase) => {
    acc[purchase.market_period_id] = (acc[purchase.market_period_id] ?? 0) + (totalsByPurchase[purchase.id] ?? 0);
    return acc;
  }, {});

  const selectedPurchases = allPurchases.filter((purchase) => purchase.market_period_id === selectedPeriodId);
  const selectedPurchaseIds = selectedPurchases.map((purchase) => purchase.id);
  const selectedItems = allItems.filter((item) => selectedPurchaseIds.includes(item.market_purchase_id));
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const itemsByPurchase = selectedItems.reduce<Record<string, MarketPurchaseItem[]>>((acc, item) => {
    acc[item.market_purchase_id] = [...(acc[item.market_purchase_id] ?? []), item];
    return acc;
  }, {});
  const selectedPurchasesWithItems: MarketPurchaseWithItems[] = selectedPurchases.map((purchase) => ({
    ...purchase,
    items: itemsByPurchase[purchase.id] ?? [],
    invoice: purchase.invoice_id ? invoiceById.get(purchase.invoice_id) ?? null : null,
  }));
  const selectedTotal = sumMarketItems(selectedItems);
  const purchaseMix = getPurchaseMix(selectedPurchases);
  const averagePurchase = selectedPurchases.length ? selectedTotal / selectedPurchases.length : 0;
  const priceHistoryRows = getPriceHistoryRows(allItems, periods);
  const stockStats = getStockStats(stockItems);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 5 · Mercado, precios completos y stock</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Mercado</h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">Quincenas flexibles, facturas, productos maestros, histórico completo de precios y stock en casa.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MarketSummaryCard title="Total quincena" value={formatCurrency(selectedTotal)} description={selectedPeriod?.name ?? "Crea una quincena para empezar."} />
        <MarketSummaryCard title="Compras" value={String(selectedPurchases.length)} description={`${purchaseMix.main} principales · ${purchaseMix.sporadic} esporádicas`} />
        <MarketSummaryCard title="Productos" value={String(selectedItems.length)} description="Productos registrados en la quincena seleccionada." />
        <MarketSummaryCard title="Promedio por compra" value={formatCurrency(averagePurchase)} description="Total de la quincena dividido en compras registradas." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StockSummaryCard title="Stock activo" value={String(stockStats.total)} description="Productos con inventario activo en casa." />
        <StockSummaryCard title="Stock bajo" value={String(stockStats.low)} description="Productos en o por debajo del mínimo definido." />
        <StockSummaryCard title="Agotados" value={String(stockStats.empty)} description="Productos con cantidad disponible igual a cero." />
        <StockSummaryCard title="Stock sano" value={String(stockStats.healthy)} description="Productos por encima de su mínimo." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crear quincena</CardTitle>
              <CardDescription>Define rangos flexibles. No tienen que ser del 1 al 15 exactamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketPeriodForm familyId={context.familyId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quincenas</CardTitle>
              <CardDescription>Selecciona una quincena para ver y registrar compras.</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketPeriodList periods={periods} selectedPeriodId={selectedPeriodId} totalsByPeriod={totalsByPeriod} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos maestros</CardTitle>
              <CardDescription>Normaliza productos para comparar precios y preparar stock.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <MarketProductForm familyId={context.familyId} />
              <MarketProductList products={products} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock inicial</CardTitle>
              <CardDescription>Crea inventario manual para productos que ya tienes en casa.</CardDescription>
            </CardHeader>
            <CardContent>
              <StockItemForm familyId={context.familyId} products={products} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crear factura manual</CardTitle>
                <CardDescription>Opcional. Sirve para asociar una factura física a una compra.</CardDescription>
              </CardHeader>
              <CardContent>
                <ManualInvoiceForm familyId={context.familyId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrar compra</CardTitle>
                <CardDescription>Crea una compra principal o esporádica dentro de una quincena.</CardDescription>
              </CardHeader>
              <CardContent>
                <MarketPurchaseForm familyId={context.familyId} periods={periods} selectedPeriodId={selectedPeriodId} invoices={invoices} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agregar producto comprado</CardTitle>
              <CardDescription>El precio unitario se calcula automáticamente desde cantidad y precio total.</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketItemForm familyId={context.familyId} purchases={selectedPurchases} products={products} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedPeriod ? `Detalle · ${selectedPeriod.name}` : "Detalle de compras"}</CardTitle>
              <CardDescription>El total de la quincena sale de los productos registrados. No se ingresa manualmente.</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketPurchaseList purchases={selectedPurchasesWithItems} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stock en casa</CardTitle>
                <CardDescription>Inventario actual. Las compras marcadas para stock entran automáticamente.</CardDescription>
              </CardHeader>
              <CardContent>
                <StockItemList items={stockItems} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movimiento de stock</CardTitle>
                <CardDescription>Registra consumos, salidas o ajustes manuales.</CardDescription>
              </CardHeader>
              <CardContent>
                <StockMovementForm familyId={context.familyId} stockItems={stockItems} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movimientos recientes de stock</CardTitle>
              <CardDescription>Entradas automáticas desde compras, stock inicial y consumos manuales.</CardDescription>
            </CardHeader>
            <CardContent>
              <StockMovementList movements={stockMovements} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de precios por producto</CardTitle>
              <CardDescription>Detalle completo por producto y misma unidad. Cada fila muestra variación frente a la compra anterior.</CardDescription>
            </CardHeader>
            <CardContent>
              <PriceHistoryList rows={priceHistoryRows} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
