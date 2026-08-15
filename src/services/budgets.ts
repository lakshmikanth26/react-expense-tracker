import { supabase } from '@/lib/supabase'
import type { Budget } from '@/types'

export async function listBudgetsForMonth(familyId: string, monthKey: string): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select('*').eq('family_id', familyId).eq('month', monthKey)
  if (error) throw error
  return data as Budget[]
}

export interface UpsertBudgetInput {
  family_id: string
  category_id: string | null
  month: string
  amount: number
}

/**
 * Postgres treats NULL as distinct from every other NULL in a UNIQUE constraint, so
 * the (family_id, category_id, month) constraint doesn't cover the "overall budget"
 * case (category_id IS NULL) — that's enforced by a separate partial unique index,
 * which PostgREST's upsert(onConflict) can't target directly. Read-then-write instead.
 */
export async function upsertBudget(input: UpsertBudgetInput): Promise<Budget> {
  if (input.category_id === null) {
    const { data: existing, error: selectError } = await supabase
      .from('budgets')
      .select('id')
      .eq('family_id', input.family_id)
      .eq('month', input.month)
      .is('category_id', null)
      .maybeSingle()
    if (selectError) throw selectError

    if (existing) {
      const { data, error } = await supabase.from('budgets').update({ amount: input.amount }).eq('id', existing.id).select().single()
      if (error) throw error
      return data as Budget
    }
  }

  const { data, error } = await supabase
    .from('budgets')
    .upsert(input, { onConflict: 'family_id,category_id,month' })
    .select()
    .single()
  if (error) throw error
  return data as Budget
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}
