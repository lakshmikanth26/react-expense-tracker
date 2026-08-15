import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { deleteBudget, listBudgetsForMonth, upsertBudget, type UpsertBudgetInput } from '@/services/budgets'

function budgetsQueryKey(familyId: string | undefined, monthKey: string) {
  return ['budgets', familyId, monthKey] as const
}

export function useBudgets(monthKey: string) {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: budgetsQueryKey(family?.id, monthKey),
    queryFn: () => listBudgetsForMonth(family!.id, monthKey),
    enabled: !!family,
  })
  return { budgets: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

export function useUpsertBudget(monthKey: string) {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertBudgetInput) => upsertBudget(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey(family?.id, monthKey) }),
  })
}

export function useDeleteBudget(monthKey: string) {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey(family?.id, monthKey) }),
  })
}
