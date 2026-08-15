import { supabase } from '@/lib/supabase'
import type { Transaction, TransactionWithRelations } from '@/types'
import { todayKey } from '@/lib/dates'

const RELATIONS_SELECT = `
  *,
  category:categories(id, name, icon, color, type),
  account:accounts!transactions_account_id_fkey(id, name, type),
  transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(id, name, type),
  member:family_members(id, name, avatar_url)
`

export interface TransactionInput {
  family_id: string
  member_id: string | null
  category_id: string | null
  account_id: string | null
  transfer_to_account_id: string | null
  type: Transaction['type']
  amount: number
  transaction_date: string
  description: string | null
  notes: string | null
  merchant: string | null
  payment_method: string | null
}

export async function listRecentTransactions(familyId: string, limit = 5): Promise<TransactionWithRelations[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(RELATIONS_SELECT)
    .eq('family_id', familyId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as TransactionWithRelations[]
}

export interface ListTransactionsOptions {
  limit?: number
  offset?: number
}

export async function listTransactions(
  familyId: string,
  options: ListTransactionsOptions = {}
): Promise<{ transactions: TransactionWithRelations[]; count: number }> {
  const { limit = 50, offset = 0 } = options
  const { data, error, count } = await supabase
    .from('transactions')
    .select(RELATIONS_SELECT, { count: 'exact' })
    .eq('family_id', familyId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return { transactions: data as unknown as TransactionWithRelations[], count: count ?? 0 }
}

export async function getTransaction(id: string): Promise<TransactionWithRelations> {
  const { data, error } = await supabase.from('transactions').select(RELATIONS_SELECT).eq('id', id).single()
  if (error) throw error
  return data as unknown as TransactionWithRelations
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').insert(input).select().single()
  if (error) throw error
  return data as Transaction
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Transaction
}

/** Soft delete — financial history is never hard-deleted from under a family. */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

export async function duplicateTransaction(source: Transaction): Promise<Transaction> {
  return createTransaction({
    family_id: source.family_id,
    member_id: source.member_id,
    category_id: source.category_id,
    account_id: source.account_id,
    transfer_to_account_id: source.transfer_to_account_id,
    type: source.type,
    amount: Number(source.amount),
    transaction_date: todayKey(),
    description: source.description,
    notes: source.notes,
    merchant: source.merchant,
    payment_method: source.payment_method,
  })
}
