/**
 * Date Utilities for Local Timezone (Peru GMT-5 / Local Browser)
 * Prevents UTC offset shifts when converting between Date objects and "YYYY-MM-DD" strings.
 */

/**
 * Formats a Date object as "YYYY-MM-DD" using local year, month, and day.
 * Avoids toISOString() which converts to UTC and shifts dates back 1 day in negative timezones.
 */
export function formatLocalIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns tomorrow's date formatted as "YYYY-MM-DD" in local time.
 */
export function getLocalTomorrowIso(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalIsoDate(tomorrow);
}

/**
 * Safely parses a "YYYY-MM-DD" string into a local Date object without UTC offset shift.
 * Standard `new Date("YYYY-MM-DD")` treats the string as UTC midnight, which in GMT-5
 * results in 7:00 PM the previous day. This function constructs local midnight.
 */
export function parseLocalIsoDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  return new Date(dateStr);
}

/**
 * Formats a "YYYY-MM-DD" string into a human-readable local date (e.g. "miércoles, 4 de noviembre").
 */
export function formatHumanLocalDate(dateStr: string): string {
  const d = parseLocalIsoDate(dateStr);
  return d.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
