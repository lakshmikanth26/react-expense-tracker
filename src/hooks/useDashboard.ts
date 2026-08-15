import { useQuery } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { listAllTransactionAmounts, listTransactionAmountsSince, listTransactionsForRange } from '@/services/transactions'
import { addMonths, endOfMonthKeyExclusive, startOfMonthKey } from '@/lib/dates'

export function useMonthTransactions(monthKey: string) {
  const { family } = useFamily()
  const start = startOfMonthKey(monthKey)
  const end = endOfMonthKeyExclusive(monthKey)

  const query = useQuery({
    queryKey: ['transactions', 'month', family?.id, start],
    queryFn: () => listTransactionsForRange(family!.id, start, end),
    enabled: !!family,
  })

  return { transactions: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

/** All-time totals across every transaction the family has ever logged, for the Home page summary. */
export function useAllTimeTransactionAmounts() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: ['transactions', 'all-time', family?.id],
    queryFn: () => listAllTransactionAmounts(family!.id),
    enabled: !!family,
  })

  return { transactions: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

export function useMonthlyTrend(monthKey: string, monthsBack: number) {
  const { family } = useFamily()
  const earliest = addMonths(startOfMonthKey(monthKey), -(monthsBack - 1))

  const query = useQuery({
    queryKey: ['transactions', 'trend', family?.id, earliest, monthKey],
    queryFn: () => listTransactionAmountsSince(family!.id, earliest),
    enabled: !!family,
  })

  return { transactions: query.data ?? [], isLoading: query.isLoading, error: query.error, earliestMonthKey: earliest }
}
