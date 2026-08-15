import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { createCategory, listCategories, updateCategory } from '@/services/categories'
import { queryKeys } from '@/lib/queryKeys'
import type { Category, CategoryType } from '@/types'

export function useCategories(type?: CategoryType) {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: [...queryKeys.categories(family?.id), type],
    queryFn: () => listCategories(family!.id, type),
    enabled: !!family,
  })

  return { categories: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

/** Invalidates every type-suffixed categories query (['categories', familyId, 'expense'|'income'|undefined]) at once. */
function useInvalidateCategories() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.categories(family?.id), exact: false })
}

export function useCreateCategory() {
  const { family } = useFamily()
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (input: Pick<Category, 'name' | 'type' | 'icon' | 'color' | 'parent_id'>) =>
      createCategory(family!.id, input),
    onSuccess: invalidate,
  })
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'is_active'>> }) =>
      updateCategory(id, updates),
    onSuccess: invalidate,
  })
}
