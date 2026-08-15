import { describe, expect, it } from 'vitest'
import { computeAmortizationSummary } from './loan-calculations'

describe('computeAmortizationSummary', () => {
  it('matches hand-computed amortization for the home-loan example (₹7,276,760 @ 7.30% / ₹59,824 EMI)', () => {
    // Hand-computed (Python Decimal, 50-digit precision) by iterating monthsRemaining
    // via the closed-form log formula: n = ceil(log(E / (E - B*r)) / log(1 + r))
    // with r = 7.30/12/100 = 0.00608333..., B = 7276760, E = 59824.
    // n = 223, totalPayment = 223 * 59824 = 13,340,752, totalInterest = 13,340,752 - 7,276,760 = 6,063,992.
    const result = computeAmortizationSummary(7276760, 7.3, 59824, '2026-01-20')
    expect(result.monthsRemaining).toBe(223)
    expect(result.totalPaymentRemaining).toBe(13340752)
    expect(result.totalInterestRemaining).toBe(6063992)
    expect(result.payoffDate).toBe('2044-08-20')
  })

  it('returns nulls when the EMI does not even cover the monthly interest', () => {
    // monthlyRate = 12/12/100 = 0.01; monthly interest on 1,000,000 = 10,000, which
    // an EMI of 9,000 can never cover — the balance would only grow forever.
    const result = computeAmortizationSummary(1000000, 12, 9000, '2026-01-01')
    expect(result.monthsRemaining).toBeNull()
    expect(result.payoffDate).toBeNull()
    expect(result.totalInterestRemaining).toBeNull()
    expect(result.totalPaymentRemaining).toBeNull()
  })

  it('treats an EMI exactly equal to the interest-only payment as never paying off (boundary, not just above it)', () => {
    // monthlyRate = 0.01, interest-only payment on 1,000,000 is exactly 10,000 -> balance never drops.
    const result = computeAmortizationSummary(1000000, 12, 10000, '2026-01-01')
    expect(result.monthsRemaining).toBeNull()
  })

  it('falls back to simple division for a zero-interest loan', () => {
    // No interest: months = ceil(balance / emi) = ceil(120000 / 50000) = 3.
    const result = computeAmortizationSummary(120000, 0, 50000, '2026-01-01')
    expect(result.monthsRemaining).toBe(3)
    expect(result.totalPaymentRemaining).toBe(150000)
    expect(result.totalInterestRemaining).toBe(30000)
    expect(result.payoffDate).toBe('2026-04-01')
  })

  it('reports zero months remaining for an already-closed (zero-balance) loan', () => {
    const result = computeAmortizationSummary(0, 7.3, 59824, '2026-01-20')
    expect(result.monthsRemaining).toBe(0)
    expect(result.totalInterestRemaining).toBe(0)
    expect(result.totalPaymentRemaining).toBe(0)
    expect(result.payoffDate).toBe('2026-01-20')
  })
})
