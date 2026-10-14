// Due dates are calendar dates without a time of day: the API stores them as
// midnight UTC, so they must be read back in UTC or they shift by one day in
// time zones behind UTC.

export function toDateInputValue(dueDate: string | null): string {
  return dueDate ? dueDate.slice(0, 10) : "";
}

export function formatDueDate(dueDate: string, locale?: string): string {
  return new Date(dueDate).toLocaleDateString(locale, { timeZone: "UTC" });
}
