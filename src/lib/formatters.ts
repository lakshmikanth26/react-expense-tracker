const currencyFormatterCache = new Map<string, Intl.NumberFormat>()

function getCurrencyFormatter(currency: string, maximumFractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${maximumFractionDigits}`
  let formatter = currencyFormatterCache.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits,
      minimumFractionDigits: 0,
    })
    currencyFormatterCache.set(key, formatter)
  }
  return formatter
}

/** Formats using Indian digit grouping (₹1,23,45,678) via Intl — never format by hand. */
export function formatCurrency(amount: number, currency = 'INR', options?: { showDecimals?: boolean }): string {
  const maximumFractionDigits = options?.showDecimals ? 2 : 0
  return getCurrencyFormatter(currency, maximumFractionDigits).format(amount)
}

export function formatCurrencyPrecise(amount: number, currency = 'INR'): string {
  return formatCurrency(amount, currency, { showDecimals: true })
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

export function formatSignedCurrency(amount: number, currency = 'INR'): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`
}
