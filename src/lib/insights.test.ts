import { describe, expect, it } from 'vitest'
import { computeInsights } from './insights'
import type { TransactionWithRelations } from '@/types'

function txn(overrides: Partial<TransactionWithRelations>): TransactionWithRelations {
  return {
    id: overrides.id ?? Math.random().toString(36),
    family_id: 'f1',
    member_id: null,
    category_id: null,
    account_id: 'a1',
    transfer_to_account_id: null,
    goal_id: null,
    type: 'expense',
    amount: '0',
    transaction_date: '2026-08-01',
    description: null,
    notes: null,
    merchant: null,
    payment_method: null,
    is_recurring: false,
    recurring_transaction_id: null,
    is_deleted: false,
    created_at: '',
    updated_at: '',
    category: null,
    account: null,
    transfer_to_account: null,
    member: null,
    goal: null,
    ...overrides,
  }
}

describe('computeInsights', () => {
  it('always reports a savings rate insight', () => {
    const insights = computeInsights({
      transactions: [txn({ type: 'income', amount: '1000' })],
      previousTransactions: [],
      budgets: [],
    })
    expect(insights.some((i) => i.text.includes('savings rate'))).toBe(true)
  })

  it('flags a category that increased more than 10% vs last month', () => {
    const insights = computeInsights({
      transactions: [
        txn({ category_id: 'food', amount: '1200', category: { id: 'food', name: 'Food', icon: '🍔', color: null, type: 'expense' } }),
      ],
      previousTransactions: [
        txn({ category_id: 'food', amount: '1000', category: { id: 'food', name: 'Food', icon: '🍔', color: null, type: 'expense' } }),
      ],
      budgets: [],
    })
    expect(insights.some((i) => i.text.includes('Food spending increased'))).toBe(true)
  })

  it('flags overspent budgets', () => {
    const insights = computeInsights({
      transactions: [
        txn({ category_id: 'food', amount: '12000', category: { id: 'food', name: 'Food', icon: '🍔', color: null, type: 'expense' } }),
      ],
      previousTransactions: [],
      budgets: [
        {
          id: 'b1',
          family_id: 'f1',
          category_id: 'food',
          month: '2026-08-01',
          amount: '10000',
          created_at: '',
          updated_at: '',
        },
      ],
    })
    expect(insights.some((i) => i.text.includes('above your monthly budget'))).toBe(true)
  })

  it('never surfaces more than 4 insights', () => {
    const insights = computeInsights({
      transactions: [
        txn({ category_id: 'food', amount: '12000', category: { id: 'food', name: 'Food', icon: '🍔', color: null, type: 'expense' } }),
        txn({ category_id: 'fuel', amount: '9000', category: { id: 'fuel', name: 'Fuel', icon: '⛽', color: null, type: 'expense' } }),
        txn({ type: 'income', amount: '50000' }),
      ],
      previousTransactions: [
        txn({ category_id: 'food', amount: '1000', category: { id: 'food', name: 'Food', icon: '🍔', color: null, type: 'expense' } }),
        txn({ category_id: 'fuel', amount: '8000', category: { id: 'fuel', name: 'Fuel', icon: '⛽', color: null, type: 'expense' } }),
      ],
      budgets: [
        { id: 'b1', family_id: 'f1', category_id: 'food', month: '2026-08-01', amount: '100', created_at: '', updated_at: '' },
      ],
    })
    expect(insights.length).toBeLessThanOrEqual(4)
  })
})
