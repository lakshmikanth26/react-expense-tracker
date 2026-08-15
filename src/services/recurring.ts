import { supabase } from '@/lib/supabase'
import type { RecurringTransaction } from '@/types'
import { advanceDateKey, todayKey } from '@/lib/dates'
import { createTransaction } from './transactions'

export async function listRecurringTransactions(familyId: string): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('family_id', familyId)
    .order('next_run_date', { ascending: true })
  if (error) throw error
  return data as RecurringTransaction[]
}

export interface RecurringTransactionInput {
  family_id: string
  member_id: string | null
  category_id: string | null
  account_id: string | null
  transfer_to_account_id: string | null
  goal_id: string | null
  type: RecurringTransaction['type']
  amount: number
  description: string | null
  frequency: RecurringTransaction['frequency']
  interval: number
  start_date: string
  end_date: string | null
  day_of_month: number | null
  next_run_date: string
}

export async function createRecurringTransaction(input: RecurringTransactionInput): Promise<RecurringTransaction> {
  const { data, error } = await supabase.from('recurring_transactions').insert(input).select().single()
  if (error) throw error
  return data as RecurringTransaction
}

export async function updateRecurringTransaction(
  id: string,
  updates: Partial<RecurringTransactionInput & { is_active: boolean; last_generated_date: string }>
): Promise<RecurringTransaction> {
  const { data, error } = await supabase.from('recurring_transactions').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as RecurringTransaction
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
  if (error) throw error
}

const MAX_CATCH_UP_OCCURRENCES = 24

/**
 * Generates any transactions a recurring definition is due for, catching up on
 * missed occurrences (e.g. the app wasn't opened for two months) up to a safety
 * cap. There is no server-side scheduler in this static-hosted app — this runs
 * once per session, client-side, when a signed-in family member opens the app.
 * Idempotent in the common case: next_run_date only ever advances past "today"
 * once these transactions are persisted, so re-running finds nothing due.
 */
export async function generateDueRecurringTransactions(familyId: string): Promise<number> {
  const today = todayKey()
  const due = (await listRecurringTransactions(familyId)).filter(
    (r) => r.is_active && r.next_run_date <= today && (!r.end_date || r.next_run_date <= r.end_date)
  )

  let generatedCount = 0

  for (const recurring of due) {
    let nextRunDate = recurring.next_run_date
    let iterations = 0

    while (nextRunDate <= today && (!recurring.end_date || nextRunDate <= recurring.end_date) && iterations < MAX_CATCH_UP_OCCURRENCES) {
      await createTransaction({
        family_id: recurring.family_id,
        member_id: recurring.member_id,
        category_id: recurring.category_id,
        account_id: recurring.account_id,
        transfer_to_account_id: recurring.transfer_to_account_id,
        goal_id: recurring.goal_id ?? null,
        type: recurring.type,
        amount: Number(recurring.amount),
        transaction_date: nextRunDate,
        description: recurring.description,
        notes: null,
        merchant: null,
        payment_method: null,
      })
      generatedCount += 1
      nextRunDate = advanceDateKey(nextRunDate, recurring.frequency, recurring.interval)
      iterations += 1
    }

    const stillDue = nextRunDate <= today && (!recurring.end_date || nextRunDate <= recurring.end_date)
    if (iterations >= MAX_CATCH_UP_OCCURRENCES && stillDue) {
      console.warn(
        `generateDueRecurringTransactions: "${recurring.description ?? recurring.id}" (${recurring.id}) hit the ` +
          `${MAX_CATCH_UP_OCCURRENCES}-occurrence catch-up cap and is still behind schedule (next_run_date=${nextRunDate}). ` +
          `It will keep catching up on subsequent runs instead of skipping ahead.`
      )
    }

    await updateRecurringTransaction(recurring.id, { next_run_date: nextRunDate, last_generated_date: today })
  }

  return generatedCount
}
