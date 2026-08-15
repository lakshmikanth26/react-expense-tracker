import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { createLoan, deleteLoan, listLoans, updateLoan, type LoanInput } from '@/services/loans'

function loansQueryKey(familyId: string | undefined) {
  return ['loans', familyId] as const
}

export function useLoans() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: loansQueryKey(family?.id),
    queryFn: () => listLoans(family!.id),
    enabled: !!family,
  })
  return { loans: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

function useInvalidateLoans() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: loansQueryKey(family?.id) })
}

export function useCreateLoan() {
  const invalidate = useInvalidateLoans()
  return useMutation({ mutationFn: (input: LoanInput) => createLoan(input), onSuccess: invalidate })
}

export function useUpdateLoan() {
  const invalidate = useInvalidateLoans()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<LoanInput & { is_closed: boolean }> }) => updateLoan(id, updates),
    onSuccess: invalidate,
  })
}

export function useDeleteLoan() {
  const invalidate = useInvalidateLoans()
  return useMutation({ mutationFn: (id: string) => deleteLoan(id), onSuccess: invalidate })
}
