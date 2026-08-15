import { useQuery } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { listAllTransactions, listTransactionAmountsSince, listTransactionsForRange } from '@/services/transactions'
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

/** All-time savings transactions with category relations, for the Home page's all-time category breakdown. */
export function useAllTimeSavingsTransactions() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: ['transactions', 'all-time-savings', family?.id],
    queryFn: () => listAllTransactions(family!.id, { type: 'savings' }),
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
