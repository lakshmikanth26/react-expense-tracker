import { useQuery } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { listFamilyMembers } from '@/services/family'
import { queryKeys } from '@/lib/queryKeys'

export function useMembers() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: queryKeys.members(family?.id),
    queryFn: () => listFamilyMembers(family!.id),
    enabled: !!family,
  })

  return { members: (query.data ?? []).filter((m) => m.is_active), isLoading: query.isLoading, error: query.error }
}
