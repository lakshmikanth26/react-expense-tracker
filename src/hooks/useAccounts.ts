import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { createAccount, listAccounts, updateAccount } from '@/services/accounts'
import { queryKeys } from '@/lib/queryKeys'
import type { Account } from '@/types'

export function useAccounts() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: queryKeys.accounts(family?.id),
    queryFn: () => listAccounts(family!.id),
    enabled: !!family,
  })

  return { accounts: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

function useInvalidateAccounts() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts(family?.id) })
}

export function useCreateAccount() {
  const { family } = useFamily()
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: (input: Pick<Account, 'name' | 'type' | 'opening_balance'>) => createAccount(family!.id, input),
    onSuccess: invalidate,
  })
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<Account, 'name' | 'type' | 'is_active'>> }) =>
      updateAccount(id, updates),
    onSuccess: invalidate,
  })
}
