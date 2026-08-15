import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import {
  createTransaction,
  deleteTransaction,
  duplicateTransaction,
  listRecentTransactions,
  listTransactions,
  updateTransaction,
  type TransactionFilters,
  type TransactionInput,
} from '@/services/transactions'
import { queryKeys } from '@/lib/queryKeys'
import type { Transaction } from '@/types'

export function useRecentTransactions(limit = 5) {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: queryKeys.recentTransactions(family?.id),
    queryFn: () => listRecentTransactions(family!.id, limit),
    enabled: !!family,
  })
  return { transactions: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

export function useTransactionsList(
  filters: TransactionFilters = {},
  options: { limit?: number; offset?: number } = {}
) {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: queryKeys.transactionsList(family?.id, { filters, options }),
    queryFn: () => listTransactions(family!.id, filters, options),
    enabled: !!family,
  })
  return {
    transactions: query.data?.transactions ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  }
}

/** Invalidates every screen a transaction write can affect: lists, recents, and account balances. */
function useInvalidateAfterTransactionWrite() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts(family?.id) })
  }
}

export function useCreateTransaction() {
  const invalidate = useInvalidateAfterTransactionWrite()
  return useMutation({
    mutationFn: (input: TransactionInput) => createTransaction(input),
    onSuccess: invalidate,
  })
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateAfterTransactionWrite()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) => updateTransaction(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateAfterTransactionWrite()
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: invalidate,
  })
}

export function useDuplicateTransaction() {
  const invalidate = useInvalidateAfterTransactionWrite()
  return useMutation({
    mutationFn: (source: Transaction) => duplicateTransaction(source),
    onSuccess: invalidate,
  })
}
