import type { Budget, Category, TransactionWithRelations } from '@/types'
import { computeBudgetUsage, computeCategoryTotals, computeSummary } from './calculations'
import { formatCurrency, formatPercent } from './formatters'

export interface Insight {
  icon: string
  text: string
}

interface ComputeInsightsInput {
  transactions: TransactionWithRelations[]
  previousTransactions: TransactionWithRelations[]
  budgets: Budget[]
}

const MIN_NOTABLE_CHANGE_PAISE = 50000 // ₹500 — below this, a swing isn't worth surfacing

export function computeInsights({ transactions, previousTransactions, budgets }: ComputeInsightsInput): Insight[] {
  const insights: Insight[] = []
  const summary = computeSummary(transactions)

  const expenses = transactions.filter((t) => t.type === 'expense')
  const previousExpenses = previousTransactions.filter((t) => t.type === 'expense')
  const categoryById = new Map<string, Pick<Category, 'name' | 'icon'>>()
  for (const t of expenses) {
    if (t.category_id && t.category && !categoryById.has(t.category_id)) categoryById.set(t.category_id, t.category)
  }

  const currentTotals = computeCategoryTotals(expenses)
  const previousTotals = new Map(computeCategoryTotals(previousExpenses).map((t) => [t.categoryId, t.amount]))

  let biggestIncrease: { categoryId: string; percentChange: number } | null = null
  let biggestDecrease: { categoryId: string; amountChange: number } | null = null

  for (const total of currentTotals) {
    if (!total.categoryId) continue
    const previousAmount = previousTotals.get(total.categoryId) ?? 0
    const change = total.amount - previousAmount

    if (previousAmount > 0) {
      const percentChange = (change / previousAmount) * 100
      if (percentChange > 10 && (!biggestIncrease || percentChange > biggestIncrease.percentChange)) {
        biggestIncrease = { categoryId: total.categoryId, percentChange }
      }
    }
    if (change < 0 && Math.abs(change) * 100 >= MIN_NOTABLE_CHANGE_PAISE && (!biggestDecrease || change < biggestDecrease.amountChange)) {
      biggestDecrease = { categoryId: total.categoryId, amountChange: change }
    }
  }

  if (biggestIncrease) {
    const cat = categoryById.get(biggestIncrease.categoryId)
    insights.push({
      icon: cat?.icon ?? '💡',
      text: `${cat?.name ?? 'A category'} spending increased ${formatPercent(biggestIncrease.percentChange, 0)} compared with last month.`,
    })
  }

  if (biggestDecrease) {
    const cat = categoryById.get(biggestDecrease.categoryId)
    insights.push({
      icon: '💡',
      text: `You spent ${formatCurrency(Math.abs(biggestDecrease.amountChange))} less on ${cat?.name ?? 'this category'} this month.`,
    })
  }

  const largestExpense = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0]
  if (largestExpense) {
    const label = largestExpense.description || largestExpense.category?.name || 'an expense'
    insights.push({ icon: '💡', text: `Your largest expense this month was ${label}.` })
  }

  insights.push({
    icon: '💰',
    text:
      summary.savings > 0
        ? `You saved ${formatCurrency(summary.savings)} this month — a ${formatPercent(summary.savingsRate)} savings rate.`
        : `Your savings rate is ${formatPercent(summary.savingsRate)}.`,
  })

  const spentByCategory = new Map(currentTotals.map((t) => [t.categoryId, t.amount]))
  for (const budget of budgets) {
    const spent = budget.category_id ? (spentByCategory.get(budget.category_id) ?? 0) : summary.expense
    const usage = computeBudgetUsage(spent, Number(budget.amount))
    if (usage.status === 'over') {
      const label = budget.category_id ? (categoryById.get(budget.category_id)?.name ?? 'A category') : 'Overall spending'
      insights.push({ icon: '⚠️', text: `${label} is above your monthly budget.` })
      break
    }
  }

  return insights.slice(0, 4)
}
