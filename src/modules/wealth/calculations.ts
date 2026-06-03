import type { Asset, AssetType, Debt, DebtStatus, DebtType, WealthSummary } from "./types";

export function sumActiveDebts(debts: Debt[]) {
  return debts.filter((debt) => debt.status === "active").reduce((total, debt) => total + Number(debt.current_balance ?? 0), 0);
}

export function sumActiveAssets(assets: Asset[]) {
  return assets.filter((asset) => asset.status === "active").reduce((total, asset) => total + Number(asset.estimated_value ?? 0), 0);
}

export function sumMonthlyDebtPayments(debts: Debt[]) {
  return debts
    .filter((debt) => debt.status === "active")
    .reduce((total, debt) => total + Number(debt.monthly_payment ?? 0), 0);
}

export function getWealthSummary(debts: Debt[], assets: Asset[]): WealthSummary {
  const totalAssets = sumActiveAssets(assets);
  const totalDebts = sumActiveDebts(debts);
  const netWorth = totalAssets - totalDebts;
  const monthlyDebtPayments = sumMonthlyDebtPayments(debts);
  const debtToAssetRatio = totalAssets > 0 ? totalDebts / totalAssets : 0;

  return { totalAssets, totalDebts, netWorth, monthlyDebtPayments, debtToAssetRatio };
}

export function getDebtToIncomeRatio(monthlyDebtPayments: number, monthlyIncome: number) {
  return monthlyIncome > 0 ? monthlyDebtPayments / monthlyIncome : 0;
}

export function getDebtTypeLabel(type: DebtType) {
  const labels: Record<DebtType, string> = {
    credit_card: "Tarjeta de crédito",
    personal_loan: "Crédito libre inversión",
    vehicle_loan: "Crédito vehículo",
    mortgage: "Crédito hipotecario",
    family_loan: "Préstamo familiar",
    other: "Otro",
  };

  return labels[type];
}

export function getDebtStatusLabel(status: DebtStatus) {
  const labels: Record<DebtStatus, string> = {
    active: "Activa",
    paid: "Pagada",
    paused: "Pausada",
  };

  return labels[status];
}

export function getAssetTypeLabel(type: AssetType) {
  const labels: Record<AssetType, string> = {
    cash: "Efectivo",
    bank_account: "Cuenta bancaria",
    investment: "Inversión",
    vehicle: "Vehículo",
    real_estate: "Inmueble",
    home_item: "Bien relevante del hogar",
    other: "Otro",
  };

  return labels[type];
}

export function groupAssetsByType(assets: Asset[]) {
  const map = new Map<AssetType, number>();

  for (const asset of assets.filter((item) => item.status === "active")) {
    map.set(asset.asset_type, (map.get(asset.asset_type) ?? 0) + Number(asset.estimated_value ?? 0));
  }

  return Array.from(map.entries())
    .map(([type, amount]) => ({ type, label: getAssetTypeLabel(type), amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupDebtsByType(debts: Debt[]) {
  const map = new Map<DebtType, number>();

  for (const debt of debts.filter((item) => item.status === "active")) {
    map.set(debt.debt_type, (map.get(debt.debt_type) ?? 0) + Number(debt.current_balance ?? 0));
  }

  return Array.from(map.entries())
    .map(([type, amount]) => ({ type, label: getDebtTypeLabel(type), amount }))
    .sort((a, b) => b.amount - a.amount);
}
