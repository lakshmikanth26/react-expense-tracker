import { supabase } from '@/lib/supabase'
import type { Category, CategoryType } from '@/types'

export async function listCategories(familyId: string, type?: CategoryType): Promise<Category[]> {
  let query = supabase.from('categories').select('*').eq('family_id', familyId).eq('is_active', true)
  if (type) query = query.eq('type', type)
  const { data, error } = await query.order('name', { ascending: true })
  if (error) throw error
  return data as Category[]
}

export async function createCategory(
  familyId: string,
  input: Pick<Category, 'name' | 'type' | 'icon' | 'color' | 'parent_id'>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ family_id: familyId, ...input })
    .select()
    .single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'is_active'>>
): Promise<Category> {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Category
}
