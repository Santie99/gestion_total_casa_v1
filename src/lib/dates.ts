export function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
    monthStart: toDateInputValue(start),
    monthInput: toMonthInputValue(start),
    label: new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(start),
  };
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toMonthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function monthInputToMonthStart(value: string) {
  return `${value}-01`;
}
