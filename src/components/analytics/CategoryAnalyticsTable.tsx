import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, PieChart } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { computeCategoryTotals } from '@/lib/calculations'
import { formatCurrency, formatPercent, formatSignedCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Category, TransactionWithRelations } from '@/types'

interface CategoryAnalyticsTableProps {
  transactions: TransactionWithRelations[]
  previousTransactions: TransactionWithRelations[]
  categories: Category[]
  /** Which transaction type this table summarizes. Defaults to 'expense'. */
  type?: 'expense' | 'savings'
}

export function CategoryAnalyticsTable({ transactions, previousTransactions, categories, type = 'expense' }: CategoryAnalyticsTableProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = transactions.filter((t) => t.type === type)
  const previousFiltered = previousTransactions.filter((t) => t.type === type)

  const totals = computeCategoryTotals(filtered)
  const previousTotals = computeCategoryTotals(previousFiltered)
  const previousByCategory = new Map(previousTotals.map((t) => [t.categoryId, t.amount]))

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const totalsByCategoryId = new Map(totals.map((t) => [t.categoryId, t]))

  const topLevelTotals = totals.filter((t) => !t.categoryId || !categoryById.get(t.categoryId)?.parent_id)

  if (topLevelTotals.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="Not enough data yet"
        description={type === 'savings' ? 'Add a few savings entries to see your category breakdown.' : 'Add a few expenses to see your category breakdown.'}
      />
    )
  }

  function toggle(categoryId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  return (
    <div className="divide-y">
      {topLevelTotals.map((total) => {
        const category = total.categoryId ? categoryById.get(total.categoryId) : null
        const subcategories = total.categoryId ? categories.filter((c) => c.parent_id === total.categoryId) : []
        const hasSubcategories = subcategories.length > 0
        const isOpen = total.categoryId ? expanded.has(total.categoryId) : false
        const previousAmount = previousByCategory.get(total.categoryId) ?? 0
        const diff = total.amount - previousAmount

        return (
          <div key={total.categoryId ?? 'uncategorized'}>
            <button
              type="button"
              onClick={() =>
                hasSubcategories && total.categoryId ? toggle(total.categoryId) : navigate(`/transactions?category=${total.categoryId ?? ''}`)
              }
              className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {hasSubcategories ? (
                isOpen ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )
              ) : (
                <span className="w-4 shrink-0" />
              )}
              <span className="text-xl leading-none">{category?.icon ?? '📋'}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{category?.name ?? 'Uncategorized'}</span>
                <span className="block text-xs text-muted-foreground">
                  {total.transactionCount} transaction{total.transactionCount === 1 ? '' : 's'} · {formatPercent(total.percentage)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{formatCurrency(total.amount)}</span>
                <span
                  className={cn(
                    'block text-xs tabular-nums',
                    type === 'savings' ? (diff >= 0 ? 'text-income' : 'text-expense') : diff <= 0 ? 'text-income' : 'text-expense'
                  )}
                >
                  {formatSignedCurrency(diff)}
                </span>
              </span>
            </button>

            {isOpen && hasSubcategories && (
              <div className="mb-2 ml-7 space-y-1 border-l pl-3">
                {subcategories.map((sub) => {
                  const subTotal = totalsByCategoryId.get(sub.id)
                  if (!subTotal) return null
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => navigate(`/transactions?category=${sub.id}`)}
                      className="flex w-full items-center gap-2 py-1.5 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span>{sub.icon}</span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{sub.name}</span>
                      <span className="tabular-nums">{formatCurrency(subTotal.amount)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
