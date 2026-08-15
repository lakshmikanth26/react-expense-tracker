import { supabase } from '@/lib/supabase'
import type { Family, FamilyMember } from '@/types'

export interface MyFamilyMembership {
  family: Family
  member: FamilyMember
}

/** Returns null when the signed-in user has not created/joined a family yet. */
export async function getMyFamilyMembership(userId: string): Promise<MyFamilyMembership | null> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*, family:families(*)')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { family, ...member } = data as FamilyMember & { family: Family }
  return { family, member: member as FamilyMember }
}

export async function createFamilyWithDefaults(familyName: string, memberName: string, currency = 'INR'): Promise<Family> {
  const { data, error } = await supabase.rpc('create_family_with_defaults', {
    p_family_name: familyName,
    p_member_name: memberName,
    p_currency: currency,
  })
  if (error) throw error
  return data as Family
}

export async function listFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as FamilyMember[]
}

export async function addFamilyMember(familyId: string, name: string): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .insert({ family_id: familyId, name })
    .select()
    .single()
  if (error) throw error
  return data as FamilyMember
}

export async function updateFamilyMember(
  id: string,
  updates: Partial<Pick<FamilyMember, 'name' | 'avatar_url' | 'is_active'>>
): Promise<FamilyMember> {
  const { data, error } = await supabase.from('family_members').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as FamilyMember
}

export async function updateFamily(id: string, updates: Partial<Pick<Family, 'name' | 'currency'>>): Promise<Family> {
  const { data, error } = await supabase.from('families').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Family
}

/** Permanently deletes the family and everything that belongs to it (see delete_my_family RPC). */
export async function deleteMyFamily(familyId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_my_family', { p_family_id: familyId })
  if (error) throw error
}
