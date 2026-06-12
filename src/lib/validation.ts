export function normalizeTextValue(value: FormDataEntryValue | string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

export function normalizeOptionalText(value: FormDataEntryValue | string | number | null | undefined) {
  const normalized = normalizeTextValue(value);
  return normalized.length > 0 ? normalized : null;
}

export function requireTextValue(value: FormDataEntryValue | string | number | null | undefined, message: string) {
  const normalized = normalizeTextValue(value);
  if (!normalized) throw new Error(message);
  return normalized;
}

export function parsePositiveNumber(value: FormDataEntryValue | string | number | null | undefined, message: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(message);
  return parsed;
}

export function parseNonNegativeNumber(value: FormDataEntryValue | string | number | null | undefined, message: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(message);
  return parsed;
}

export function requireIsoDateValue(value: FormDataEntryValue | string | null | undefined, message: string) {
  const normalized = normalizeTextValue(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw new Error(message);
  return normalized;
}

export function isFutureIsoDate(dateValue: string, todayValue: string) {
  return dateValue > todayValue;
}

export function getSafeSelectValue(value: FormDataEntryValue | string | null | undefined, allowedValues: string[], fallback: string) {
  const normalized = normalizeTextValue(value);
  return allowedValues.includes(normalized) ? normalized : fallback;
}
