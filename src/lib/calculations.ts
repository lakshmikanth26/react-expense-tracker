import type { Account, Transaction } from '@/types'
import { monthKeyOf } from './dates'

/**
 * All money math happens in integer paise (1 rupee = 100 paise), never in floating
 * point rupees — summing floats introduces cent-level drift once you have more than
 * a handful of transactions. PostgREST also returns `numeric` columns as strings, so
 * every entry point into this module accepts `number | string`.
 */
export function toPaise(amount: number | string): number {
  return Math.round(Number(amount) * 100)
}

export function fromPaise(paise: number): number {
  return paise / 100
}

type MoneyTxn = Pick<Transaction, 'type' | 'amount'>

/**
 * Income - Expenses, transfers excluded (they move money between accounts, they
 * are neither income nor expense). See §50 of the product spec.
 */
export function computeSummary(transactions: MoneyTxn[]): {
  income: number
  expense: number
  savings: number
  savingsRate: number
} {
  let incomePaise = 0
  let expensePaise = 0

  for (const t of transactions) {
    const paise = toPaise(t.amount)
    if (t.type === 'income') incomePaise += paise
    else if (t.type === 'expense') expensePaise += paise
  }

  const income = fromPaise(incomePaise)
  const expense = fromPaise(expensePaise)
  const savings = fromPaise(incomePaise - expensePaise)
  const savingsRate = incomePaise > 0 ? (savings / income) * 100 : 0

  return { income, expense, savings, savingsRate }
}

export interface MonthComparison {
  income: number
  expense: number
  savings: number
}

export function compareSummaries(
  current: ReturnType<typeof computeSummary>,
  previous: ReturnType<typeof computeSummary>
): MonthComparison {
  return {
    income: current.income - previous.income,
    expense: current.expense - previous.expense,
    savings: current.savings - previous.savings,
  }
}

export interface CategoryTotal {
  categoryId: string | null
  amount: number
  percentage: number
  transactionCount: number
}

/** Groups by category_id and computes each category's share of the total (expense or income only). */
export function computeCategoryTotals(transactions: Pick<Transaction, 'category_id' | 'amount' | 'type'>[]): CategoryTotal[] {
  const totalsPaise = new Map<string | null, number>()
  const counts = new Map<string | null, number>()
  let grandTotalPaise = 0

  for (const t of transactions) {
    const paise = toPaise(t.amount)
    totalsPaise.set(t.category_id, (totalsPaise.get(t.category_id) ?? 0) + paise)
    counts.set(t.category_id, (counts.get(t.category_id) ?? 0) + 1)
    grandTotalPaise += paise
  }

  return Array.from(totalsPaise.entries())
    .map(([categoryId, paise]) => ({
      categoryId,
      amount: fromPaise(paise),
      percentage: grandTotalPaise > 0 ? (paise / grandTotalPaise) * 100 : 0,
      transactionCount: counts.get(categoryId) ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MemberTotal {
  memberId: string | null
  amount: number
  transactionCount: number
}

export function computeMemberTotals(transactions: Pick<Transaction, 'member_id' | 'amount'>[]): MemberTotal[] {
  const totalsPaise = new Map<string | null, number>()
  const counts = new Map<string | null, number>()

  for (const t of transactions) {
    const paise = toPaise(t.amount)
    totalsPaise.set(t.member_id, (totalsPaise.get(t.member_id) ?? 0) + paise)
    counts.set(t.member_id, (counts.get(t.member_id) ?? 0) + 1)
  }

  return Array.from(totalsPaise.entries())
    .map(([memberId, paise]) => ({ memberId, amount: fromPaise(paise), transactionCount: counts.get(memberId) ?? 0 }))
    .sort((a, b) => b.amount - a.amount)
}

export type BudgetStatus = 'ok' | 'warning' | 'over'

export interface BudgetUsage {
  spent: number
  budgeted: number
  percentage: number
  remaining: number
  status: BudgetStatus
}

export function computeBudgetUsage(spent: number, budgeted: number): BudgetUsage {
  const percentage = budgeted > 0 ? (toPaise(spent) / toPaise(budgeted)) * 100 : 0
  const status: BudgetStatus = percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'ok'
  return {
    spent,
    budgeted,
    percentage,
    remaining: fromPaise(toPaise(budgeted) - toPaise(spent)),
    status,
  }
}

export interface AccountBalanceSummary {
  assets: number
  liabilities: number
  netWorth: number
}

/**
 * Credit cards are liabilities: a negative current_balance there means money owed,
 * not cash on hand, and must never be summed together with asset accounts as if it
 * were spendable money (§22 of the product spec).
 */
export function summarizeAccountBalances(accounts: Pick<Account, 'type' | 'current_balance'>[]): AccountBalanceSummary {
  let assetsPaise = 0
  let liabilitiesPaise = 0

  for (const account of accounts) {
    const paise = toPaise(account.current_balance)
    if (account.type === 'credit_card') {
      if (paise < 0) liabilitiesPaise += -paise
      else assetsPaise += paise
    } else if (paise >= 0) {
      assetsPaise += paise
    } else {
      liabilitiesPaise += -paise
    }
  }

  return {
    assets: fromPaise(assetsPaise),
    liabilities: fromPaise(liabilitiesPaise),
    netWorth: fromPaise(assetsPaise - liabilitiesPaise),
  }
}

export function filterByMonth<T extends { transaction_date: string }>(transactions: T[], monthKeyValue: string): T[] {
  const target = monthKeyOf(monthKeyValue)
  return transactions.filter((t) => monthKeyOf(t.transaction_date) === target)
}

export function groupByDateDescending<T extends { transaction_date: string }>(transactions: T[]): Array<[string, T[]]> {
  const groups = new Map<string, T[]>()
  for (const t of transactions) {
    const list = groups.get(t.transaction_date)
    if (list) list.push(t)
    else groups.set(t.transaction_date, [t])
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
}
