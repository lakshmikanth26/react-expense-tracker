import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecurringTransaction } from '@/types'

// Mock the Supabase client used by listRecurringTransactions / updateRecurringTransaction.
const mockRow: RecurringTransaction = {
  id: 'r1',
  family_id: 'fam1',
  member_id: null,
  category_id: null,
  account_id: 'acc1',
  transfer_to_account_id: null,
  goal_id: null,
  type: 'expense',
  amount: '25000',
  description: 'Home loan EMI',
  frequency: 'monthly',
  interval: 1,
  start_date: '2026-05-20',
  end_date: null,
  day_of_month: 20,
  next_run_date: '2026-05-20',
  last_generated_date: null,
  is_active: true,
  created_at: '2026-05-20T00:00:00Z',
  updated_at: '2026-05-20T00:00:00Z',
} as RecurringTransaction

const updateCalls: Array<{ id: string; updates: Record<string, unknown> }> = []

vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table !== 'recurring_transactions') throw new Error(`unexpected table ${table}`)
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [mockRow], error: null }),
            }),
          }),
          update: (updates: Record<string, unknown>) => ({
            eq: (_col: string, id: string) => ({
              select: () => ({
                single: () => {
                  updateCalls.push({ id, updates })
                  Object.assign(mockRow, updates)
                  return Promise.resolve({ data: { ...mockRow }, error: null })
                },
              }),
            }),
          }),
        }
      },
    },
  }
})

const createTransactionCalls: Array<{ transaction_date: string }> = []

vi.mock('./transactions', () => ({
  createTransaction: (input: { transaction_date: string }) => {
    createTransactionCalls.push(input)
    return Promise.resolve({ id: `tx-${createTransactionCalls.length}`, ...input })
  },
}))

describe('generateDueRecurringTransactions', () => {
  beforeEach(() => {
    createTransactionCalls.length = 0
    updateCalls.length = 0
    mockRow.next_run_date = '2026-05-20'
    mockRow.last_generated_date = null
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 25)) // July 25, 2026 (local time, month is 0-indexed)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('backfills every missed monthly occurrence between next_run_date and today, not just one', async () => {
    const { generateDueRecurringTransactions } = await import('./recurring')

    const count = await generateDueRecurringTransactions('fam1')

    expect(count).toBe(3)
    expect(createTransactionCalls.map((c) => c.transaction_date)).toEqual(['2026-05-20', '2026-06-20', '2026-07-20'])

    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0].updates.next_run_date).toBe('2026-08-20')
    expect(updateCalls[0].updates.last_generated_date).toBe('2026-07-25')
  })

  it('is idempotent: re-running after next_run_date has advanced past today generates nothing further', async () => {
    const { generateDueRecurringTransactions } = await import('./recurring')

    await generateDueRecurringTransactions('fam1')
    createTransactionCalls.length = 0
    updateCalls.length = 0

    // mockRow.next_run_date is now 2026-08-20, which is after "today" (2026-07-25)
    const count = await generateDueRecurringTransactions('fam1')

    expect(count).toBe(0)
    expect(createTransactionCalls).toHaveLength(0)
  })

  it('warns and keeps catching up (rather than skipping ahead) when a row is more than the safety cap behind', async () => {
    mockRow.frequency = 'daily'
    mockRow.interval = 1
    mockRow.next_run_date = '2026-01-01' // ~200 days before the faked "today" of 2026-07-25
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { generateDueRecurringTransactions } = await import('./recurring')
    const count = await generateDueRecurringTransactions('fam1')

    expect(count).toBe(24) // MAX_CATCH_UP_OCCURRENCES
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toMatch(/catch-up cap/)
    // Still behind schedule — did not skip ahead to "today", so the next run continues catching up.
    expect(updateCalls[0].updates.next_run_date).toBe('2026-01-25')

    warnSpy.mockRestore()
    mockRow.frequency = 'monthly'
    mockRow.interval = 1
  })
})
