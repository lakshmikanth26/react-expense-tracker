import { describe, expect, it } from 'vitest'
import { formatCurrency, formatPercent, formatSignedCurrency } from './formatters'

describe('formatCurrency', () => {
  it('uses Indian digit grouping (lakh/crore), not Western thousands', () => {
    expect(formatCurrency(1234567)).toBe('₹12,34,567')
  })

  it('rounds to whole rupees by default', () => {
    expect(formatCurrency(250.5)).toBe('₹251')
  })

  it('shows paise when requested', () => {
    expect(formatCurrency(250.55, undefined, { showDecimals: true })).toBe('₹250.55')
  })
})

describe('formatSignedCurrency', () => {
  it('prefixes positive amounts with a plus sign', () => {
    expect(formatSignedCurrency(500)).toBe('+₹500')
  })

  it('prefixes negative amounts with a minus sign and formats the absolute value', () => {
    expect(formatSignedCurrency(-500)).toBe('-₹500')
  })

  it('shows no sign for zero', () => {
    expect(formatSignedCurrency(0)).toBe('₹0')
  })
})

describe('formatPercent', () => {
  it('formats with one decimal place by default', () => {
    expect(formatPercent(46.734)).toBe('46.7%')
  })
})
