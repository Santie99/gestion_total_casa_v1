"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toDateInputValue } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { ManualInvoice, MarketPeriod, MarketProduct } from "@/modules/market/types";
import { getShoppingPriorityLabel, getShoppingSourceLabel } from "../calculations";
import type { ShoppingListItem, ShoppingListWithItems } from "../types";

function priorityClass(priority: string) {
  if (priority === "high") return "bg-red-50 text-red-700";
  if (priority === "normal") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "completed") return "Completada";
  if (status === "active") return "Activa";
  return "Borrador";
}

function vendorKey(value: string | null | undefined) {
  const clean = (value ?? "").trim();
  return clean || "Sin lugar definido";
}

function purchasedItemsForGroup(items: ShoppingListItem[]) {
  return items.filter((item) => item.is_purchased && !item.converted_to_market_item_id);
}

function hasActualData(item: ShoppingListItem) {
  return Boolean(item.actual_purchase_quantity && item.actual_unit && item.actual_total_price !== null && item.actual_total_price !== undefined);
}

export function ShoppingListView({
  familyId,
  lists,
  marketPeriods,
  invoices,
  products,
}: {
  familyId: string;
  lists: ShoppingListWithItems[];
  marketPeriods: MarketPeriod[];
  invoices: ManualInvoice[];
  products: MarketProduct[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = toDateInputValue(new Date());

  const productOptions = useMemo(() => products.filter((product) => product.is_active), [products]);

  async function togglePurchased(itemId: string, isPurchased: boolean) {
    setLoadingId(itemId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("shopping_list_items").update({ is_purchased: !isPurchased }).eq("id", itemId);
      if (updateError) throw updateError;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo actualizar el producto de la lista."));
    } finally {
      setLoadingId(null);
    }
  }

  async function completeList(listId: string) {
    setLoadingId(listId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("shopping_lists").update({ status: "completed" }).eq("id", listId);
      if (updateError) throw updateError;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo completar la lista."));
    } finally {
      setLoadingId(null);
    }
  }

  async function updateItemProduct(item: ShoppingListItem, formData: FormData) {
    const productId = String(formData.get(`product_id_${item.id}`) ?? "");
    const preferredVendor = String(formData.get(`preferred_vendor_${item.id}`) ?? "").trim();
    const selectedProduct = productOptions.find((product) => product.id === productId);

    setLoadingId(`link-${item.id}`);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({
          product_id: productId || null,
          product_name: selectedProduct?.name ?? item.product_name,
          category_name: selectedProduct?.default_category ?? item.category_name,
          unit: selectedProduct?.default_unit ?? item.unit,
          actual_unit: item.actual_unit ?? selectedProduct?.default_unit ?? item.unit,
          preferred_vendor: preferredVendor || null,
        })
        .eq("id", item.id)
        .eq("family_id", familyId);

      if (updateError) throw updateError;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo actualizar el producto de la lista."));
    } finally {
      setLoadingId(null);
    }
  }

  async function createProductFromItem(item: ShoppingListItem) {
    setLoadingId(`create-product-${item.id}`);
    setError(null);

    try {
      const supabase = createClient();
      const { data: product, error: productError } = await supabase
        .from("market_products")
        .insert({
          family_id: familyId,
          name: item.product_name,
          default_category: item.category_name,
          default_unit: item.unit,
          is_stockable: true,
        })
        .select("id, name, default_category, default_unit")
        .single();

      if (productError) throw productError;

      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({ product_id: product.id })
        .eq("id", item.id)
        .eq("family_id", familyId);

      if (updateError) throw updateError;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el producto maestro desde este ítem."));
    } finally {
      setLoadingId(null);
    }
  }

  async function updateStockFromPurchaseItem(params: {
    marketPurchaseItemId: string;
    productId: string | null;
    productName: string;
    categoryName: string | null;
    quantity: number;
    unit: string;
    occurredOn: string;
  }) {
    const supabase = createClient();
    let stockQuery = supabase
      .from("stock_items")
      .select("id, quantity")
      .eq("family_id", familyId)
      .eq("unit", params.unit)
      .limit(1);

    stockQuery = params.productId ? stockQuery.eq("product_id", params.productId) : stockQuery.eq("product_name", params.productName);

    const { data: existingStock, error: stockLookupError } = await stockQuery.maybeSingle();
    if (stockLookupError) throw stockLookupError;

    const currentQuantity = Number(existingStock?.quantity ?? 0);
    const nextQuantity = currentQuantity + params.quantity;
    let stockItemId = existingStock?.id as string | undefined;

    if (stockItemId) {
      const { error: updateStockError } = await supabase
        .from("stock_items")
        .update({ quantity: nextQuantity, last_updated_at: new Date().toISOString() })
        .eq("id", stockItemId)
        .eq("family_id", familyId);

      if (updateStockError) throw updateStockError;
    } else {
      const { data: createdStock, error: createStockError } = await supabase
        .from("stock_items")
        .insert({
          family_id: familyId,
          product_id: params.productId,
          product_name: params.productName,
          category_name: params.categoryName,
          unit: params.unit,
          quantity: params.quantity,
          min_quantity: 0,
        })
        .select("id")
        .single();

      if (createStockError) throw createStockError;
      stockItemId = createdStock.id;
    }

    const { error: movementError } = await supabase.from("stock_movements").insert({
      family_id: familyId,
      stock_item_id: stockItemId,
      movement_type: "purchase_in",
      quantity_delta: params.quantity,
      quantity_after: nextQuantity,
      source_purchase_item_id: params.marketPurchaseItemId,
      notes: "Entrada automática desde lista de compras convertida a Mercado.",
      occurred_on: params.occurredOn,
    });

    if (movementError) throw movementError;
  }

  async function convertItemsToMarketPurchase(list: ShoppingListWithItems, groupItems: ShoppingListItem[], formData: FormData, groupKey: string) {
    const formKey = `${list.id}_${groupKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const marketPeriodId = String(formData.get(`market_period_id_${formKey}`) ?? "");
    const purchasedOn = String(formData.get(`purchased_on_${formKey}`) ?? "");
    const vendor = String(formData.get(`vendor_${formKey}`) ?? "").trim();
    const invoiceId = String(formData.get(`invoice_id_${formKey}`) ?? "");
    const notes = String(formData.get(`conversion_notes_${formKey}`) ?? "").trim();
    const itemsToConvert = purchasedItemsForGroup(groupItems);

    if (!marketPeriodId || !purchasedOn) {
      throw new Error("Selecciona quincena y fecha de compra para convertir estos productos.");
    }

    if (purchasedOn > today) {
      throw new Error("La fecha de compra no puede ser posterior a hoy.");
    }

    if (!itemsToConvert.length) {
      throw new Error("Marca al menos un producto de este grupo como comprado antes de convertir.");
    }

    const selectedPeriod = marketPeriods.find((period) => period.id === marketPeriodId);
    const outsidePeriod = selectedPeriod && (purchasedOn < selectedPeriod.starts_on || purchasedOn > selectedPeriod.ends_on);

    const parsedItems = itemsToConvert.map((item) => {
      const quantity = Number(formData.get(`actual_quantity_${item.id}`));
      const unit = String(formData.get(`actual_unit_${item.id}`) ?? "").trim();
      const totalPrice = Number(formData.get(`actual_total_price_${item.id}`));

      if (Number.isNaN(quantity) || quantity <= 0) {
        throw new Error(`La cantidad real de ${item.product_name} debe ser mayor que cero.`);
      }

      if (!unit) {
        throw new Error(`La unidad real de ${item.product_name} es obligatoria.`);
      }

      if (Number.isNaN(totalPrice) || totalPrice < 0) {
        throw new Error(`El precio real de ${item.product_name} debe ser cero o mayor.`);
      }

      return { item, quantity, unit, totalPrice };
    });

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    const { data: purchase, error: purchaseError } = await supabase
      .from("market_purchases")
      .insert({
        family_id: familyId,
        market_period_id: marketPeriodId,
        invoice_id: invoiceId || null,
        purchased_on: purchasedOn,
        vendor: vendor || groupKey || null,
        purchase_type: "main",
        notes: [
          `Compra generada desde lista: ${list.name}.`,
          `Grupo/lugar: ${groupKey}.`,
          outsidePeriod ? "Advertencia: la fecha quedó fuera del rango de la quincena seleccionada." : null,
          notes || null,
        ].filter(Boolean).join(" "),
        created_by: userData.user?.id ?? null,
      })
      .select("id")
      .single();

    if (purchaseError) throw purchaseError;

    for (const parsed of parsedItems) {
      const { data: purchaseItem, error: itemError } = await supabase
        .from("market_purchase_items")
        .insert({
          family_id: familyId,
          market_purchase_id: purchase.id,
          product_id: parsed.item.product_id,
          product_name: parsed.item.product_name,
          category_name: parsed.item.category_name,
          quantity: parsed.quantity,
          unit: parsed.unit,
          total_price: parsed.totalPrice,
          updates_stock: true,
        })
        .select("id")
        .single();

      if (itemError) throw itemError;

      await updateStockFromPurchaseItem({
        marketPurchaseItemId: purchaseItem.id,
        productId: parsed.item.product_id,
        productName: parsed.item.product_name,
        categoryName: parsed.item.category_name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        occurredOn: purchasedOn,
      });

      const { error: itemUpdateError } = await supabase
        .from("shopping_list_items")
        .update({
          actual_purchase_quantity: parsed.quantity,
          actual_unit: parsed.unit,
          actual_total_price: parsed.totalPrice,
          converted_to_market_item_id: purchaseItem.id,
        })
        .eq("id", parsed.item.id)
        .eq("family_id", familyId);

      if (itemUpdateError) throw itemUpdateError;
    }

    const allItemsConverted = list.items.every((item) => item.converted_to_market_item_id || parsedItems.some((parsed) => parsed.item.id === item.id) || !item.is_purchased);
    if (allItemsConverted) {
      const { error: listUpdateError } = await supabase
        .from("shopping_lists")
        .update({
          status: "completed",
          converted_market_purchase_id: purchase.id,
          converted_at: new Date().toISOString(),
        })
        .eq("id", list.id)
        .eq("family_id", familyId);

      if (listUpdateError) throw listUpdateError;
    }
  }

  async function handleGroupConversionSubmit(list: ShoppingListWithItems, groupItems: ShoppingListItem[], groupKey: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingId(`convert-${list.id}-${groupKey}`);
    setError(null);

    try {
      await convertItemsToMarketPurchase(list, groupItems, new FormData(event.currentTarget), groupKey);
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo convertir este grupo en compra real de Mercado."));
    } finally {
      setLoadingId(null);
    }
  }

  if (!lists.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay listas de compras. Crea una lista manual vacía o genera una lista desde menús y stock.</p>;
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {lists.map((list) => {
        const pending = list.items.filter((item) => !item.is_purchased).length;
        const purchased = list.items.filter((item) => item.is_purchased).length;
        const convertedItems = list.items.filter((item) => item.converted_to_market_item_id).length;
        const groups = list.items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
          const key = vendorKey(item.preferred_vendor);
          acc[key] = [...(acc[key] ?? []), item];
          return acc;
        }, {});
        return (
          <div key={list.id} className="min-w-[88vw] max-w-[88vw] snap-start rounded-3xl border bg-white p-4 shadow-sm sm:min-w-[560px] sm:max-w-[560px] xl:min-w-[780px] xl:max-w-[780px]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{list.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{statusLabel(list.status)}</span>
                  {convertedItems ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{convertedItems} en Mercado/stock</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(list.period_start)} → {formatDate(list.period_end)} · {pending} pendientes · {purchased} comprados · {convertedItems} convertidos
                </p>
                {list.notes ? <p className="mt-2 text-sm text-muted-foreground">{list.notes}</p> : null}
              </div>
              {list.status !== "completed" ? (
                <Button type="button" variant="outline" size="sm" disabled={loadingId === list.id} onClick={() => completeList(list.id)}>
                  {loadingId === list.id ? "Cerrando..." : "Marcar completada"}
                </Button>
              ) : null}
            </div>

            <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {Object.entries(groups).map(([groupKey, groupItems]) => {
                const convertibleItems = purchasedItemsForGroup(groupItems);
                const formKey = `${list.id}_${groupKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
                return (
                  <section key={groupKey} className="min-w-[80vw] snap-start rounded-2xl border bg-slate-50 p-4 sm:min-w-[480px] xl:min-w-[620px]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="font-semibold">{groupKey}</h4>
                        <p className="text-xs text-muted-foreground">{groupItems.length} productos · {convertibleItems.length} listos para convertir</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {groupItems.map((item) => (
                        <div key={item.id} className={`rounded-2xl border bg-white p-4 ${item.is_purchased ? "opacity-90" : ""}`}>
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`font-semibold ${item.is_purchased ? "line-through" : ""}`}>{item.product_name}</p>
                                <span className={`rounded-full px-2 py-1 text-xs ${priorityClass(item.priority)}`}>{getShoppingPriorityLabel(item.priority)}</span>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{getShoppingSourceLabel(item.source)}</span>
                                {item.product_id ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">Producto maestro</span> : null}
                                {item.converted_to_market_item_id ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">En stock</span> : null}
                                {hasActualData(item) && !item.converted_to_market_item_id ? <span className="rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-700">Datos reales</span> : null}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{item.category_name ?? "Sin categoría"}</p>
                              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs text-muted-foreground">Necesario</p>
                                  <p className="font-medium">{item.needed_quantity ?? "N/A"} {item.unit}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs text-muted-foreground">Stock actual</p>
                                  <p className="font-medium">{item.current_stock_quantity ?? "N/A"} {item.unit}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs text-muted-foreground">Comprar</p>
                                  <p className="font-semibold">{item.suggested_purchase_quantity} {item.unit}</p>
                                </div>
                              </div>
                              {item.actual_purchase_quantity && item.actual_total_price !== null ? (
                                <p className="mt-3 text-xs text-muted-foreground">
                                  Real comprado: {item.actual_purchase_quantity} {item.actual_unit ?? item.unit} · {formatCurrency(Number(item.actual_total_price))}
                                </p>
                              ) : null}
                              {item.notes ? <p className="mt-3 text-xs text-muted-foreground">{item.notes}</p> : null}
                            </div>

                            {!item.converted_to_market_item_id ? (
                              <div className="flex flex-col gap-2 sm:min-w-48">
                                <Button type="button" variant={item.is_purchased ? "ghost" : "outline"} size="sm" disabled={loadingId === item.id} onClick={() => togglePurchased(item.id, item.is_purchased)}>
                                  {loadingId === item.id ? "Actualizando..." : item.is_purchased ? "Reabrir" : "Marcar comprado"}
                                </Button>
                                {!item.product_id ? (
                                  <Button type="button" variant="outline" size="sm" disabled={loadingId === `create-product-${item.id}`} onClick={() => createProductFromItem(item)}>
                                    {loadingId === `create-product-${item.id}` ? "Creando..." : "Crear producto maestro"}
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          {!item.converted_to_market_item_id ? (
                            <form className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); updateItemProduct(item, new FormData(event.currentTarget)); }}>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground" htmlFor={`product-id-${item.id}`}>Asociar producto maestro</label>
                                <Select id={`product-id-${item.id}`} name={`product_id_${item.id}`} defaultValue={item.product_id ?? ""}>
                                  <option value="">Sin producto maestro</option>
                                  {productOptions.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground" htmlFor={`preferred-vendor-${item.id}`}>Lugar/proveedor sugerido</label>
                                <Input id={`preferred-vendor-${item.id}`} name={`preferred_vendor_${item.id}`} defaultValue={item.preferred_vendor ?? ""} placeholder="Ej.: D1, Plaza, Éxito" />
                              </div>
                              <Button className="self-end" type="submit" variant="outline" disabled={loadingId === `link-${item.id}`}>
                                {loadingId === `link-${item.id}` ? "Guardando..." : "Guardar"}
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {convertibleItems.length ? (
                      <form className="mt-5 space-y-4 rounded-2xl border bg-white p-4" onSubmit={(event) => handleGroupConversionSubmit(list, groupItems, groupKey, event)}>
                        <div>
                          <h5 className="font-semibold">Convertir este grupo a compra real</h5>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Convierte solo los productos comprados de este lugar. Esto crea una compra de Mercado y actualiza stock para estos ítems.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor={`market-period-${formKey}`}>Quincena de Mercado</label>
                            <Select id={`market-period-${formKey}`} name={`market_period_id_${formKey}`} defaultValue="" required>
                              <option value="">Selecciona quincena</option>
                              {marketPeriods.map((period) => <option key={period.id} value={period.id}>{period.name} · {period.starts_on} a {period.ends_on}</option>)}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor={`purchased-on-${formKey}`}>Fecha real de compra</label>
                            <Input id={`purchased-on-${formKey}`} name={`purchased_on_${formKey}`} type="date" defaultValue={today} max={today} required />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor={`vendor-${formKey}`}>Lugar/proveedor</label>
                            <Input id={`vendor-${formKey}`} name={`vendor_${formKey}`} defaultValue={groupKey === "Sin lugar definido" ? "" : groupKey} placeholder="Ej.: D1, Éxito, plaza" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor={`invoice-${formKey}`}>Factura opcional</label>
                            <Select id={`invoice-${formKey}`} name={`invoice_id_${formKey}`} defaultValue="">
                              <option value="">Sin factura</option>
                              {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_code}</option>)}
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-medium">Datos reales de productos comprados</p>
                          {convertibleItems.map((item) => (
                            <div key={item.id} className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">Sugerido: {item.suggested_purchase_quantity} {item.unit}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground" htmlFor={`actual-quantity-${item.id}`}>Cantidad real</label>
                                <Input id={`actual-quantity-${item.id}`} name={`actual_quantity_${item.id}`} type="number" min="0.001" step="0.001" defaultValue={item.actual_purchase_quantity ?? item.suggested_purchase_quantity} required />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground" htmlFor={`actual-unit-${item.id}`}>Unidad real</label>
                                <Input id={`actual-unit-${item.id}`} name={`actual_unit_${item.id}`} defaultValue={item.actual_unit ?? item.unit} required />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground" htmlFor={`actual-price-${item.id}`}>Precio total real</label>
                                <Input id={`actual-price-${item.id}`} name={`actual_total_price_${item.id}`} type="number" min="0" step="1" defaultValue={item.actual_total_price ?? ""} required />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor={`notes-${formKey}`}>Notas de conversión</label>
                          <Input id={`notes-${formKey}`} name={`conversion_notes_${formKey}`} placeholder="Ej.: factura parcial, compra presencial, oferta aplicada" />
                        </div>

                        <Button className="w-full" disabled={loadingId === `convert-${list.id}-${groupKey}`}>
                          {loadingId === `convert-${list.id}-${groupKey}` ? "Convirtiendo..." : `Convertir ${convertibleItems.length} producto(s) de ${groupKey}`}
                        </Button>
                      </form>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
