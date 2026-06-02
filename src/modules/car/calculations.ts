import type { CarExpense, CarExpenseCategory, CarReminder } from "./types";

export const carCategoryLabels: Record<CarExpenseCategory, string> = {
  gasoline: "Gasolina",
  taxes: "Impuestos",
  maintenance: "Mantenimiento",
  cleaning: "Limpieza",
  inspection: "Revisiones",
  insurance: "Seguro",
  soat: "SOAT",
  tecnomecanica: "Tecnomecánica",
  parking: "Parqueaderos",
  toll: "Peajes",
  fine: "Multas",
  parts: "Repuestos",
  other: "Otros",
};

export const carCategoryOptions = Object.entries(carCategoryLabels).map(([value, label]) => ({ value, label }));

export function sumCarExpenses(expenses: Pick<CarExpense, "amount">[]) {
  return expenses.reduce((total, expense) => total + Number(expense.amount ?? 0), 0);
}

export function groupCarExpensesByCategory(expenses: CarExpense[]) {
  const grouped = expenses.reduce<Record<string, number>>((acc, expense) => {
    const label = carCategoryLabels[expense.category] ?? "Otros";
    acc[label] = (acc[label] ?? 0) + Number(expense.amount ?? 0);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getUpcomingReminders(reminders: CarReminder[]) {
  return reminders
    .filter((reminder) => reminder.status === "pending")
    .sort((a, b) => {
      const dateA = a.due_on ?? "9999-12-31";
      const dateB = b.due_on ?? "9999-12-31";
      return dateA.localeCompare(dateB) || Number(a.due_km ?? 999999999) - Number(b.due_km ?? 999999999);
    });
}
