import { supabase } from '@/lib/supabase'
import type { SavingsGoal } from '@/types'

export async function listSavingsGoals(familyId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as SavingsGoal[]
}

export interface SavingsGoalInput {
  family_id: string
  name: string
  icon: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
}

export async function createSavingsGoal(input: SavingsGoalInput): Promise<SavingsGoal> {
  const { data, error } = await supabase.from('savings_goals').insert(input).select().single()
  if (error) throw error
  return data as SavingsGoal
}

export async function updateSavingsGoal(id: string, updates: Partial<SavingsGoalInput>): Promise<SavingsGoal> {
  const { data, error } = await supabase.from('savings_goals').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as SavingsGoal
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  if (error) throw error
}
