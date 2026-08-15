import { useQuery } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { listAccounts } from '@/services/accounts'
import { queryKeys } from '@/lib/queryKeys'

export function useAccounts() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: queryKeys.accounts(family?.id),
    queryFn: () => listAccounts(family!.id),
    enabled: !!family,
  })

  return { accounts: query.data ?? [], isLoading: query.isLoading, error: query.error }
}
