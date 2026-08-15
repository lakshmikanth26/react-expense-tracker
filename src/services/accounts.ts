import { supabase } from '@/lib/supabase'
import type { Account } from '@/types'

export async function listAccounts(familyId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) throw error
  return data as Account[]
}

export async function createAccount(
  familyId: string,
  input: Pick<Account, 'name' | 'type' | 'opening_balance'>
): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({ family_id: familyId, ...input, current_balance: input.opening_balance })
    .select()
    .single()
  if (error) throw error
  return data as Account
}

export async function updateAccount(
  id: string,
  updates: Partial<Pick<Account, 'name' | 'type' | 'is_active'>>
): Promise<Account> {
  const { data, error } = await supabase.from('accounts').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Account
}
