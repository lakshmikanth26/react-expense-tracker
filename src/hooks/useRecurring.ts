import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  listRecurringTransactions,
  updateRecurringTransaction,
  type RecurringTransactionInput,
} from '@/services/recurring'

function recurringQueryKey(familyId: string | undefined) {
  return ['recurring-transactions', familyId] as const
}

export function useRecurringTransactions() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: recurringQueryKey(family?.id),
    queryFn: () => listRecurringTransactions(family!.id),
    enabled: !!family,
  })
  return { recurring: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

function useInvalidateRecurring() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: recurringQueryKey(family?.id) })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }
}

export function useCreateRecurringTransaction() {
  const invalidate = useInvalidateRecurring()
  return useMutation({ mutationFn: (input: RecurringTransactionInput) => createRecurringTransaction(input), onSuccess: invalidate })
}

export function useUpdateRecurringTransaction() {
  const invalidate = useInvalidateRecurring()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RecurringTransactionInput & { is_active: boolean }> }) =>
      updateRecurringTransaction(id, updates),
    onSuccess: invalidate,
  })
}

export function useDeleteRecurringTransaction() {
  const invalidate = useInvalidateRecurring()
  return useMutation({ mutationFn: (id: string) => deleteRecurringTransaction(id), onSuccess: invalidate })
}
