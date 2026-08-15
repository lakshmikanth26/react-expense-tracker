import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import {
  createSavingsGoal,
  deleteSavingsGoal,
  listSavingsGoals,
  updateSavingsGoal,
  type SavingsGoalInput,
} from '@/services/goals'

function goalsQueryKey(familyId: string | undefined) {
  return ['savings-goals', familyId] as const
}

export function useSavingsGoals() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: goalsQueryKey(family?.id),
    queryFn: () => listSavingsGoals(family!.id),
    enabled: !!family,
  })
  return { goals: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

function useInvalidateGoals() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: goalsQueryKey(family?.id) })
}

export function useCreateSavingsGoal() {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: (input: SavingsGoalInput) => createSavingsGoal(input), onSuccess: invalidate })
}

export function useUpdateSavingsGoal() {
  const invalidate = useInvalidateGoals()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SavingsGoalInput> }) => updateSavingsGoal(id, updates),
    onSuccess: invalidate,
  })
}

export function useDeleteSavingsGoal() {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: (id: string) => deleteSavingsGoal(id), onSuccess: invalidate })
}
