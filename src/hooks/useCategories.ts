import { useQuery } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { listCategories } from '@/services/categories'
import { queryKeys } from '@/lib/queryKeys'
import type { CategoryType } from '@/types'

export function useCategories(type?: CategoryType) {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: [...queryKeys.categories(family?.id), type],
    queryFn: () => listCategories(family!.id, type),
    enabled: !!family,
  })

  return { categories: query.data ?? [], isLoading: query.isLoading, error: query.error }
}
