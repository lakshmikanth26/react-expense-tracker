import { describe, expect, it } from 'vitest'
import {
  computeBudgetUsage,
  computeCategoryTotals,
  computeMemberTotals,
  computeMonthlySeries,
  computeSummary,
  filterByMonth,
  fromPaise,
  groupByDateDescending,
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
  it('excludes transfers from income, expense, and savings', () => {
    const summary = computeSummary([
      { type: 'income', amount: '136000' },
      { type: 'expense', amount: '72450' },
      { type: 'transfer', amount: '10000' },
    ])
    expect(summary.income).toBe(136000)
    expect(summary.expense).toBe(72450)
    expect(summary.savings).toBe(0)
    expect(summary.leftover).toBe(63550)
    expect(summary.savingsRate).toBe(0)
  })

  it('tallies savings-type transactions separately from expense, and factors them into leftover', () => {
    const summary = computeSummary([
      { type: 'income', amount: '100000' },
      { type: 'expense', amount: '40000' },
      { type: 'savings', amount: '25000' },
    ])
    expect(summary.expense).toBe(40000)
    expect(summary.savings).toBe(25000)
    expect(summary.leftover).toBe(35000)
    expect(summary.savingsRate).toBeCloseTo(25, 5)
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

describe('computeMonthlySeries', () => {
  it('fills in months with no transactions as zero, in chronological order', () => {
    const series = computeMonthlySeries(
      [
        { type: 'income', amount: '1000', transaction_date: '2026-06-15' },
        { type: 'expense', amount: '400', transaction_date: '2026-08-01' },
      ],
      '2026-06-01',
      '2026-08-01'
    )
    expect(series.map((p) => p.month)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01'])
    expect(series[0]).toMatchObject({ income: 1000, expense: 0, savings: 0, leftover: 1000 })
    expect(series[1]).toMatchObject({ income: 0, expense: 0, savings: 0, leftover: 0 })
    expect(series[2]).toMatchObject({ income: 0, expense: 400, savings: 0, leftover: -400 })
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

describe('computeMemberTotals', () => {
  it('groups by member_id, treating null (unassigned/"Family") as its own bucket', () => {
    const totals = computeMemberTotals([
      { member_id: 'alex', amount: '300' },
      { member_id: 'alex', amount: '200' },
      { member_id: null, amount: '100' },
    ])
    const alex = totals.find((t) => t.memberId === 'alex')!
    const family = totals.find((t) => t.memberId === null)!
    expect(alex.amount).toBe(500)
    expect(alex.transactionCount).toBe(2)
    expect(family.amount).toBe(100)
  })
})

describe('filterByMonth', () => {
  it('keeps only transactions whose date falls in the target month', () => {
    const filtered = filterByMonth(
      [
        { transaction_date: '2026-08-01' },
        { transaction_date: '2026-08-31' },
        { transaction_date: '2026-07-31' },
        { transaction_date: '2026-09-01' },
      ],
      '2026-08-15'
    )
    expect(filtered.map((t) => t.transaction_date)).toEqual(['2026-08-01', '2026-08-31'])
  })
})

describe('groupByDateDescending', () => {
  it('groups same-day transactions together and orders groups newest first', () => {
    const groups = groupByDateDescending([
      { transaction_date: '2026-08-01', id: 'a' },
      { transaction_date: '2026-08-03', id: 'b' },
      { transaction_date: '2026-08-01', id: 'c' },
    ])
    expect(groups.map(([date]) => date)).toEqual(['2026-08-03', '2026-08-01'])
    expect(groups.find(([date]) => date === '2026-08-01')![1]).toHaveLength(2)
  })
})
