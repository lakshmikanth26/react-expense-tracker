import { useQuery } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { listTransactionsForRange } from '@/services/transactions'

export function useYearTransactions(year: number) {
  const { family } = useFamily()
  const start = `${year}-01-01`
  const end = `${year + 1}-01-01`

  const query = useQuery({
    queryKey: ['transactions', 'year', family?.id, year],
    queryFn: () => listTransactionsForRange(family!.id, start, end),
    enabled: !!family,
  })

  return { transactions: query.data ?? [], isLoading: query.isLoading }
}
