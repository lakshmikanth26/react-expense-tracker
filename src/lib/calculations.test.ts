import { describe, expect, it } from 'vitest'
import {
  computeBudgetUsage,
  computeCategoryTotals,
  computeSummary,
  fromPaise,
  summarizeAccountBalances,
  toPaise,
} from './calculations'

describe('toPaise / fromPaise', () => {
  it('round-trips without floating point drift', () => {
    expect(toPaise('250.50')).toBe(25050)
    expect(fromPaise(25050)).toBe(250.5)
    expect(toPaise(0.1) + toPaise(0.2)).toBe(30) // would be 30.000000000000004 in naive float math
  })
})

describe('computeSummary', () => {
  it('excludes transfers from income and expense', () => {
    const summary = computeSummary([
      { type: 'income', amount: '136000' },
      { type: 'expense', amount: '72450' },
      { type: 'transfer', amount: '10000' },
    ])
    expect(summary.income).toBe(136000)
    expect(summary.expense).toBe(72450)
    expect(summary.savings).toBe(63550)
    expect(summary.savingsRate).toBeCloseTo(46.73, 1)
  })

  it('returns a 0 savings rate when there is no income', () => {
    const summary = computeSummary([{ type: 'expense', amount: '500' }])
    expect(summary.savingsRate).toBe(0)
  })
})

describe('computeCategoryTotals', () => {
  it('computes percentages relative to the group total', () => {
    const totals = computeCategoryTotals([
      { category_id: 'food', amount: '300', type: 'expense' },
      { category_id: 'food', amount: '100', type: 'expense' },
      { category_id: 'transport', amount: '100', type: 'expense' },
    ])
    const food = totals.find((t) => t.categoryId === 'food')!
    expect(food.amount).toBe(400)
    expect(food.percentage).toBeCloseTo(80)
    expect(food.transactionCount).toBe(2)
  })
})

describe('computeBudgetUsage', () => {
  it('flags over-budget categories', () => {
    expect(computeBudgetUsage(12000, 10000).status).toBe('over')
    expect(computeBudgetUsage(8500, 10000).status).toBe('warning')
    expect(computeBudgetUsage(5000, 10000).status).toBe('ok')
  })
})

describe('summarizeAccountBalances', () => {
  it('treats a negative credit card balance as a liability, not a negative asset', () => {
    const summary = summarizeAccountBalances([
      { type: 'cash', current_balance: '5000' },
      { type: 'savings', current_balance: '120000' },
      { type: 'bank', current_balance: '45000' },
      { type: 'credit_card', current_balance: '-12500' },
    ])
    expect(summary.assets).toBe(170000)
    expect(summary.liabilities).toBe(12500)
    expect(summary.netWorth).toBe(157500)
  })
})
