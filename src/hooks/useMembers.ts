import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { addFamilyMember, listFamilyMembers, updateFamilyMember } from '@/services/family'
import { queryKeys } from '@/lib/queryKeys'
import type { FamilyMember } from '@/types'

export function useMembers() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: queryKeys.members(family?.id),
    queryFn: () => listFamilyMembers(family!.id),
    enabled: !!family,
  })

  return { members: (query.data ?? []).filter((m) => m.is_active), isLoading: query.isLoading, error: query.error }
}

/** Active + inactive members, for the Settings management list (shares the same query cache as useMembers). */
export function useAllMembers() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: queryKeys.members(family?.id),
    queryFn: () => listFamilyMembers(family!.id),
    enabled: !!family,
  })

  return { members: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

function useInvalidateMembers() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.members(family?.id) })
}

export function useAddMember() {
  const { family } = useFamily()
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: (name: string) => addFamilyMember(family!.id, name),
    onSuccess: invalidate,
  })
}

export function useUpdateMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<FamilyMember, 'name' | 'avatar_url' | 'is_active'>> }) =>
      updateFamilyMember(id, updates),
    onSuccess: invalidate,
  })
}
