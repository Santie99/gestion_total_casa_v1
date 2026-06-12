export type ReportPrimitive = string | number | boolean | null | undefined;

export type CsvRow = Record<string, ReportPrimitive>;

export type ReportMonthRange = {
  monthInput: string;
  monthStart: string;
  start: string;
  end: string;
  label: string;
};

export type ReportSummary = {
  income: number;
  manualExpenses: number;
  marketExpenses: number;
  carExpenses: number;
  consolidatedExpenses: number;
  netFlow: number;
  savingsRate: number;
};

export type CategoryBreakdownRow = {
  name: string;
  amount: number;
  percentage: number;
};

export type VendorReportRow = {
  vendor: string;
  purchaseCount: number;
  totalAmount: number;
  percentage: number;
};

export type ProductReportRow = {
  productName: string;
  categoryName: string | null;
  quantity: number;
  unit: string;
  totalAmount: number;
  averageUnitPrice: number | null;
};

export type CarCategoryReportRow = {
  category: string;
  amount: number;
  count: number;
  percentage: number;
};

export type MonthlyHistoryRow = {
  monthStart: string;
  label: string;
  income: number;
  manualExpenses: number;
  marketExpenses: number;
  carExpenses: number;
  consolidatedExpenses: number;
  netFlow: number;
  savingsRate: number;
};

export type AuditRecord = {
  id: string;
  module: string;
  title: string;
  detail: string;
  amount: number | null;
  status: string | null;
  occurredOn: string | null;
  createdAt: string | null;
};
