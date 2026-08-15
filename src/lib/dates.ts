/**
 * `transaction_date` is a plain SQL `date` (no time/zone). Treat it as an opaque
 * 'YYYY-MM-DD' key everywhere and only ever construct/read local Date objects —
 * never round-trip through `new Date(isoString)` or `.toISOString()`, both of which
 * go through UTC and can silently shift the day depending on the viewer's timezone.
 */

export function todayKey(): string {
  return toDateKey(new Date())
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

export function currentMonthKey(): string {
  const now = new Date()
  return monthKey(now.getFullYear(), now.getMonth())
}

export function monthKeyOf(dateKey: string): string {
  return `${dateKey.slice(0, 7)}-01`
}

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const total = (y * 12 + (m - 1)) + delta
  const year = Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  return monthKey(year, month)
}

export function formatMonthLabel(key: string): string {
  const date = parseDateKey(key)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function formatDayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export function isSameMonth(dateKey: string, monthKeyValue: string): boolean {
  return monthKeyOf(dateKey) === monthKeyOf(monthKeyValue)
}

export function startOfMonthKey(key: string): string {
  return monthKeyOf(key)
}

export function endOfMonthKeyExclusive(key: string): string {
  return addMonths(monthKeyOf(key), 1)
}
