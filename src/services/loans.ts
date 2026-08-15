import { supabase } from '@/lib/supabase'
import type { Loan } from '@/types'

export async function listLoans(familyId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Loan[]
}

export interface LoanInput {
  family_id: string
  name: string
  icon: string | null
  principal_amount: number
  interest_rate: number
  emi_amount: number
  /** Initialized equal to principal_amount by the caller on create; editable afterward for manual correction. */
  current_balance: number
  start_date: string
}

export async function createLoan(input: LoanInput): Promise<Loan> {
  const { data, error } = await supabase.from('loans').insert(input).select().single()
  if (error) throw error
  return data as Loan
}

export async function updateLoan(id: string, updates: Partial<LoanInput & { is_closed: boolean }>): Promise<Loan> {
  const { data, error } = await supabase.from('loans').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Loan
}

export async function deleteLoan(id: string): Promise<void> {
  const { error } = await supabase.from('loans').delete().eq('id', id)
  if (error) throw error
}
