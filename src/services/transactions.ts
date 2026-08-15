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

export interface TransactionFilters {
  startDate?: string
  endDateExclusive?: string
  /** Pass the selected category plus all of its subcategory ids to include the whole group. */
  categoryIds?: string[]
  /** `null` explicitly means "Family" (transactions with no member assigned). */
  memberId?: string | null
  accountId?: string
  type?: Transaction['type']
  minAmount?: number
  maxAmount?: number
  /** Matches description, merchant, or notes (case-insensitive substring). */
  search?: string
}

export interface ListTransactionsOptions {
  limit?: number
  offset?: number
}

function applyFilters<T>(query: T, filters: TransactionFilters): T {
  // Supabase's PostgrestFilterBuilder methods all return `this`, so chaining through
  // an opaque generic here is safe even though TS can't see the concrete builder type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = query as any
  if (filters.startDate) q = q.gte('transaction_date', filters.startDate)
  if (filters.endDateExclusive) q = q.lt('transaction_date', filters.endDateExclusive)
  if (filters.categoryIds?.length) q = q.in('category_id', filters.categoryIds)
  if (filters.memberId === null) q = q.is('member_id', null)
  else if (filters.memberId) q = q.eq('member_id', filters.memberId)
  if (filters.accountId) q = q.eq('account_id', filters.accountId)
  if (filters.type) q = q.eq('type', filters.type)
  if (filters.minAmount != null) q = q.gte('amount', filters.minAmount)
  if (filters.maxAmount != null) q = q.lte('amount', filters.maxAmount)
  if (filters.search) {
    const escaped = filters.search.replace(/[%,]/g, '')
    q = q.or(`description.ilike.%${escaped}%,merchant.ilike.%${escaped}%,notes.ilike.%${escaped}%`)
  }
  return q as T
}

export async function listTransactions(
  familyId: string,
  filters: TransactionFilters = {},
  options: ListTransactionsOptions = {}
): Promise<{ transactions: TransactionWithRelations[]; count: number }> {
  const { limit = 50, offset = 0 } = options
  let query = supabase
    .from('transactions')
    .select(RELATIONS_SELECT, { count: 'exact' })
    .eq('family_id', familyId)
    .eq('is_deleted', false)
  query = applyFilters(query, filters)
  const { data, error, count } = await query
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return { transactions: data as unknown as TransactionWithRelations[], count: count ?? 0 }
}

/** All transactions in [startDateKey, endDateKeyExclusive), with category details for breakdown charts. */
export async function listTransactionsForRange(
  familyId: string,
  startDateKey: string,
  endDateKeyExclusive: string
): Promise<TransactionWithRelations[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(RELATIONS_SELECT)
    .eq('family_id', familyId)
    .eq('is_deleted', false)
    .gte('transaction_date', startDateKey)
    .lt('transaction_date', endDateKeyExclusive)
    .order('transaction_date', { ascending: false })
  if (error) throw error
  return data as unknown as TransactionWithRelations[]
}

/** Minimal fields only — used to build multi-month trend charts, not for display. */
export async function listTransactionAmountsSince(
  familyId: string,
  sinceDateKey: string
): Promise<Pick<Transaction, 'type' | 'amount' | 'transaction_date' | 'category_id' | 'member_id'>[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date, category_id, member_id')
    .eq('family_id', familyId)
    .eq('is_deleted', false)
    .gte('transaction_date', sinceDateKey)
  if (error) throw error
  return data as Pick<Transaction, 'type' | 'amount' | 'transaction_date' | 'category_id' | 'member_id'>[]
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
