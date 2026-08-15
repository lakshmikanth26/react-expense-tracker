import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getMyFamilyMembership } from '@/services/family'
import { queryKeys } from '@/lib/queryKeys'

export function useFamily() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: queryKeys.family(user?.id),
    queryFn: () => getMyFamilyMembership(user!.id),
    enabled: !!user,
  })

  return {
    family: query.data?.family ?? null,
    member: query.data?.member ?? null,
    isLoading: query.isLoading,
    hasFamily: !!query.data,
    error: query.error,
  }
}

export function useInvalidateFamily() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.family(user?.id) })
}
