import { advanceDateKey, todayKey } from './dates'

/**
 * Reducing-balance amortization math, entirely client-side and read-only: it never
 * writes anything back. current_balance itself is the source of truth (kept correct
 * by the recompute_loan_balance DB trigger — see prisma/migrations/20260101000011_loans);
 * this just projects forward from that balance to answer "how much longer, and at what
 * total cost" for display purposes (Loans page, per-loan cards).
 */
export interface AmortizationSummary {
  /** null when the EMI doesn't even cover the monthly interest — the loan would never be paid off. */
  monthsRemaining: number | null
  /** ISO 'YYYY-MM-DD', null under the same non-amortizing condition as monthsRemaining. */
  payoffDate: string | null
  totalInterestRemaining: number | null
  totalPaymentRemaining: number | null
}

export function computeAmortizationSummary(
  currentBalance: number,
  annualInterestRatePct: number,
  emiAmount: number,
  fromDate?: string
): AmortizationSummary {
  if (currentBalance <= 0) {
    return { monthsRemaining: 0, payoffDate: fromDate ?? todayKey(), totalInterestRemaining: 0, totalPaymentRemaining: 0 }
  }

  const monthlyRate = annualInterestRatePct / 12 / 100

  if (monthlyRate === 0) {
    const monthsRemaining = Math.ceil(currentBalance / emiAmount)
    const totalPaymentRemaining = monthsRemaining * emiAmount
    return {
      monthsRemaining,
      payoffDate: advanceDateKey(fromDate ?? todayKey(), 'monthly', monthsRemaining),
      totalInterestRemaining: totalPaymentRemaining - currentBalance,
      totalPaymentRemaining,
    }
  }

  // If the EMI doesn't even cover one month's interest, the balance only grows —
  // there is no finite payoff date under the current terms.
  if (emiAmount <= currentBalance * monthlyRate) {
    return { monthsRemaining: null, payoffDate: null, totalInterestRemaining: null, totalPaymentRemaining: null }
  }

  const monthsRemaining = Math.ceil(
    Math.log(emiAmount / (emiAmount - currentBalance * monthlyRate)) / Math.log(1 + monthlyRate)
  )
  const totalPaymentRemaining = monthsRemaining * emiAmount
  const totalInterestRemaining = totalPaymentRemaining - currentBalance

  return {
    monthsRemaining,
    payoffDate: advanceDateKey(fromDate ?? todayKey(), 'monthly', monthsRemaining),
    totalInterestRemaining,
    totalPaymentRemaining,
  }
}
